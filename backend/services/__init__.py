# services/__init__.py

from .cache_service import cache_result, get_cached_result
from .model_service import (
    run_local_model,
    run_openai,
    run_claude,
    run_other_api,
    get_local_models,
    run_model
)

__all__ = [
    'cache_result',
    'get_cached_result',
    'run_local_model',
    'run_openai',
    'run_claude',
    'run_other_api',
    'get_local_models',
    'run_model'
]

def init_app(app):
    """初始化所有服务"""
    # 这里可以添加任何需要在应用启动时初始化的服务
    pass