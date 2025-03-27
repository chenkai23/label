import os
from dotenv import load_dotenv

# 加载 .env 文件
load_dotenv()

# 数据库配置
MYSQL_HOST = os.getenv('MYSQL_HOST', 'localhost')
MYSQL_USER = os.getenv('MYSQL_USER', 'root')
MYSQL_PASSWORD = os.getenv('MYSQL_PASSWORD', '123456')
MYSQL_DB = os.getenv('MYSQL_DB', 'image_annotation')

# 文件上传配置
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'uploads')
ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg'}
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB

# YOLO模型配置
# MODEL_PATH = os.path.join('models', 'best.pt')
RGB_MODEL_PATH = os.path.join('weights', 'RGBDet.pt')
IR_MODEL_PATH = os.path.join('weights', 'IRDet.pt')