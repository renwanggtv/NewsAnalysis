
import { initVisualization, updateVisualization } from './visualization.js';
import { setupUIControls, showNotification, updateProgressBar } from './ui_controls.js';
import { analyzeNews, getDetailedDescription, getLocalModels } from './api_client.js';
// import i18next from 'i18next';
// import HttpBackend from 'i18next-http-backend';
// import LanguageDetector from 'i18next-browser-languagedetector';
let currentNewsContent = '';
let cachedDescriptions = {};
let currentAnalysisResults = null;
import { AdvancedVisualization } from './AdvancedVisualization.js';

let visualization;
function init() {
    const elements = {
        modelSourceSelect: document.getElementById('modelSourceSelect'),
        apiKeyContainer: document.getElementById('apiKeyContainer'),
        localModelContainer: document.getElementById('localModelContainer'),
        localModelSelect: document.getElementById('localModel'),
        newsInput: document.getElementById('newsInput'),
        analyzeButton: document.getElementById('analyzeButton'),
        exportButton: document.getElementById('exportButton'),
        darkModeToggle: document.getElementById('darkModeToggle'),
        startTutorial: document.getElementById('startTutorial'),
    };
    visualization = new AdvancedVisualization("visualization");
    // initVisualization();
    setupUIControls(elements, handleAnalysis, handleExport, toggleDarkMode, startTutorial);
    loadSavedContent();
    if (elements.modelSourceSelect.value === 'local') {
        fetchLocalModels(elements.localModelSelect);
    }
}
// i18next
//   .use(HttpBackend)
//   .use(LanguageDetector)
//   .init({
//     fallbackLng: 'en',
//     debug: true,
//     backend: {
//       loadPath: '/locales/{{lng}}/{{ns}}.json'
//     }
//   });
//
// function changeLanguage(lang) {
//   i18next.changeLanguage(lang, (err, t) => {
//     if (err) return console.log('Something went wrong loading', err);
//     updateContent();
//   });
// }
//
// function updateContent() {
//   document.querySelectorAll('[data-i18n]').forEach(element => {
//     const key = element.getAttribute('data-i18n');
//     element.innerHTML = i18next.t(key);
//   });
// }
async function handleAnalysis() {
    const newsContent = document.getElementById('newsInput').value;
    const modelSource = document.getElementById('modelSourceSelect').value;
    const apiKey = document.getElementById('apiKey')? "sk-proj-RNFaVI64U4ytH2OkB0ZOT3BlbkFJfzNN3sMr9ieVDuknvFHr" : document.getElementById('apiKey')?.value;
    const localModel = document.getElementById('localModel')?.value;

    if (!newsContent) {
        showNotification('请输入新闻内容', 'warning');
        return;
    }

    currentNewsContent = newsContent;
    updateProgressBar(10);

    try {
        const data = await analyzeNews(newsContent, modelSource, apiKey, localModel);
        currentAnalysisResults = data;
        cachedDescriptions = {};
        if (data && (data.top_positive_areas || data.top_negative_areas)) {
            const visualizationData = {
                nodes: [
                    ...data.top_positive_areas.map(area => ({
                        id: area,
                        group: "positive",
                        impact: Math.random() * 100
                    })),
                    ...data.top_negative_areas.map(area => ({id: area, group: "negative", impact: Math.random() * 100}))
                ]
            };
            visualization.updateVisualization(visualizationData);

            updateProgressBar(100);
            showNotification('分析完成！', 'success');
        } else {
            throw new Error('Received invalid data format from server, data = ' + JSON.stringify(data));
        }
        // if (data && (data.top_positive_areas || data.top_negative_areas)) {
        //     updateVisualization(data);
        //     updateProgressBar(100);
        //     showNotification('分析完成！', 'success');
        // } else {
        //     throw new Error('Received invalid data format from server, data = ' + JSON.stringify(data));
        // }
    } catch (error) {
        handleError(error);
    }
}

function handleExport() {
    if (!currentAnalysisResults) {
        showNotification('没有可导出的分析结果', 'warning');
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Area,Impact\n";

    currentAnalysisResults.top_positive_areas.forEach(area => {
        csvContent += `${area},Positive\n`;
    });

    currentAnalysisResults.top_negative_areas.forEach(area => {
        csvContent += `${area},Negative\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "analysis_results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('分析结果已导出', 'success');
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    showNotification('深色模式已切换', 'info');
}

function startTutorial() {
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

function handleError(error) {
    console.error('Error:', error);
    updateProgressBar(0);
    showNotification(`操作失败: ${error.message}`, 'error');
}

function loadSavedContent() {
    const savedContent = localStorage.getItem('savedNewsContent');
    if (savedContent) {
        document.getElementById('newsInput').value = savedContent;
    }
}

async function fetchLocalModels(localModelSelect) {
    try {
        updateProgressBar(10);
        const models = await getLocalModels();
        updateLocalModelSelect(localModelSelect, models);
        updateProgressBar(100);
        if (models.length === 0) {
            showNotification('没有找到本地模型', 'warning');
        }
    } catch (error) {
        console.error('Error fetching local models:', error);
        showNotification('获取本地模型列表失败: ' + error.message, 'error');
        updateLocalModelSelect(localModelSelect, []);
    }
}

function updateLocalModelSelect(localModelSelect, models) {
    localModelSelect.innerHTML = '';
    if (models.length > 0) {
        models.forEach(model => {
            const option = document.createElement('option');
            option.value = model;
            option.textContent = model;
            localModelSelect.appendChild(option);
        });
    } else {
        const defaultOption = document.createElement('option');
        defaultOption.textContent = '没有可用的模型';
        localModelSelect.appendChild(defaultOption);
    }
}
export function showTipsModal(content) {
    const overlay = document.getElementById('overlay');
    const modalContent = document.getElementById('modalContent');
    modalContent.innerHTML = content;
    overlay.style.display = 'flex';
}

export function showDetailedInfo(data) {
    const modalContent = document.getElementById('modalContent');
    modalContent.innerHTML = `
        <h2>${data.name}</h2>
        <p><strong>影响力得分:</strong> ${data.impact}</p>
        <p><strong>相关系数:</strong> ${data.correlation}</p>
        <p><strong>解释:</strong> ${data.explanation}</p>
        <h3>关键词:</h3>
        <ul>
            ${data.keywords.map(keyword => `<li>${keyword}</li>`).join('')}
        </ul>
        <h3>相关股票:</h3>
        <ul>
            ${data.stocks.map(stock => `
                <li>
                    <strong>${stock.name}</strong> (${stock.code}): ${stock.impact}
                </li>
            `).join('')}
        </ul>
    `;
    document.getElementById('overlay').style.display = 'flex';
}

document.addEventListener('DOMContentLoaded', init);

// Close modal when clicking outside
document.getElementById('overlay').addEventListener('click', function(event) {
    if (event.target === this) {
        this.style.display = 'none';
    }
});

// Close modal when clicking close button
document.getElementById('closeBtn').addEventListener('click', function() {
    document.getElementById('overlay').style.display = 'none';
});
document.addEventListener('DOMContentLoaded', init);

window.addEventListener('resize', () => {
    if (visualization) {
        visualization.resize();
    }
});