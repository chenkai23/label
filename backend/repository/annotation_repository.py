from typing import List, Optional, Dict, Any
from models.annotation import Annotation
from utils.db import get_db_connection
import uuid
import json

class AnnotationRepository:
    def save_annotations(self, group_id: int, annotations: Dict[str, List[Dict]]) -> bool:
        """
        保存图片组的标注结果
        """
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            # 删除旧的检测结果
            cursor.execute(
                "DELETE FROM yolo_detections WHERE group_id = %s",
                (group_id,)
            )
            
            # 插入新的检测结果
            for image_type, detections in annotations.items():
                cursor.execute(
                    """INSERT INTO yolo_detections 
                    (group_id, image_type, yolo_data)
                    VALUES (%s, %s, %s)""",
                    (
                        group_id,
                        image_type,
                        json.dumps(detections)
                    )
                )
            
            conn.commit()
            return True
        except Exception as e:
            print(f"Error saving annotations: {str(e)}")
            conn.rollback()
            return False
        finally:
            cursor.close()
            conn.close()

    def get_annotations(self, group_id: int) -> Optional[Dict[str, List[Dict[str, Any]]]]:
        """
        获取图片组的标注结果
        """
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute(
                """SELECT image_type, yolo_data
                FROM yolo_detections 
                WHERE group_id = %s""",
                (group_id,)
            )
            
            results = cursor.fetchall()
            if not results:
                return None
                
            # 按图片类型组织结果
            annotations = {}
            for row in results:
                annotations[row['image_type']] = json.loads(row['yolo_data'])
                
            # 如果没有任何标注数据，返回None
            if not annotations:
                return None
                
            return annotations
            
        finally:
            cursor.close()
            conn.close()

    def save_manual_annotations(self, project_id: int, group_id: int, 
                               visible_annotations: List[Dict], 
                               infrared_annotations: List[Dict]) -> bool:
        """
        保存手动标注结果
        """
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            # 删除旧的手动标注
            cursor.execute(
                "DELETE FROM manual_annotations WHERE group_id = %s",
                (group_id,)
            )
            
            # 插入可见光图像的标注
            if visible_annotations:
                cursor.execute(
                    """INSERT INTO manual_annotations 
                    (group_id, image_type, annotations_data)
                    VALUES (%s, %s, %s)""",
                    (
                        group_id,
                        'visible',
                        json.dumps(visible_annotations)
                    )
                )
            
            # 插入红外图像的标注
            if infrared_annotations:
                cursor.execute(
                    """INSERT INTO manual_annotations 
                    (group_id, image_type, annotations_data)
                    VALUES (%s, %s, %s)""",
                    (
                        group_id,
                        'infrared',
                        json.dumps(infrared_annotations)
                    )
                )
            
            conn.commit()
            return True
        except Exception as e:
            print(f"Error saving manual annotations: {str(e)}")
            conn.rollback()
            return False
        finally:
            cursor.close()
            conn.close()

    def get_manual_annotations(self, group_id: int) -> Dict[str, List[Dict]]:
        """
        获取手动标注结果
        """
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute(
                """SELECT image_type, annotations_data
                FROM manual_annotations 
                WHERE group_id = %s""",
                (group_id,)
            )
            
            results = cursor.fetchall()
            
            # 按图片类型组织结果
            annotations = {'visible': [], 'infrared': []}
            for row in results:
                annotations_data = json.loads(row['annotations_data'])
                
                # 确保每个标注的颜色格式正确
                for annotation in annotations_data:
                    if 'color' in annotation:
                        annotation['color'] = self._format_color(annotation['color'])
                        
                annotations[row['image_type']] = annotations_data
                
            return annotations
            
        finally:
            cursor.close()
            conn.close()

    def _format_color(self, color: str) -> str:
        """
        确保颜色格式正确
        支持从 HEX (#RRGGBB) 转换为 RGB 格式 (rgb(R,G,B))
        """
        if not color:
            return "rgb(0,0,0)"  # 默认黑色
        
        # 如果已经是 RGB 格式
        if color.startswith('rgb'):
            # 确保格式完整
            if color.count(',') != 2 or not color.endswith(')'):
                # 修复不完整的 RGB 格式
                parts = color.replace('rgb(', '').replace(')', '').split(',')
                if len(parts) >= 3:
                    r = parts[0].strip()
                    g = parts[1].strip()
                    b = parts[2].strip() if len(parts) > 2 else "0"
                    return f"rgb({r},{g},{b})"
                else:
                    return "rgb(0,0,0)"  # 默认黑色
            return color
        
        # 如果是 HEX 格式，转换为 RGB
        if color.startswith('#'):
            try:
                # 去掉 # 号
                color = color.lstrip('#')
                
                # 处理简写形式 (#RGB)
                if len(color) == 3:
                    color = ''.join([c*2 for c in color])
                    
                # 转换为 RGB
                r = int(color[0:2], 16)
                g = int(color[2:4], 16)
                b = int(color[4:6], 16)
                
                return f"rgb({r},{g},{b})"
            except Exception:
                return "rgb(0,0,0)"  # 转换失败时返回黑色
            
        # 其他未知格式，返回黑色
        return "rgb(0,0,0)" 