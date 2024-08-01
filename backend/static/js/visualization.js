// visualization.js

import { analyzeNews, getDetailedDescription, getLocalModels } from './api_client.js';
const width = 1000;
const height = 600;
const nodeRadius = 8;

let svg, simulation, cachedDescriptions = {};
export function initVisualization() {
  const container = d3.select("#visualization");
  const svg = container.append("svg");

  const simulation = d3.forceSimulation()
    .force("center", d3.forceCenter())
    .force("charge", d3.forceManyBody().strength(-200))
    .force("collide", d3.forceCollide().radius(d => d.radius + 1));

  return { svg, simulation, container };
}

export function updateVisualization(data, { svg, simulation, container }) {
  const containerRect = container.node().getBoundingClientRect();
  const width = containerRect.width;
  const height = containerRect.height;

  svg.attr("viewBox", [0, 0, width, height]);

  const color = d3.scaleOrdinal()
    .domain(["positive", "negative"])
    .range(["#4CAF50", "#F44336"]);

  const fontSizeScale = d3.scaleLinear()
    .domain([300, 1200])
    .range([8, 14])
    .clamp(true);

  const radiusScale = d3.scaleLinear()
    .domain([300, 1200])
    .range([20, 40])
    .clamp(true);

  const fontSize = fontSizeScale(width);
  const radius = radiusScale(width);

  const nodes = data.top_positive_areas.map(area => ({ id: area, group: "positive", radius }))
    .concat(data.top_negative_areas.map(area => ({ id: area, group: "negative", radius })));

  simulation.nodes(nodes)
    .force("center", d3.forceCenter(width / 2, height / 2))
    .on("tick", ticked);

  const node = svg.selectAll(".node")
    .data(nodes, d => d.id)
    .join(
      enter => {
        const nodeEnter = enter.append("g")
          .attr("class", "node")
          .call(drag(simulation));

        nodeEnter.append("circle")
          .attr("r", d => d.radius)
          .attr("fill", d => color(d.group))
          .attr("stroke", "#fff")
          .attr("stroke-width", 2);

        nodeEnter.append("text")
          .attr("dy", ".35em")
          .attr("text-anchor", "middle")
          .text(d => d.id)
          .style("font-size", `${fontSize}px`)
          .style("fill", "#fff");

        return nodeEnter;
      },
      update => update,
      exit => exit.remove()
    );

  function ticked() {
    node.attr("transform", d => `translate(${d.x},${d.y})`);
  }

  function drag(simulation) {
    function dragstarted(event) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
  }
}

window.addEventListener('resize', () => {
  const container = d3.select("#visualization");
  const svg = container.select("svg");
  const containerRect = container.node().getBoundingClientRect();
  svg.attr("viewBox", [0, 0, containerRect.width, containerRect.height]);
});

function showTipsModal(content) {
    const overlay = document.getElementById('overlay');
    const modalContent = document.getElementById('modalContent');
    modalContent.innerHTML = content;
    overlay.style.display = 'flex';
}

function hideTipsModal() {
    const overlay = document.getElementById('overlay');
    overlay.style.display = 'none';
}

function showDetailedInfo(data) {
    const modalContent = `
        <h3>${data.name}</h3>
        <p><strong>影响力得分:</strong> ${data.impact}</p>
        <p><strong>相关系数:</strong> ${data.correlation}</p>
        <p><strong>解释:</strong> ${data.explanation}</p>
        <h4>关键词</h4>
        <p>${data.keywords?.join(', ')}</p>
        <h4>相关股票</h4>
        <ul>
            ${data.stocks.map(stock => `<li>${stock.name} (${stock.code}): ${stock.impact}</li>`).join('')}
        </ul>
    `;
    showTipsModal(modalContent);

    // 添加关键词和股票节点
    // const keywordNodes = data.keywords.map(keyword => ({ id: keyword, group: 3 }));
    // const stockNodes = data.stocks.map(stock => ({ id: stock.code, group: 4 }));
    // const newNodes = [...keywordNodes, ...stockNodes];
    //
    // const newLinks = [
    //     ...keywordNodes.map(node => ({ source: data.name, target: node.id })),
    //     ...stockNodes.map(node => ({ source: data.name, target: node.id }))
    // ];
    //
    // simulation.nodes([...simulation.nodes(), ...newNodes]);
    // simulation.force("link").links([...simulation.force("link").links(), ...newLinks]);
    //
    // const node = svg.select(".nodes")
    //     .selectAll("g")
    //     .data([...simulation.nodes()])
    //     .enter().append("g")
    //     .call(d3.drag()
    //         .on("start", dragstarted)
    //         .on("drag", dragged)
    //         .on("end", dragended));
    //
    // node.append("circle")
    //     .attr("r", nodeRadius)
    //     .attr("fill", d => d.group === 3 ? "#4292c6" : d.group === 4 ? "#fe9929" : "#666");
    //
    // node.append("text")
    //     .attr("dx", 12)
    //     .attr("dy", ".35em")
    //     .text(d => d.id)
    //     .style("font-size", "10px");
    //
    // const link = svg.select(".links")
    //     .selectAll("line")
    //     .data([...simulation.force("link").links()])
    //     .enter().append("line")
    //     .attr("stroke", "#999")
    //     .attr("stroke-opacity", 0.6);
    //
    // simulation.alpha(1).restart();
}

// function dragstarted(event) {
//     if (!event.active) simulation.alphaTarget(0.3).restart();
//     event.subject.fx = event.subject.x;
//     event.subject.fy = event.subject.y;
// }
//
// function dragged(event) {
//     event.subject.fx = event.x;
//     event.subject.fy = event.y;
// }
//
// function dragended(event) {
//     if (!event.active) simulation.alphaTarget(0);
//     event.subject.fx = null;
//     event.subject.fy = null;
// }

// ui_controls.js

export function setupUIControls(elements, handleAnalysis, handleExport, toggleDarkMode, startTutorial) {
    elements.modelSourceSelect.addEventListener('change', () => handleModelSourceChange(elements));
    elements.analyzeButton.addEventListener('click', handleAnalysis);
    elements.exportButton.addEventListener('click', handleExport);
    elements.darkModeToggle.addEventListener('click', toggleDarkMode);
    elements.startTutorial.addEventListener('click', startTutorial);
    elements.newsInput.addEventListener('input', autoSave);
    document.getElementById('closeBtn').addEventListener('click', hideTipsModal);
    document.getElementById('overlay').addEventListener('click', function(event) {
        if (event.target === this) {
            hideTipsModal();
        }
    });
    // 添加键盘快捷键
    document.addEventListener('keydown', (event) => {
        if (event.ctrlKey && event.key === 'Enter') {
            handleAnalysis();
        }
    });
}

function handleModelSourceChange(elements) {
    const modelSource = elements.modelSourceSelect.value;
    if (modelSource === 'local') {
        elements.apiKeyContainer.style.display = 'none';
        elements.localModelContainer.style.display = 'block';
        fetchLocalModels(elements.localModelSelect);
    } else {
        elements.apiKeyContainer.style.display = 'block';
        elements.localModelContainer.style.display = 'none';
    }
}

function autoSave() {
    const newsContent = document.getElementById('newsInput').value;
    localStorage.setItem('savedNewsContent', newsContent);
}

export function loadSavedContent() {
    const savedContent = localStorage.getItem('savedNewsContent');
    if (savedContent) {
        document.getElementById('newsInput').value = savedContent;
    }
}

async function fetchLocalModels(localModelSelect) {
    try {
        const response = await fetch('/api/get_local_models');
        const models = await response.json();
        updateLocalModelSelect(localModelSelect, models);
    } catch (error) {
        console.error('Error fetching local models:', error);
        showNotification('获取本地模型列表失败', 'error');
    }
}

function updateLocalModelSelect(localModelSelect, models) {
    localModelSelect.innerHTML = '';
    models.forEach(model => {
        const option = document.createElement('option');
        option.value = model;
        option.textContent = model;
        localModelSelect.appendChild(option);
    });
}

export function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 5000);
}

export function updateProgressBar(progress) {
    const progressBar = document.getElementById('progressBar');
    progressBar.style.width = `${progress}%`;
    progressBar.textContent = `${progress}%`;
}

export function startTutorial() {
    const steps = [
        { element: '#newsInput', intro: '在这里输入您想分析的新闻内容。' },
        { element: '#modelSourceSelect', intro: '选择您想使用的模型来源。' },
        { element: '#analyzeButton', intro: '点击这里开始分析。' },
        { element: '#visualization', intro: '分析结果将在这里以图表形式展示。' },
        { element: '#exportButton', intro: '您可以在这里导出分析结果。' }
    ];

    introJs().setOptions({
        steps: steps,
        exitOnOverlayClick: false,
        exitOnEsc: false,
        disableInteraction: true
    }).start();
}