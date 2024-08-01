# routes/__init__.py

from flask import Blueprint

# 创建蓝图
main_bp = Blueprint('main', __name__)
api_bp = Blueprint('api', __name__, url_prefix='/api')

# 导入路由模块
from . import main_routes, api_routes

# 注册路由
main_routes.init_app(main_bp)
api_routes.init_app(api_bp)

def init_app(app):
    """初始化所有路由"""
    app.register_blueprint(main_bp)
    app.register_blueprint(api_bp)