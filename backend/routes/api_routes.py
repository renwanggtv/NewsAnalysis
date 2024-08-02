from flask import request, jsonify
from ..services.cache_service import cache_result, get_cached_result
import logging
import subprocess
from . import api_bp
from ..models.news_analyzer import NewsAnalyzer

logger = logging.getLogger(__name__)
analyzer = NewsAnalyzer()


@api_bp.route('/analyze', methods=['POST'])
def analyze():
    try:
        data = request.json
        news_content = data['news']
        model_source = data['modelSource']
        api_key = data.get('apiKey')
        local_model = data.get('localModel')

        logger.info(f"Received analysis request: {data}")
        analysis_result = analyzer.analyze_news(news_content, model_source, api_key, local_model)
        logger.info(f"Analysis result: {analysis_result}")
        return jsonify(analysis_result)
    except Exception as e:
        logger.error(f"Error in /analyze route: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500

@api_bp.route('/get_detailed_description', methods=['POST'])
def get_detailed_description():
    data = request.json
    area_name = data['areaName']
    news_content = data['news']
    model_source = data['modelSource']
    api_key = data.get('apiKey')
    local_model = data.get('localModel')

    try:
        description = analyzer.get_detailed_description(area_name, news_content, model_source, api_key, local_model)
        return jsonify(description)
    except Exception as e:
        logging.error(f"Detailed description error: {str(e)}")
        return jsonify({"error": str(e)}), 500

@api_bp.route('/api/get_local_models', methods=['GET'])
def get_local_models():
    try:
        models = analyzer.get_local_models()
        return jsonify(models)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def init_app(bp):
    bp.add_url_rule('/analyze', 'analyze', analyze, methods=['POST'])
    bp.add_url_rule('/get_detailed_description', 'get_detailed_description', get_detailed_description, methods=['POST'])
    bp.add_url_rule('/get_local_models', 'get_local_models', get_local_models, methods=['GET'])
    # 添加其他 API 路由...