# 图像标注系统

这是一个用于可见光和红外图像标注的系统，支持YOLO检测和手动标注，并集成了阿里云OSS存储功能。

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
- Axios（HTTP请求）

### 后端
- Flask 2.3.3
- MySQL
- Ultralytics YOLO v8
- 阿里云OSS

## 安装指南

### 前端设置

1. 安装Node.js (推荐v18+)

2. 安装依赖
```bash
npm install
```

3. 配置环境变量
编辑项目根目录下的`.env`文件，设置API地址：
```
REACT_APP_API_BASE_URL="http://后端服务器IP:5050/api/"
```

4. 开发模式运行
```bash
npm run dev
```

5. 构建生产版本
```bash
npm run build
```

### 后端设置

1. 安装Python 3.8+

2. 创建虚拟环境（推荐）
```bash
conda create -n label python=3.8 -y
```

3. 安装依赖
```bash
cd backend
pip install -r requirements.txt
```

4. 配置数据库
   - 安装MySQL 8.0+
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
```
服务将在 http://0.0.0.0:5050 运行

## 阿里云OSS配置

1. 注册阿里云账号并开通OSS服务

2. 创建Bucket
   - 登录阿里云控制台
   - 进入对象存储OSS
   - 创建Bucket，记录Bucket名称
   - 根据需要设置权限（推荐：私有）

3. 创建AccessKey
   - 进入阿里云控制台 -> 右上角头像 -> AccessKey管理
   - 创建AccessKey，保存AccessKey ID和AccessKey Secret
   
4. 配置项目
   - 将上述信息填入`backend/.env`文件
   - 确保`ENABLE_OSS=True`以启用OSS功能

## 数据库配置

1. 安装MySQL 8.0+

2. 创建用户和授权
```sql
CREATE USER 'your_username'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON image_annotation.* TO 'your_username'@'localhost';
FLUSH PRIVILEGES;
```

3. 创建数据库
```sql
CREATE DATABASE image_annotation CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

4. 导入数据库结构
```bash
mysql -u your_username -p your_password image_annotation < backend/database/schema.sql
```

## 项目特性

- 支持可见光和红外图像的配对上传和标注
- 集成YOLO模型进行自动目标检测
- 手动标注和调整功能
- 标注数据的导入和导出
- 可选的阿里云OSS存储支持
- 项目和标签管理
