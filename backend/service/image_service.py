from typing import List, BinaryIO, Optional
import os
import uuid
from models.image import ImageGroup
from repository.image_repository import ImageRepository
from config.settings import UPLOAD_FOLDER
from utils.oss_util import OSSUtil

class ImageService:
    def __init__(self):
        self.image_repository = ImageRepository()
        self.oss_util = OSSUtil()

    def upload_image_group(
        self, 
        project_id: str, 
        visible_image: BinaryIO, 
        infrared_image: BinaryIO
    ) -> ImageGroup:
        group_id = str(uuid.uuid4())
        
        # 保存原始文件名（只保存文件名，不包含路径）
        visible_original_name = os.path.basename(visible_image.filename)
        infrared_original_name = os.path.basename(infrared_image.filename)
        
        # 创建项目专属目录
        project_dir = os.path.join(UPLOAD_FOLDER, project_id)
        os.makedirs(project_dir, exist_ok=True)
        
        # 保存图片到本地
        visible_path = os.path.join(project_dir, f"{group_id}_visible.jpg")
        infrared_path = os.path.join(project_dir, f"{group_id}_infrared.jpg")
        
        visible_image.save(visible_path)
        infrared_image.save(infrared_path)
        
        # 创建图片组（暂不包含OSS URL）
        image_group = ImageGroup(
            id=group_id,
            project_id=project_id,
            visible_image_path=visible_path,
            infrared_image_path=infrared_path,
            visible_original_name=visible_original_name,
            infrared_original_name=infrared_original_name,
            created_at=None,
            updated_at=None,
            visible_image_oss_url=None,
            infrared_image_oss_url=None
        )
        
        # 保存到数据库
        created_group = self.image_repository.create(image_group)
        
        # 上传到OSS
        try:
            # 在OSS中创建项目文件夹
            oss_project_folder = f"{project_id}/"
            
            # 定义OSS中的文件路径
            visible_oss_path = f"{project_id}/{group_id}_visible.jpg"
            infrared_oss_path = f"{project_id}/{group_id}_infrared.jpg"
            
            
            # 上传文件
            visible_oss_url = self.oss_util.upload_file(visible_path, visible_oss_path)
            infrared_oss_url = self.oss_util.upload_file(infrared_path, infrared_oss_path)
            
            # 更新数据库中的OSS URL
            if visible_oss_url and infrared_oss_url:
                return self.image_repository.update_oss_urls(
                    created_group.id, 
                    visible_oss_url, 
                    infrared_oss_url
                )
        except Exception as e:
            print(f"上传图片到OSS失败: {str(e)}")
            # 即使OSS上传失败，仍然返回成功创建的图片组
            
        return created_group

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
        删除图片组，同时删除本地文件和OSS中的文件
        """
        try:
            group_id_int = int(group_id)
            
            # 获取图片组信息
            image_group = self.image_repository.get_by_id(group_id_int)
            if not image_group:
                return False
            
            # 从路径中提取文件名，用于构建OSS对象路径
            visible_filename = os.path.basename(image_group.visible_image_path)
            infrared_filename = os.path.basename(image_group.infrared_image_path)
            
            project_id = str(image_group.project_id)
                
            # 删除OSS中的文件
            if image_group.visible_image_oss_url:
                visible_oss_path = f"{project_id}/{visible_filename}"
                success = self.oss_util.delete_file(visible_oss_path)
                
            if image_group.infrared_image_oss_url:
                infrared_oss_path = f"{project_id}/{infrared_filename}"
                success = self.oss_util.delete_file(infrared_oss_path)
            
            # 删除数据库中的记录和本地文件
            return self.image_repository.delete(group_id_int)
            
        except ValueError:
            raise ValueError("Invalid group_id")
        except Exception as e:
            print(f"Error deleting image group: {str(e)}")
            raise 