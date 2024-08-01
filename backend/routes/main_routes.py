from flask import Blueprint, render_template
from . import main_bp

@main_bp.route('/')
def index():
    return render_template('index.html')

def init_app(bp):
    bp.add_url_rule('/', 'index', index)
    # 添加其他主要路由...