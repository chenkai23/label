from ultralytics import YOLO
import numpy as np
import cv2
import requests
from typing import List, Dict, Any
import tempfile
import os
import torch
import base64

class Detector:
    def __init__(self, model_path: str):
        self.model = YOLO(model_path)
        # 定义 COCO 数据集的类别名称
        self.names = {
            0: 'person', 1: 'bicycle', 2: 'car', 3: 'motorcycle', 4: 'airplane',
            5: 'bus', 6: 'train', 7: 'truck', 8: 'boat', 9: 'traffic light',
            10: 'fire hydrant', 11: 'stop sign', 12: 'parking meter', 13: 'bench',
            14: 'bird', 15: 'cat', 16: 'dog', 17: 'horse', 18: 'sheep', 19: 'cow',
            20: 'elephant', 21: 'bear', 22: 'zebra', 23: 'giraffe', 24: 'backpack',
            25: 'umbrella', 26: 'handbag', 27: 'tie', 28: 'suitcase', 29: 'frisbee',
            30: 'skis', 31: 'snowboard', 32: 'sports ball', 33: 'kite', 34: 'baseball bat',
            35: 'baseball glove', 36: 'skateboard', 37: 'surfboard', 38: 'tennis racket',
            39: 'bottle', 40: 'wine glass', 41: 'cup', 42: 'fork', 43: 'knife',
            44: 'spoon', 45: 'bowl', 46: 'banana', 47: 'apple', 48: 'sandwich',
            49: 'orange', 50: 'broccoli', 51: 'carrot', 52: 'hot dog', 53: 'pizza',
            54: 'donut', 55: 'cake', 56: 'chair', 57: 'couch', 58: 'potted plant',
            59: 'bed', 60: 'dining table', 61: 'toilet', 62: 'tv', 63: 'laptop',
            64: 'mouse', 65: 'remote', 66: 'keyboard', 67: 'cell phone', 68: 'microwave',
            69: 'oven', 70: 'toaster', 71: 'sink', 72: 'refrigerator', 73: 'book',
            74: 'clock', 75: 'vase', 76: 'scissors', 77: 'teddy bear', 78: 'hair drier',
            79: 'toothbrush'
        }
        print(f"Model loaded successfully from {model_path}")

    def preprocess_image(self, image_url: str) -> np.ndarray:
        """预处理图像"""
        try:
            # 如果是 base64 图片
            if image_url.startswith('data:'):
                # 获取实际的 base64 数据
                base64_data = image_url.split(',')[1]
                # 解码 base64 数据
                image_data = base64.b64decode(base64_data)
                nparr = np.frombuffer(image_data, np.uint8)
                image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            else:
                # 如果是普通 URL
                response = requests.get(image_url, verify=False)
                nparr = np.frombuffer(response.content, np.uint8)
                image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if image is None:
                raise Exception("Failed to load image")
            
            return image
        except Exception as e:
            print(f"Error preprocessing image: {str(e)}")
            raise

    def detect(self, image_url: str, image_type: str = 'visible') -> List[Dict[str, Any]]:
        """执行目标检测"""
        try:
            # 加载和预处理图像
            image = self.preprocess_image(image_url)
            height, width = image.shape[:2]
            
            # 创建临时文件保存图像
            with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as temp_file:
                cv2.imwrite(temp_file.name, image)
                
                try:
                    # 执行检测
                    results = self.model.predict(
                        source=temp_file.name,
                        conf=0.5,  # 置信度阈值
                        iou=0.5,   # NMS IOU 阈值
                        verbose=False,
                        save=False,
                        device='mps'  # 使用 CPU 进行推理
                    )
                finally:
                    # 确保删除临时文件
                    os.unlink(temp_file.name)
            
            # 处理检测结果
            annotations = []
            result = results[0]  # 获取第一个结果
            
            print(f"Processing detection results: {result}")  # 添加调试信息
            
            # 如果结果是张量，直接处理张量数据
            if torch.is_tensor(result):
                # 转换为 numpy 数组
                detections = result.cpu().numpy()
                
                print(f"Detections shape: {detections.shape}")  # 添加调试信息
                print(f"Detections: {detections}")  # 添加调试信息
                
                # 处理每个检测框
                for detection in detections:
                    x1, y1, x2, y2, conf, cls_idx = detection
                    
                    # 确保坐标在图像范围内
                    x1 = float(max(0, min(x1, width)))
                    y1 = float(max(0, min(y1, height)))
                    x2 = float(max(0, min(x2, width)))
                    y2 = float(max(0, min(y2, height)))
                    
                    # 计算宽度和高度
                    width_box = x2 - x1
                    height_box = y2 - y1
                    
                    # 获取类别名称
                    cls_idx = int(cls_idx)
                    label = self.names.get(cls_idx, f'class_{cls_idx}')
                    
                    annotations.append({
                        'bbox': [x1, y1, width_box, height_box],
                        'confidence': float(conf),
                        'label': label,
                    })
            
            print(f"Found {len(annotations)} objects in {image_type} image")
            print(f"Annotations: {annotations}")  # 添加调试信息
            return annotations
            
        except Exception as e:
            print(f"Detection error: {str(e)}")
            import traceback
            traceback.print_exc()
            return [] 