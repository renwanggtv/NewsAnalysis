from flask import Flask
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from config import Config
from routes import init_app as init_routes
from services import init_app as init_services
import subprocess
import json
from flask import jsonify
import logging
import sys

logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('/var/log/news_analyzer.log')
    ]
)
logger = logging.getLogger(__name__)
app = Flask(__name__,
            template_folder='templates',
            static_folder='static',
            static_url_path='')

app.config.from_object(Config)

limiter = Limiter(get_remote_address, app=app, default_limits=["200 per day", "50 per hour"])

# 初始化路由和服务
init_routes(app)
init_services(app)

# 添加中间件函数来设置响应头
@app.after_request
def add_header(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    if response.headers.get('Content-Type') == 'application/javascript':
        response.headers['Content-Type'] = 'application/javascript; charset=utf-8'
    return response

@app.errorhandler(Exception)
def handle_exception(e):
    # 记录错误
    app.logger.error(f"Unhandled exception: {str(e)}")
    # 返回 JSON 响应
    return jsonify({"error": "An unexpected error occurred"}), 500

if __name__ == '__main__':
    app.run(debug=True)