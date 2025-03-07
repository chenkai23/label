from ultralytics import YOLO
import numpy as np
import cv2
import requests
from typing import List, Dict, Any
import os
from PIL import Image
import io

class Detector:
    _instance = None
    
    def __new__(cls, model_path: str = None):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self, model_path: str = None):
        if self._initialized:
            return
            
        if model_path is None:
            model_path = os.path.join('models', 'yolov8n.pt')
            
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
        self._initialized = True

    def preprocess_image(self, image_path: str) -> np.ndarray:
        """
        预处理图片，支持URL和本地文件路径
        """
        try:
            if image_path.startswith(('http://', 'https://')):
                # 处理URL图片
                response = requests.get(image_path, verify=False)
                image = Image.open(io.BytesIO(response.content))
                image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
            else:
                # 处理本地文件
                if not os.path.exists(image_path):
                    raise FileNotFoundError(f"Image file not found: {image_path}")
                image = cv2.imread(image_path)
                if image is None:
                    raise ValueError(f"Failed to load image: {image_path}")
            
            return image
            
        except Exception as e:
            print(f"Error preprocessing image: {str(e)}")
            raise

    def detect(self, image_path: str, image_type: str = 'visible') -> List[Dict[str, Any]]:
        """
        执行目标检测
        """
        try:
            # 执行检测
            results = self.model.predict(
                source=image_path,
                conf=0.5,  # 置信度阈值
                iou=0.5,   # NMS IOU 阈值
                save=False,
                device='cpu'  # 使用 CPU 进行推理
            )
            
            # 处理检测结果
            detections = []
            
            # 获取第一张图片的结果
            result = results[0]
            
            # 检查结果类型并相应处理
            if hasattr(result, 'boxes'):
                # 新版本 YOLOv8 返回的是 Results 对象
                boxes = result.boxes.xyxy.cpu().numpy()  # 预测框坐标
                confs = result.boxes.conf.cpu().numpy()  # 置信度
                cls_ids = result.boxes.cls.cpu().numpy().astype(int)  # 类别ID
                
                # 处理每个检测框
                for box, conf, cls_id in zip(boxes, confs, cls_ids):
                    x1, y1, x2, y2 = box.tolist()
                    class_name = result.names[cls_id]
                    
                    detection = {
                        'bbox': [float(x1), float(y1), float(x2-x1), float(y2-y1)],  # [x, y, width, height]
                        'confidence': float(conf),
                        'class_name': class_name
                    }
                    detections.append(detection)
            else:
                # 旧版本或其他格式，尝试直接从张量中提取数据
                # 假设结果是 [x1, y1, x2, y2, conf, class_id] 格式的张量
                result_np = result.cpu().numpy()
                
                for det in result_np:
                    if len(det) >= 6:  # 确保有足够的元素
                        x1, y1, x2, y2, conf, cls_id = det[:6]
                        cls_id = int(cls_id)
                        class_name = self.names.get(cls_id, f"class_{cls_id}")
                        
                        detection = {
                            'bbox': [float(x1), float(y1), float(x2-x1), float(y2-y1)],
                            'confidence': float(conf),
                            'class_name': class_name
                        }
                        detections.append(detection)
            
            print(f"Found {len(detections)} objects in {image_type} image")
            return detections
            
        except Exception as e:
            print(f"Detection error: {str(e)}")
            import traceback
            traceback.print_exc()
            
            # 出错时返回空列表
            return [] 