from typing import List, Optional
from models.image import ImageGroup
from utils.db import get_db_connection
import json
import os

class ImageRepository:
    def create(self, image_group: ImageGroup) -> ImageGroup:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute(
                """INSERT INTO image_groups 
                (project_id, visible_image_path, infrared_image_path) 
                VALUES (%s, %s, %s)""",
                (
                    image_group.project_id,
                    image_group.visible_image_path,
                    image_group.infrared_image_path
                )
            )
            group_id = cursor.lastrowid  # 获取自增ID
            conn.commit()
            return self.get_by_id(group_id)
        finally:
            cursor.close()
            conn.close()

    def get_by_id(self, group_id: int) -> Optional[ImageGroup]:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute(
                "SELECT * FROM image_groups WHERE id = %s",
                (group_id,)
            )
            result = cursor.fetchone()
            if not result:
                return None
            return self._map_to_image_group(result)
        finally:
            cursor.close()
            conn.close()

    def get_by_project_id(self, project_id: int) -> List[ImageGroup]:
        """
        获取项目下的所有图片组
        """
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute(
                "SELECT * FROM image_groups WHERE project_id = %s ORDER BY created_at",
                (project_id,)
            )
            return [self._map_to_image_group(row) for row in cursor.fetchall()]
        finally:
            cursor.close()
            conn.close()

    def _map_to_image_group(self, row: dict) -> ImageGroup:
        return ImageGroup(
            id=row['id'],
            project_id=row['project_id'],
            visible_image_path=row['visible_image_path'],
            infrared_image_path=row['infrared_image_path'],
            created_at=row['created_at'],
            updated_at=row['updated_at']
        )

    def update(self, image_group: ImageGroup) -> ImageGroup:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute(
                """UPDATE image_groups 
                SET yolo_data = %s
                WHERE id = %s""",
                (json.dumps(image_group.yolo_data), image_group.id)
            )
            conn.commit()
            return self.get_by_id(image_group.id)
        finally:
            cursor.close()
            conn.close()

    def delete(self, group_id: int) -> bool:
        """
        删除图片组
        """
        conn = get_db_connection()
        cursor = conn.cursor()
        try:
            # 获取图片组信息，用于删除文件
            cursor.execute(
                "SELECT visible_image_path, infrared_image_path FROM image_groups WHERE id = %s",
                (group_id,)
            )
            result = cursor.fetchone()
            if not result:
                return False
            
            visible_path, infrared_path = result
            
            # 删除YOLO检测结果
            cursor.execute(
                "DELETE FROM yolo_detections WHERE group_id = %s",
                (group_id,)
            )
            
            # 删除手动标注
            cursor.execute(
                "DELETE FROM manual_annotations WHERE group_id = %s",
                (group_id,)
            )
            
            # 删除图片组
            cursor.execute(
                "DELETE FROM image_groups WHERE id = %s",
                (group_id,)
            )
            
            # 删除图片文件
            try:
                if visible_path and os.path.exists(visible_path):
                    os.remove(visible_path)
                if infrared_path and os.path.exists(infrared_path):
                    os.remove(infrared_path)
            except Exception as e:
                print(f"Error deleting image files: {str(e)}")
            
            conn.commit()
            return True
        except Exception as e:
            conn.rollback()
            print(f"Error deleting image group: {str(e)}")
            return False
        finally:
            cursor.close()
            conn.close() 