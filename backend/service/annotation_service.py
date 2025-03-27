from utils.detector import Detector
from repository.image_repository import ImageRepository
from repository.annotation_repository import AnnotationRepository
import os
from typing import List, Dict
import zipfile
import shutil
import tempfile
import cv2
import numpy as np

class AnnotationService:
    def __init__(self):
        self.detector = Detector()
        self.image_repository = ImageRepository()
        self.annotation_repository = AnnotationRepository()
        
    def auto_annotate(self, group_id: str, project_id: str, conf: float = 0.5, iou: float = 0.5) -> dict:
        """
        对图片组进行自动标注
        Args:
            group_id: 图片组ID
            project_id: 项目ID
            conf: 置信度阈值
            iou: NMS IOU阈值
        """
        try:
            print(f"Starting auto annotation for group {group_id} with conf={conf}, iou={iou}")
            # 转换ID为整数
            group_id_int = int(group_id)
            project_id_int = int(project_id)
            
            # 获取图片组信息
            image_group = self.image_repository.get_by_id(group_id_int)
            if not image_group or image_group.project_id != project_id_int:
                raise ValueError("Image group not found")
            
            # 只删除自动标注结果，保留手动标注
            self.annotation_repository.delete_auto_annotations(group_id_int)
            
            # 执行YOLO检测
            visible_results = self.detector.detect(image_group.visible_image_path, 'visible', conf, iou)
            infrared_results = self.detector.detect(image_group.infrared_image_path, 'infrared', conf, iou)
            
            # 转换检测结果格式
            visible_annotations = self._format_yolo_results(visible_results, 'visible')
            infrared_annotations = self._format_yolo_results(infrared_results, 'infrared')
            
            # 合并检测结果
            yolo_data = {
                'visible': visible_annotations,
                'infrared': infrared_annotations
            }
            
            # 保存标注结果
            if not self.annotation_repository.save_annotations(group_id_int, yolo_data):
                raise Exception("Failed to save annotations")
            
            return yolo_data
            
        except Exception as e:
            print(f"Error during annotation: {str(e)}")
            raise

    def _format_yolo_results(self, results: list, image_type: str) -> list:
        """
        将YOLO检测结果转换为前端需要的格式
        """
        formatted_results = []
        
        for i, detection in enumerate(results):
            # 获取类别对应的颜色
            class_name = detection.get('class_name', 'unknown')
            color = self._get_color_for_class(class_name)
            
            formatted_results.append({
                'id': f"{image_type}_box{i+1}",  # 生成唯一ID
                'bbox': detection['bbox'],
                'label': class_name,
                'color': color,
                'confidence': detection.get('confidence', 0)
            })
        
        return formatted_results

    def _get_color_for_class(self, class_name: str) -> str:
        """
        根据类别名称返回对应的颜色
        使用预定义颜色表，如果类别不在表中，则根据类名哈希生成固定颜色
        """
        # 为常见类别定义颜色
        color_map = {
            'person': 'rgb(255,0,0)',      # 红色
            'car': 'rgb(0,255,0)',         # 绿色
            'truck': 'rgb(0,0,255)',       # 蓝色
            'bicycle': 'rgb(255,255,0)',   # 黄色
            'motorcycle': 'rgb(255,0,255)', # 紫色
            'bus': 'rgb(0,255,255)',       # 青色
            'dog': 'rgb(128,0,0)',         # 深红色
            'cat': 'rgb(0,128,0)',         # 深绿色
        }
        
        # 如果类别在预定义列表中，则使用预定义颜色
        if class_name in color_map:
            return color_map[class_name]
        
        # 否则根据类名生成固定的唯一颜色
        # 使用类名的哈希值生成RGB颜色
        hash_value = hash(class_name) & 0xFFFFFF
        r = (hash_value & 0xFF0000) >> 16
        g = (hash_value & 0x00FF00) >> 8
        b = hash_value & 0x0000FF
        
        # 确保颜色不会太暗或太亮
        r = max(min(r, 230), 50)  # 避免完全黑色或白色
        g = max(min(g, 230), 50)
        b = max(min(b, 230), 50)
        
        return f'rgb({r},{g},{b})'

    def get_annotations(self, group_id: str) -> dict:
        """
        获取图片组的标注数据
        """
        try:
            return self.annotation_repository.get_annotations(group_id) or {}
        except Exception as e:
            print(f"Error getting annotations: {str(e)}")
            return {} 

    def save_manual_annotations(self, project_id: str, group_id: str, 
                               visible_image_id: str, infrared_image_id: str,
                               visible_annotations: List[Dict], 
                               infrared_annotations: List[Dict]) -> bool:
        """
        保存手动标注结果
        """
        try:
            # 转换ID为整数
            project_id_int = int(project_id)
            group_id_int = int(group_id)
            
            # 保存标注结果
            return self.annotation_repository.save_manual_annotations(
                project_id_int, 
                group_id_int, 
                visible_annotations, 
                infrared_annotations
            )
        except Exception as e:
            print(f"Error saving manual annotations: {str(e)}")
            raise

    def get_manual_annotations(self, group_id: str) -> Dict[str, List[Dict]]:
        """
        获取手动标注结果
        """
        try:
            group_id_int = int(group_id)
            return self.annotation_repository.get_manual_annotations(group_id_int) or {'visible': [], 'infrared': []}
        except Exception as e:
            print(f"Error getting manual annotations: {str(e)}")
            return {'visible': [], 'infrared': []} 

    def export_annotations(self, project_id: str) -> str:
        """
        导出项目的所有标注数据为YOLOv8格式
        返回生成的ZIP文件路径
        """
        try:
            project_id_int = int(project_id)
            
            # 创建临时目录
            temp_dir = tempfile.mkdtemp()
            images_dir = os.path.join(temp_dir, 'images')
            labels_dir = os.path.join(temp_dir, 'labels')
            os.makedirs(images_dir, exist_ok=True)
            os.makedirs(labels_dir, exist_ok=True)
            
            # 获取项目下的所有图片组
            image_groups = self.image_repository.get_by_project_id(project_id_int)
            
            # 收集所有类别
            all_classes = set()
            
            # 处理每个图片组
            for group in image_groups:
                group_id = group.id
                
                # 获取自动标注数据
                auto_annotations = self.annotation_repository.get_annotations(group_id) or {}
                
                # 获取手动标注数据
                manual_annotations = self.annotation_repository.get_manual_annotations(group_id) or {'visible': [], 'infrared': []}
                
                # 处理可见光图片
                if os.path.exists(group.visible_image_path):
                    # 读取图片获取尺寸
                    img = cv2.imread(group.visible_image_path)
                    if img is not None:
                        img_height, img_width = img.shape[:2]
                        
                        # 复制图片到导出目录
                        image_filename = f"{group_id}_visible.jpg"
                        shutil.copy2(group.visible_image_path, os.path.join(images_dir, image_filename))
                        
                        # 合并自动标注和手动标注
                        visible_annotations = []
                        if 'visible' in auto_annotations:
                            visible_annotations.extend(auto_annotations['visible'])
                        if 'visible' in manual_annotations:
                            visible_annotations.extend(manual_annotations['visible'])
                        
                        # 创建标签文件
                        if visible_annotations:
                            label_path = os.path.join(labels_dir, f"{group_id}_visible.txt")
                            with open(label_path, 'w') as f:
                                for anno in visible_annotations:
                                    # 收集类别
                                    class_name = anno['label']
                                    all_classes.add(class_name)
                                    
                                    # 转换坐标为YOLO格式 (x_center, y_center, width, height)，归一化到0-1
                                    bbox = anno['bbox']
                                    x, y, w, h = bbox
                                    
                                    # YOLO格式需要中心点坐标和宽高，都归一化到0-1
                                    x_center = (x + w/2) / img_width
                                    y_center = (y + h/2) / img_height
                                    width = w / img_width
                                    height = h / img_height
                                    
                                    # 写入标签文件，格式：class_id x_center y_center width height
                                    # 暂时使用类名的哈希作为类别ID，后面会替换
                                    f.write(f"{class_name} {x_center} {y_center} {width} {height}\n")
                
                # 处理红外图片
                if os.path.exists(group.infrared_image_path):
                    # 读取图片获取尺寸
                    img = cv2.imread(group.infrared_image_path)
                    if img is not None:
                        img_height, img_width = img.shape[:2]
                        
                        # 复制图片到导出目录
                        image_filename = f"{group_id}_infrared.jpg"
                        shutil.copy2(group.infrared_image_path, os.path.join(images_dir, image_filename))
                        
                        # 合并自动标注和手动标注
                        infrared_annotations = []
                        if 'infrared' in auto_annotations:
                            infrared_annotations.extend(auto_annotations['infrared'])
                        if 'infrared' in manual_annotations:
                            infrared_annotations.extend(manual_annotations['infrared'])
                        
                        # 创建标签文件
                        if infrared_annotations:
                            label_path = os.path.join(labels_dir, f"{group_id}_infrared.txt")
                            with open(label_path, 'w') as f:
                                for anno in infrared_annotations:
                                    # 收集类别
                                    class_name = anno['label']
                                    all_classes.add(class_name)
                                    
                                    # 转换坐标为YOLO格式
                                    bbox = anno['bbox']
                                    x, y, w, h = bbox
                                    
                                    x_center = (x + w/2) / img_width
                                    y_center = (y + h/2) / img_height
                                    width = w / img_width
                                    height = h / img_height
                                    
                                    f.write(f"{class_name} {x_center} {y_center} {width} {height}\n")
            
            # 创建类别文件
            class_list = sorted(list(all_classes))
            class_path = os.path.join(temp_dir, 'classes.txt')
            with open(class_path, 'w') as f:
                for i, class_name in enumerate(class_list):
                    f.write(f"{class_name}\n")
            
            # 更新标签文件，将类名替换为类别ID
            class_to_id = {class_name: i for i, class_name in enumerate(class_list)}
            for label_file in os.listdir(labels_dir):
                label_path = os.path.join(labels_dir, label_file)
                with open(label_path, 'r') as f:
                    lines = f.readlines()
                
                with open(label_path, 'w') as f:
                    for line in lines:
                        parts = line.strip().split(' ')
                        if len(parts) >= 5:
                            class_name = parts[0]
                            class_id = class_to_id.get(class_name, 0)
                            # 替换类名为类别ID
                            f.write(f"{class_id} {' '.join(parts[1:])}\n")
            
            # 创建ZIP文件
            zip_path = os.path.join(os.path.dirname(temp_dir), f"project_{project_id}_export.zip")
            with zipfile.ZipFile(zip_path, 'w') as zipf:
                # 添加图片
                for root, _, files in os.walk(images_dir):
                    for file in files:
                        file_path = os.path.join(root, file)
                        arcname = os.path.join('images', file)
                        zipf.write(file_path, arcname)
                
                # 添加标签
                for root, _, files in os.walk(labels_dir):
                    for file in files:
                        file_path = os.path.join(root, file)
                        arcname = os.path.join('labels', file)
                        zipf.write(file_path, arcname)
                
                # 添加类别文件
                zipf.write(class_path, 'classes.txt')
                
                # 添加README文件
                readme_path = os.path.join(temp_dir, 'README.txt')
                with open(readme_path, 'w') as f:
                    f.write("YOLOv8 Dataset Export\n\n")
                    f.write(f"Project ID: {project_id}\n")
                    f.write(f"Total Images: {len(os.listdir(images_dir))}\n")
                    f.write(f"Total Classes: {len(class_list)}\n\n")
                    f.write("Classes:\n")
                    for i, class_name in enumerate(class_list):
                        f.write(f"{i}: {class_name}\n")
                zipf.write(readme_path, 'README.txt')
            
            # 清理临时目录
            shutil.rmtree(temp_dir)
            
            return zip_path
            
        except Exception as e:
            print(f"Error exporting annotations: {str(e)}")
            import traceback
            traceback.print_exc()
            raise 