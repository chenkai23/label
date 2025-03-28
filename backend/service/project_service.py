from typing import List, Dict
from models.project import Project, ProjectTag
from repository.project_repository import ProjectRepository
from utils.oss_util import OSSUtil
from config.settings import ENABLE_OSS
import uuid

class ProjectService:
    def __init__(self):
        self.project_repository = ProjectRepository()
        self.oss_util = OSSUtil()
        
    def create_project(self, name: str, description: str, tags: List[dict]) -> Project:
        # 首先检查项目名是否已存在
        if self.project_repository.check_name_exists(name):
            raise ValueError("项目名称已存在，请选择其他名称")
            
        project_id = str(uuid.uuid4())
        
        # 创建项目对象
        project = Project(
            id=None,  # 数据库会自动填充
            name=name,
            description=description,
            tags=[],
            created_at=None,  # 数据库会自动填充
            updated_at=None
        )
        
        # 处理标签
        project_tags = []
        for tag in tags:
            # 确保颜色格式正确
            color = tag.get('color', '#2196f3')
            formatted_color = self._format_color(color)
            
            project_tags.append(
                ProjectTag(
                    name=tag['name'],
                    color=formatted_color
                )
            )
        
        # 保存到数据库
        return self.project_repository.create(project, project_tags)

    def _format_color(self, color: str) -> str:
        """
        确保颜色格式正确
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
        
        # 处理纯数字或其他格式
        try:
            # 尝试将其解析为单个数字
            if color.isdigit():
                val = int(color)
                return f"rgb({val},{val},{val})"
            
            # 尝试解析为逗号分隔的数字
            if ',' in color:
                parts = color.split(',')
                if len(parts) >= 3:
                    r = int(parts[0].strip())
                    g = int(parts[1].strip())
                    b = int(parts[2].strip())
                    return f"rgb({r},{g},{b})"
        except Exception:
            pass
        
        # 其他未知格式，返回黑色
        return "rgb(0,0,0)"

    def get_all_projects(self) -> List[Dict]:
        """
        获取所有项目
        """
        return self.project_repository.get_all()
    
    def get_project_info(self, project_id: str) -> Dict:
        """
        获取项目详细信息
        """
        try:
            project_id_int = int(project_id)
        except ValueError:
            raise ValueError("Invalid project_id")
        
        project = self.project_repository.get_project_with_images(project_id_int)
        if not project:
            raise ValueError("Project not found")
        return project 

    def delete_project(self, project_id: str) -> bool:
        """
        删除项目，同时删除OSS中的项目文件夹
        """
        try:
            project_id_int = int(project_id)
            
            # 如果启用了OSS功能，删除OSS中的项目文件夹
            if ENABLE_OSS:
                try:
                    # 使用数字ID作为文件夹名
                    oss_folder_path = str(project_id_int)
                    success = self.oss_util.delete_folder(oss_folder_path)
                except Exception as e:
                    print(f"从OSS删除项目文件夹失败: {str(e)}")
                    # 即使OSS删除失败，仍继续删除项目
            else:
                pass
            
            # 删除数据库中的项目和本地文件
            return self.project_repository.delete(project_id_int)
            
        except ValueError:
            raise ValueError("Invalid project_id")
        except Exception as e:
            print(f"Error deleting project: {str(e)}")
            raise 