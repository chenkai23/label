import os
import sys

# 添加项目根目录到 Python 路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from flask import Flask
from flask_cors import CORS
from api.project_api import project_bp
from api.image_api import image_bp
from api.annotation_api import annotation_bp

def create_app():
    app = Flask(__name__)
    
    # 配置CORS，允许所有来源访问
    CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

    # 注册蓝图
    app.register_blueprint(project_bp)
    app.register_blueprint(image_bp)
    app.register_blueprint(annotation_bp)
    
    return app

app = create_app()

if __name__ == '__main__':
    # 通过环境变量控制是否启用热重载
    use_reloader = os.getenv('FLASK_USE_RELOADER', 'false').lower() == 'true'
    
    # 设置主机为0.0.0.0，允许外部访问
    app.run(
        host='0.0.0.0', 
        port=5050, 
        debug=True,
        use_reloader=use_reloader
    )