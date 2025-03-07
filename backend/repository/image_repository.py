from typing import List, Optional
from models.image import ImageGroup
from utils.db import get_db_connection
import json

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