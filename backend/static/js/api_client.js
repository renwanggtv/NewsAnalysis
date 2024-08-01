/**
 * 发送新闻内容进行分析
 * @param {string} newsContent - 要分析的新闻内容
 * @param {string} modelSource - 模型来源 ('local', 'openai', 'claude' 等)
 * @param {string} apiKey - API 密钥 (如果需要)
 * @param {string} localModel - 本地模型名称 (如果使用本地模型)
 * @returns {Promise<Object>} 分析结果
 */
export async function analyzeNews(newsContent, modelSource, apiKey, localModel) {
    return apiRequest('/api/analyze', 'POST', {
        news: newsContent,
        modelSource,
        localModel,
        apiKey
    }, apiKey);
}

/**
 * 获取特定领域的详细描述
 * @param {string} areaName - 领域名称
 * @param {string} newsContent - 新闻内容
 * @param {string} modelSource - 模型来源
 * @param {string} apiKey - API 密钥 (如果需要)
 * @param {string} localModel - 本地模型名称 (如果使用本地模型)
 * @returns {Promise<Object>} 详细描述
 */
// export async function getDetailedDescription(areaName, newsContent, modelSource, apiKey, localModel) {
//     return apiRequest('/api/get_detailed_description', 'POST', {
//         areaName,
//         news: newsContent,
//         modelSource,
//         localModel,
//         apiKey
//     }, apiKey);
// }

/**
 * 获取特定领域的详细描述
 * @param {string} areaName - 领域名称
 * @returns {Promise<Object>} 详细描述
 */
export async function getDetailedDescription(areaName) {
    const newsContent = document.getElementById('newsInput').value;
    const modelSource = document.getElementById('modelSourceSelect').value;
    const apiKey = document.getElementById('apiKey')? "sk-proj-RNFaVI64U4ytH2OkB0ZOT3BlbkFJfzNN3sMr9ieVDuknvFHr" : document.getElementById('apiKey')?.value;
    const localModel = document.getElementById('localModel')?.value;

    return apiRequest('/api/get_detailed_description', 'POST', {
        areaName,
        news: newsContent,
        modelSource,
        localModel,
        apiKey
    }, apiKey);
}

/**
 * 获取可用的本地模型列表
 * @returns {Promise<string[]>} 本地模型名称列表
 */
export async function getLocalModels() {
    try {
        const response = await fetch('/api/get_local_models');
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        const data = await response.json();
        if (!Array.isArray(data)) {
            console.warn('Unexpected data format for local models:', data);
            return [];
        }
        return data;
    } catch (error) {
        console.error('Error in getLocalModels:', error);
        throw new Error(`获取本地模型列表失败: ${error.message}`);
    }
}

/**
 * 通用的 API 请求函数
 * @param {string} url - API 端点
 * @param {string} method - HTTP 方法
 * @param {Object} body - 请求体
 * @param {string} apiKey - API 密钥 (如果需要)
 * @returns {Promise<any>} API 响应数据
 */
async function apiRequest(url, method = 'GET', body = null, apiKey = null) {
    try {
        const headers = {
            'Content-Type': 'application/json'
        };
        if (apiKey) {
            headers['Authorization'] = `Bearer ${apiKey}`;
        }

        const options = {
            method,
            headers,
            body: body ? JSON.stringify(body) : null
        };

        const response = await fetch(url, options);

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`API Error Response:`, errorBody);
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorBody}`);
        }

        const data = await response.json();
        if (!data) {
            throw new Error('No data received from server');
        }

        return data;
    } catch (error) {
        console.error(`API request error for ${url}:`, error);
        throw new Error(`API 请求失败: ${error.message}`);
    }
}