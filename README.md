# 图像标注系统

这是一个用于可见光和红外图像标注的系统，支持 YOLO 检测和手动标注，并集成了阿里云 OSS 存储功能。

## 目录结构

```
├── backend/               # 后端Flask应用
│   ├── api/               # API端点
│   ├── database/          # 数据库相关文件
│   ├── models/            # YOLO模型文件
│   ├── repository/        # 数据访问层
│   ├── service/           # 业务逻辑
│   ├── utils/             # 工具函数
│   └── app.py             # 应用入口点
└── src/                   # 前端React应用
```

## 系统环境

### 操作系统

- Ubuntu 20.04 LTS (5.15.0-130-generic)
- x86_64 架构

### 前端环境

- Node.js: v22.14.0
- React: 18.3.1
- React DOM: 18.3.1
- React Router DOM: 6.29.0
- React Konva: 18.2.10
- Chakra UI: 2.10.6
- Vite: 5.1.0 (package.json)

### 后端环境

- Python: 3.8.20
- Flask: 2.3.3
- Werkzeug: 2.3.7
- Ultralytics: 8.3.81
- OpenCV Python: 4.8.0.76
- MySQL: 8.0.40

### 数据库

- MySQL 8.0.40 (Ubuntu 20.04.1)

## 技术栈

### 前端

- React 18
- TypeScript
- Vite
- Chakra UI & Ant Design
- React Konva（画布操作）
- Zustand（状态管理）
- Axios（HTTP 请求）

### 后端

- Flask 2.3.3
- MySQL
- Ultralytics YOLO v8
- 阿里云 OSS

## 安装指南

### 前端设置

1. 安装 Node.js (推荐 v18+)

2. 安装依赖

```bash
npm install
```

3. 配置环境变量
   编辑项目根目录下的`.env`文件，设置 API 地址：

```
REACT_APP_API_BASE_URL="http://后端服务器IP:5050/api/"
```

4. 开发模式运行

```bash
npm run dev
```

### 后端设置

1. 安装 Python 3.8+

2. 创建虚拟环境（推荐）

```bash
conda create -n label python=3.8 -y
conda activate label
```

3. 安装依赖

```bash
cd backend
pip install -r requirements.txt
pip install dill
pip install ultralytics==8.3.81
```

4. 配置数据库

   - 安装 MySQL 8.0+
   - 创建数据库：`image_annotation`
   - 导入数据库结构：

   ```bash
   mysql -u用户名 -p密码 image_annotation < backend/database/schema.sql
   ```

5. 配置环境变量
   编辑`backend/.env`文件：

```
MYSQL_HOST=localhost
MYSQL_USER=your_mysql_username
MYSQL_PASSWORD=your_mysql_password
MYSQL_DB=image_annotation

# 阿里云OSS配置（如需使用）
ALIYUN_OSS_ACCESS_KEY_ID=your_access_key_id
ALIYUN_OSS_ACCESS_KEY_SECRET=your_access_key_secret
ALIYUN_OSS_ENDPOINT=your_endpoint
ALIYUN_OSS_BUCKET_NAME=your_bucket_name

# OSS功能开关：设置为 True 开启，False 关闭
ENABLE_OSS=True
```

6. 启动后端服务

```bash
cd backend
python app.py
运行时如果报错：ImportError: libGL.so.1: cannot open shared object file: No such file or directory 则执行 conda install -c conda-forge libgl
```

服务将在 http://0.0.0.0:5050 运行

## 阿里云 OSS 配置

1. 注册阿里云账号并开通 OSS 服务

2. 创建 Bucket

   - 登录阿里云控制台
   - 进入对象存储 OSS
   - 创建 Bucket，记录 Bucket 名称
   - 根据需要设置权限（推荐：私有）

3. 创建 AccessKey
   - 进入阿里云控制台 -> 右上角头像 -> AccessKey 管理
   - 创建 AccessKey，保存 AccessKey ID 和 AccessKey Secret
4. 配置项目
   - 将上述信息填入`backend/.env`文件
   - 确保`ENABLE_OSS=True`以启用 OSS 功能

## 数据库配置

1. 安装 MySQL 8.0+

2. 创建用户和授权

```sql
CREATE USER 'your_username'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON image_annotation.* TO 'your_username'@'localhost';
FLUSH PRIVILEGES;
```

3. 配置环境变量
   编辑`backend/.env`文件，设置数据库连接信息：

```
MYSQL_HOST=localhost
MYSQL_USER=your_mysql_username
MYSQL_PASSWORD=your_mysql_password
MYSQL_DB=image_annotation
```

4. 初始化数据库

```bash
cd backend
python database/init_db.py
```

此脚本将：

- 创建数据库（如果不存在）
- 创建所需的表结构
- 自动处理表已存在的情况

## 模型配置

### 模型文件说明

系统使用三个预训练模型：

- `yolov8n.pt`: YOLOv8 基础模型
- `RGBDet.pt`: 可见光目标检测模型
- `IRDet.pt`: 红外目标检测模型

### 模型配置步骤

1. 下载模型文件

   - 从项目仓库下载模型文件
   - 将模型文件放置在`backend/weights/`目录下

2. 模型文件结构

```
backend/
└── weights/
    ├── yolov8n.pt    # YOLOv8基础模型
    ├── RGBDet.pt     # 可见光目标检测模型
    └── IRDet.pt      # 红外目标检测模型
```

3. 模型使用说明

   - 可见光图像使用`RGBDet.pt`模型
   - 红外图像使用`IRDet.pt`模型
   - 系统会自动根据图像类型选择对应的模型

4. 模型配置（settings.py）
   - 配置文件位置：`backend/config/settings.py`
   - 主要配置项：
     ```python
     # YOLO模型配置
     RGB_MODEL_PATH = os.path.join('weights', 'RGBDet.pt')  # 可见光模型路径
     IR_MODEL_PATH = os.path.join('weights', 'IRDet.pt')    # 红外模型路径
     ```
   - 配置说明：
     - 模型路径相对于 backend 目录
     - 如需使用自定义模型，修改对应的 MODEL_PATH
     - 确保路径与 weights 目录下的模型文件名一致

## 项目特性

- 支持可见光和红外图像的配对上传和标注
- 集成 YOLO 模型进行自动目标检测
- 手动标注和调整功能
- 标注数据的导入和导出
- 可选的阿里云 OSS 存储支持
- 项目和标签管理

## 部署命令

- conda activate label
- pip install gunicorn
- gunicorn -c gunicorn_label.conf.py app:app 该命令是启动该项目
- ps aux | grep "label" 查询正在运行的 label 进行
- kill -9 xxx 清除该进程，以达到关闭该项目的目的
