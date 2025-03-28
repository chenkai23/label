import os
from dotenv import load_dotenv

# 加载 .env 文件
load_dotenv()

# 数据库配置
MYSQL_HOST = os.getenv('MYSQL_HOST')
MYSQL_USER = os.getenv('MYSQL_USER')
MYSQL_PASSWORD = os.getenv('MYSQL_PASSWORD')
MYSQL_DB = os.getenv('MYSQL_DB')

# 文件上传配置
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'uploads')
ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg'}
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB

# 阿里云OSS配置
ALIYUN_OSS_ACCESS_KEY_ID = os.getenv('ALIYUN_OSS_ACCESS_KEY_ID')
ALIYUN_OSS_ACCESS_KEY_SECRET = os.getenv('ALIYUN_OSS_ACCESS_KEY_SECRET')
ALIYUN_OSS_ENDPOINT = os.getenv('ALIYUN_OSS_ENDPOINT')
ALIYUN_OSS_BUCKET_NAME = os.getenv('ALIYUN_OSS_BUCKET_NAME')
ENABLE_OSS = os.getenv('ENABLE_OSS', 'False').lower() == 'true'

# YOLO模型配置
# MODEL_PATH = os.path.join('models', 'best.pt')
RGB_MODEL_PATH = os.path.join('weights', 'RGBDet.pt')
IR_MODEL_PATH = os.path.join('weights', 'IRDet.pt')