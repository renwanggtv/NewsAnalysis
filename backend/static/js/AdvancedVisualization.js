// AdvancedVisualization.js

// 假设你已经在 HTML 中通过 CDN 或其他方式引入了 d3
// 例如：<script src="https://d3js.org/d3.v7.min.js"></script>
import { analyzeNews, getDetailedDescription, getLocalModels } from './api_client.js';
export class AdvancedVisualization {
  constructor(containerId) {
    this.container = d3.select(`#${containerId}`);
    this.svg = this.container.append("svg");
    this.defs = this.svg.append("defs");
    this.g = this.svg.append("g");
    this.zoom = d3.zoom().on("zoom", (event) => this.zoomed(event));
    this.svg.call(this.zoom);
    this.tooltip = this.container.append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);
    this.darkMode = false;
    this.cachedDescriptions = {};
    this.createGradients();
    this.createFilters();
    this.initializeSimulation();
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  createGradients() {
    // 主渐变
    const gradient = this.defs.append("radialGradient")
      .attr("id", "bubble-gradient")
      .attr("cx", "30%")
      .attr("cy", "30%")
      .attr("r", "70%");

    gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "rgba(255,255,255,0.8)");

    gradient.append("stop")
      .attr("offset", "70%")
      .attr("stop-color", "rgba(255,255,255,0.1)");

    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "rgba(255,255,255,0)");

    // 高光渐变
    const highlightGradient = this.defs.append("radialGradient")
      .attr("id", "bubble-highlight")
      .attr("cx", "15%")
      .attr("cy", "15%")
      .attr("r", "30%");

    highlightGradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "rgba(255,255,255,0.6)");

    highlightGradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "rgba(255,255,255,0)");
  }

  createFilters() {
    // 阴影滤镜
    const filter = this.defs.append("filter")
      .attr("id", "bubble-shadow")
      .attr("width", "180%")
      .attr("height", "180%")
      .attr("x", "-40%")
      .attr("y", "-40%");

    filter.append("feGaussianBlur")
      .attr("in", "SourceAlpha")
      .attr("stdDeviation", 4)
      .attr("result", "blur");

    filter.append("feOffset")
      .attr("in", "blur")
      .attr("dx", 4)
      .attr("dy", 4)
      .attr("result", "offsetBlur");

    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode")
      .attr("in", "offsetBlur");
    feMerge.append("feMergeNode")
      .attr("in", "SourceGraphic");

    // 文字描边滤镜
    const textStroke = this.defs.append("filter")
      .attr("id", "text-stroke")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");

    textStroke.append("feMorphology")
      .attr("operator", "dilate")
      .attr("radius", "2")
      .attr("in", "SourceAlpha")
      .attr("result", "thicken");

    textStroke.append("feFlood")
      .attr("flood-color", "white");

    textStroke.append("feComposite")
      .attr("in2", "thicken")
      .attr("operator", "in");

    const feMergeText = textStroke.append("feMerge");
    feMergeText.append("feMergeNode");
    feMergeText.append("feMergeNode")
      .attr("in", "SourceGraphic");
  }

  initializeSimulation() {
    this.simulation = d3.forceSimulation()
      .force("center", d3.forceCenter())
      .force("charge", d3.forceManyBody().strength(-100))
      .force("collide", d3.forceCollide().radius(d => d.radius + 2).iterations(2))
      .force("x", d3.forceX().strength(0.07))
      .force("y", d3.forceY().strength(0.07));
  }

  updateVisualization(data) {
    this.currentData = data;
    if (!data) return;

    const color = d3.scaleOrdinal()
      .domain(["positive", "negative"])
      .range(this.darkMode ? ["#4CAF50", "#F44336"] : ["#2ECC71", "#E74C3C"]);

    const impactScale = d3.scaleLinear()
      .domain([0, d3.max(data.nodes, d => d.impact)])
      .range([30, 80]);

    const nodes = data.nodes.map(d => ({
      ...d,
      radius: impactScale(d.impact)
    }));

    this.simulation.nodes(nodes)
      .force("center", d3.forceCenter(this.width / 2, this.height / 2))
      .on("tick", () => this.ticked());

    const node = this.g.selectAll(".node")
      .data(nodes, d => d.id)
      .join(
        enter => this.enterNode(enter, color),
        update => this.updateNode(update, color),
        exit => this.exitNode(exit)
      );

    this.simulation.alpha(1).restart();
  }

  enterNode(enter, color) {
    const nodeEnter = enter.append("g")
      .attr("class", "node")
      .call(this.drag())
      .on("click", (event, d) => this.handleNodeClick(event, d))
      .attr("cursor", "pointer");

    nodeEnter.append("circle")
      .attr("r", 0)
      .attr("fill", d => color(d.group))
      .attr("stroke", "rgba(255,255,255,0.5)")
      .attr("stroke-width", 2)
      .attr("filter", "url(#bubble-shadow)")
      .transition()
      .duration(1000)
      .ease(d3.easeBounceOut)
      .attr("r", d => d.radius);

    nodeEnter.append("circle")
      .attr("r", 0)
      .attr("fill", "url(#bubble-gradient)")
      .attr("opacity", 0.8)
      .transition()
      .duration(1000)
      .ease(d3.easeBounceOut)
      .attr("r", d => d.radius * 0.95);

    nodeEnter.append("circle")
      .attr("r", 0)
      .attr("fill", "url(#bubble-highlight)")
      .attr("opacity", 0.6)
      .transition()
      .duration(1000)
      .ease(d3.easeBounceOut)
      .attr("r", d => d.radius * 0.95);

    nodeEnter.append("text")
      .attr("dy", ".35em")
      .attr("text-anchor", "middle")
      .text(d => d.id)
      .style("font-size", "0px")
      .style("fill", this.darkMode ? "#fff" : "#000")
      .style("font-weight", "bold")
      .attr("filter", "url(#text-stroke)")
      .transition()
      .duration(1000)
      .style("font-size", d => `${d.radius / 3}px`);

    return nodeEnter;
  }

  updateNode(update, color) {
    update.select("circle:first-child")
      .transition()
      .duration(1000)
      .attr("r", d => d.radius)
      .attr("fill", d => color(d.group));

    update.select("circle:nth-child(2)")
      .transition()
      .duration(1000)
      .attr("r", d => d.radius * 0.95);

    update.select("circle:nth-child(3)")
      .transition()
      .duration(1000)
      .attr("r", d => d.radius * 0.95);

    update.select("text")
      .transition()
      .duration(1000)
      .style("font-size", d => `${d.radius / 3}px`);

    return update;
  }

  exitNode(exit) {
    return exit.transition()
      .duration(1000)
      .attr("transform", d => `translate(${this.width / 2},${this.height / 2}) scale(0)`)
      .remove();
  }

  ticked() {
    this.g.selectAll(".node")
      .attr("transform", d => `translate(${d.x},${d.y})`)
      .attr("opacity", d => {
        const distanceFromCenter = Math.sqrt(Math.pow(d.x - this.width / 2, 2) + Math.pow(d.y - this.height / 2, 2));
        return 1 - Math.min(distanceFromCenter / (Math.min(this.width, this.height) / 2), 1) * 0.3;
      });
  }

  handleNodeClick(event, d) {
    if (d.group === 0) return;

    this.showTipsModal('<div class="spinner"></div><p>分析中，请稍候...</p>');

    if (this.cachedDescriptions[d.id]) {
      this.showDetailedInfo(this.cachedDescriptions[d.id]);
    } else {
      getDetailedDescription(d.id)
        .then(data => {
          this.cachedDescriptions[d.id] = data;
          this.showDetailedInfo(data);
        })
        .catch(error => {
          console.error('Error:', error);
          this.showTipsModal("获取详细信息时出错");
        });
    }
  }
showTipsModal(content) {
    const overlay = document.getElementById('overlay');
    const modalContent = document.getElementById('modalContent');
    modalContent.innerHTML = content;
    overlay.style.display = 'flex';
}

hideTipsModal() {
    const overlay = document.getElementById('overlay');
    overlay.style.display = 'none';
}

showDetailedInfo(data) {
    const modalContent = `
        <h3>${data.name}</h3>
        <p><strong>影响力得分:</strong> ${data.impact}</p>
        <p><strong>相关系数:</strong> ${data.correlation}</p>
        <p><strong>解释:</strong> ${data.explanation}</p>
        <h4>关键词</h4>
        <p>${data.keywords.join(', ')}</p>
        <h4>相关股票</h4>
        <ul>
            ${data.stocks.map(stock => `<li>${stock.name} (${stock.code}): ${stock.impact}</li>`).join('')}
        </ul>
    `;
    this.showTipsModal(modalContent);

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
  drag() {
    return d3.drag()
      .on("start", (event, d) => {
        if (!event.active) this.simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on("end", (event, d) => {
        if (!event.active) this.simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });
  }

  showDetails(event, d) {
    this.tooltip.transition()
      .duration(200)
      .style("opacity", .9);
    this.tooltip.html(`
      <strong>${d.id}</strong><br/>
      Impact: ${d.impact}<br/>
      Group: ${d.group}
    `)
      .style("left", (event.pageX) + "px")
      .style("top", (event.pageY - 28) + "px");
  }

  updateLegend(color) {
    const legendData = [
      { label: "Positive Impact", color: color("positive") },
      { label: "Negative Impact", color: color("negative") }
    ];

    const legend = this.legend.selectAll(".legend-item")
      .data(legendData)
      .join("g")
      .attr("class", "legend-item")
      .attr("transform", (d, i) => `translate(0,${i * 20})`);

    legend.selectAll("rect")
      .data(d => [d])
      .join("rect")
      .attr("x", 0)
      .attr("width", 18)
      .attr("height", 18)
      .style("fill", d => d.color);

    legend.selectAll("text")
      .data(d => [d])
      .join("text")
      .attr("x", 24)
      .attr("y", 9)
      .attr("dy", ".35em")
      .style("fill", this.darkMode ? "#fff" : "#000")
      .text(d => d.label);

    this.legend.attr("transform", `translate(${this.width - 150},20)`);
  }

  toggleDarkMode() {
    this.darkMode = !this.darkMode;
    this.container.classed("dark-mode", this.darkMode);
    this.updateVisualization(this.currentData);
  }

  switchToCanvas() {
    this.useCanvas = true;
    this.svg.remove();
    this.canvas = this.container.append("canvas")
      .attr("width", this.width * this.pixelRatio)
      .attr("height", this.height * this.pixelRatio)
      .style("width", `${this.width}px`)
      .style("height", `${this.height}px`);
    this.context = this.canvas.node().getContext("2d");
    this.context.scale(this.pixelRatio, this.pixelRatio);

    // 为 Canvas 添加事件监听
    this.canvas.call(d3.drag()
      .subject(() => this.findNode(d3.event.x, d3.event.y))
      .on("start", (event, d) => this.dragstarted(event, d))
      .on("drag", (event, d) => this.dragged(event, d))
      .on("end", (event, d) => this.dragended(event, d)));

    this.canvas.on("click", (event) => {
      const node = this.findNode(event.offsetX, event.offsetY);
      if (node) {
        this.showDetails(event, node);
      }
    });

    // 重新初始化模拟
    this.initializeSimulation();
    this.updateVisualization(this.currentData);
  }
  tickCanvas() {
    this.context.clearRect(0, 0, this.width, this.height);
    this.context.save();
    this.context.translate(this.width / 2, this.height / 2);

    // 绘制节点
    this.currentData.nodes.forEach(d => {
      this.context.beginPath();
      this.context.moveTo(d.x + d.radius, d.y);
      this.context.arc(d.x, d.y, d.radius, 0, 2 * Math.PI);
      this.context.fillStyle = d.group === "positive" ? "#2ECC71" : "#E74C3C";
      this.context.fill();
      this.context.strokeStyle = "#fff";
      this.context.lineWidth = 2;
      this.context.stroke();

      // 绘制文本
      this.context.font = `${d.radius / 3}px Arial`;
      this.context.fillStyle = this.darkMode ? "#fff" : "#000";
      this.context.textAlign = "center";
      this.context.textBaseline = "middle";
      this.context.fillText(d.id, d.x, d.y);
    });

    this.context.restore();
  }

  tickSVG() {
    // 原来的 SVG tick 逻辑
    this.g.selectAll(".node")
      .attr("transform", d => `translate(${d.x},${d.y})`);
  }

  findNode(x, y) {
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const adjustedX = x - centerX;
    const adjustedY = y - centerY;

    for (let i = this.currentData.nodes.length - 1; i >= 0; --i) {
      const node = this.currentData.nodes[i];
      const dx = adjustedX - node.x;
      const dy = adjustedY - node.y;
      if (dx * dx + dy * dy < node.radius * node.radius) {
        return node;
      }
    }
    return null;
  }

  dragstarted(event, d) {
    if (!event.active) this.simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  dragged(event, d) {
    d.fx = event.x - this.width / 2;
    d.fy = event.y - this.height / 2;
  }

  dragended(event, d) {
    if (!event.active) this.simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

  resize() {
    const containerRect = this.container.node().getBoundingClientRect();
    this.width = containerRect.width;
    this.height = containerRect.height;

    if (this.useCanvas) {
      this.canvas
        .attr("width", this.width * this.pixelRatio)
        .attr("height", this.height * this.pixelRatio)
        .style("width", `${this.width}px`)
        .style("height", `${this.height}px`);
      this.context.scale(this.pixelRatio, this.pixelRatio);
    } else {
      this.svg.attr("viewBox", [0, 0, this.width, this.height]);
    }

    this.updateVisualization(this.currentData);
  }

  toggleDarkMode() {
    this.darkMode = !this.darkMode;
    this.container.classed("dark-mode", this.darkMode);
    if (this.useCanvas) {
      this.tickCanvas(); // 重新绘制 Canvas
    } else {
      this.updateVisualization(this.currentData);
    }
  }
}