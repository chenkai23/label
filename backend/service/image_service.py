from typing import List, BinaryIO
import os
import uuid
from models.image import ImageGroup
from repository.image_repository import ImageRepository
from config.settings import UPLOAD_FOLDER

class ImageService:
    def __init__(self):
        self.image_repository = ImageRepository()

    def upload_image_group(
        self, 
        project_id: str, 
        visible_image: BinaryIO, 
        infrared_image: BinaryIO
    ) -> ImageGroup:
        group_id = str(uuid.uuid4())
        
        # 创建项目专属目录
        project_dir = os.path.join(UPLOAD_FOLDER, project_id)
        os.makedirs(project_dir, exist_ok=True)
        
        # 保存图片
        visible_path = os.path.join(project_dir, f"{group_id}_visible.jpg")
        infrared_path = os.path.join(project_dir, f"{group_id}_infrared.jpg")
        
        visible_image.save(visible_path)
        infrared_image.save(infrared_path)
        
        # 创建图片组
        image_group = ImageGroup(
            id=group_id,
            project_id=project_id,
            visible_image_path=visible_path,
            infrared_image_path=infrared_path,
            created_at=None,
            updated_at=None
        )
        
        return self.image_repository.create(image_group)

    def get_image_group(self, group_id: str, project_id: str) -> ImageGroup:
        # 转换ID为整数
        try:
            group_id_int = int(group_id)
            project_id_int = int(project_id)
        except ValueError:
            raise ValueError("Invalid group_id or project_id")
            
        image_group = self.image_repository.get_by_id(group_id_int)
        if not image_group or image_group.project_id != project_id_int:
            raise ValueError("Image group not found")
        return image_group

    def get_image_path(self, group_id: str, project_id: str, image_type: str) -> str:
        image_group = self.get_image_group(group_id, project_id)
        if image_type == 'visible':
            return image_group.visible_image_path
        elif image_type == 'infrared':
            return image_group.infrared_image_path
        else:
            raise ValueError("Invalid image type")

    def get_image_group_by_id(self, group_id: str) -> ImageGroup:
        """
        仅通过group_id获取图片组信息
        """
        try:
            group_id_int = int(group_id)
        except ValueError:
            raise ValueError("Invalid group_id")
        
        image_group = self.image_repository.get_by_id(group_id_int)
        if not image_group:
            raise ValueError("Image group not found")
        return image_group

    def delete_image_group(self, group_id: str) -> bool:
        """
        删除图片组
        """
        try:
            group_id_int = int(group_id)
            return self.image_repository.delete(group_id_int)
        except ValueError:
            raise ValueError("Invalid group_id")
        except Exception as e:
            print(f"Error deleting image group: {str(e)}")
            raise 