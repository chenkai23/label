from typing import List, Optional, Dict
from models.project import Project, ProjectTag
from utils.db import get_db_connection
import os

class ProjectRepository:
    def create(self, project: Project, tags: List[ProjectTag]) -> Project:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            # 插入项目
            cursor.execute(
                "INSERT INTO projects (name, description) VALUES (%s, %s)",
                (project.name, project.description)
            )
            project_id = cursor.lastrowid  # 获取自增ID
            
            # 插入标签
            for tag in tags:
                cursor.execute(
                    "INSERT INTO project_tags (project_id, tag, color) VALUES (%s, %s, %s)",
                    (project_id, tag.name, tag.color)
                )
                
            conn.commit()
            return self.get_by_id(project_id)
        finally:
            cursor.close()
            conn.close()
            
    def get_by_id(self, project_id: str) -> Optional[Project]:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute("""
                SELECT p.*, GROUP_CONCAT(pt.tag) as tags, GROUP_CONCAT(pt.color) as colors
                FROM projects p
                LEFT JOIN project_tags pt ON p.id = pt.project_id
                WHERE p.id = %s
                GROUP BY p.id
            """, (project_id,))
            
            result = cursor.fetchone()
            if not result:
                return None
                
            return self._map_to_project(result)
        finally:
            cursor.close()
            conn.close()
            
    def _map_to_project(self, row: dict) -> Project:
        tags = []
        if row['tags']:
            tag_names = row['tags'].split(',')
            tag_colors = row['colors'].split(',')
            tags = [ProjectTag(name=name, color=color) 
                   for name, color in zip(tag_names, tag_colors)]
                   
        return Project(
            id=row['id'],
            name=row['name'],
            description=row['description'],
            tags=tags,
            created_at=row['created_at'],
            updated_at=row['updated_at']
        ) 

    def get_all(self) -> List[Project]:
        """
        获取所有项目
        """
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute("""
                SELECT p.*, 
                       GROUP_CONCAT(pt.tag) as tags, 
                       GROUP_CONCAT(pt.color) as colors,
                       COUNT(DISTINCT ig.id) as image_count
                FROM projects p
                LEFT JOIN project_tags pt ON p.id = pt.project_id
                LEFT JOIN image_groups ig ON p.id = ig.project_id
                GROUP BY p.id
                ORDER BY p.created_at DESC
            """)
            
            results = cursor.fetchall()
            return [self._map_to_project_with_count(row) for row in results]
        finally:
            cursor.close()
            conn.close()

    def get_project_with_images(self, project_id: int) -> Optional[Dict]:
        """
        获取项目信息及其图片组
        """
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            # 获取项目基本信息
            cursor.execute("""
                SELECT p.*, 
                       COUNT(DISTINCT ig.id) as image_count
                FROM projects p
                LEFT JOIN image_groups ig ON p.id = ig.project_id
                WHERE p.id = %s
                GROUP BY p.id
            """, (project_id,))
            
            project = cursor.fetchone()
            if not project:
                return None
            
            # 单独获取项目标签，确保只获取当前项目的标签
            cursor.execute("""
                SELECT pt.tag as name, pt.color, pt.id
                FROM project_tags pt
                WHERE pt.project_id = %s
                ORDER BY pt.id
            """, (project_id,))
            
            tags = []
            for tag in cursor.fetchall():
                tags.append({
                    'id': str(tag['id']),
                    'name': tag['name'],
                    'color': self._format_color(tag['color'])
                })
            
            # 获取项目的图片组
            cursor.execute("""
                SELECT ig.id, 
                       ig.visible_image_path, 
                       ig.infrared_image_path
                FROM image_groups ig
                WHERE ig.project_id = %s
                ORDER BY ig.created_at DESC
            """, (project_id,))
            
            image_groups = cursor.fetchall()
            
            # 构建返回结果
            result = {
                'id': project['id'],
                'name': project['name'],
                'description': project['description'],
                'tags': tags,
                'imageCount': project['image_count'] or 0,
                'createdAt': project['created_at'].isoformat() if project['created_at'] else None,
                'updatedAt': project['updated_at'].isoformat() if project['updated_at'] else None,
                'imageGroups': []
            }
            
            for group in image_groups:
                group_id = group['id']
                visible_image_name = os.path.basename(group['visible_image_path'])
                infrared_image_name = os.path.basename(group['infrared_image_path'])
                
                # 获取自动标注数量
                cursor.execute("""
                    SELECT image_type, JSON_LENGTH(yolo_data) as box_count
                    FROM yolo_detections
                    WHERE group_id = %s
                """, (group_id,))
                
                auto_annotations = cursor.fetchall()
                auto_visible_count = 0
                auto_infrared_count = 0
                
                for anno in auto_annotations:
                    if anno['image_type'] == 'visible':
                        auto_visible_count = anno['box_count'] or 0
                    elif anno['image_type'] == 'infrared':
                        auto_infrared_count = anno['box_count'] or 0
                
                # 获取手动标注数量
                cursor.execute("""
                    SELECT image_type, JSON_LENGTH(annotations_data) as box_count
                    FROM manual_annotations
                    WHERE group_id = %s
                """, (group_id,))
                
                manual_annotations = cursor.fetchall()
                manual_visible_count = 0
                manual_infrared_count = 0
                
                for anno in manual_annotations:
                    if anno['image_type'] == 'visible':
                        manual_visible_count = anno['box_count'] or 0
                    elif anno['image_type'] == 'infrared':
                        manual_infrared_count = anno['box_count'] or 0
                
                # 计算总数
                visible_num = auto_visible_count + manual_visible_count
                infrared_num = auto_infrared_count + manual_infrared_count
                
                result['imageGroups'].append({
                    'id': group_id,
                    'visibleImageName': visible_image_name,
                    'visibleImageId': visible_image_name,
                    'infraredImageId': infrared_image_name,
                    'visibleNum': visible_num,
                    'infraredNum': infrared_num
                })
            
            return result
        finally:
            cursor.close()
            conn.close()

    def _map_to_project_with_count(self, row: dict) -> Dict:
        """
        将数据库行映射为带有图片数量的项目对象
        """
        tags = []
        if row['tags']:
            tag_names = row['tags'].split(',')
            tag_colors = row['colors'].split(',')
            
            # 修改 tags 的格式，添加 id 字段，确保颜色格式正确
            for i, (name, color) in enumerate(zip(tag_names, tag_colors)):
                # 转换颜色格式
                formatted_color = self._format_color(color)
                
                tags.append({
                    'id': str(i + 1),
                    'name': name,
                    'color': formatted_color
                })
                   
        return {
            'id': row['id'],
            'name': row['name'],
            'description': row['description'],
            'tags': tags,
            'imageCount': row['image_count'] or 0,
            'createdAt': row['created_at'].isoformat() if row['created_at'] else None,
            'updatedAt': row['updated_at'].isoformat() if row['updated_at'] else None
        }

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

    def delete(self, project_id: int) -> bool:
        """
        删除项目及其相关数据
        """
        conn = get_db_connection()
        cursor = conn.cursor()
        try:
            # 开始事务
            conn.start_transaction()
            
            # 获取项目下的所有图片组
            cursor.execute(
                "SELECT id, visible_image_path, infrared_image_path FROM image_groups WHERE project_id = %s",
                (project_id,)
            )
            image_groups = cursor.fetchall()
            
            # 删除每个图片组的文件和数据
            for group in image_groups:
                group_id = group[0]
                visible_path = group[1]
                infrared_path = group[2]
                
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
                
                # 删除图片文件
                try:
                    if visible_path and os.path.exists(visible_path):
                        os.remove(visible_path)
                    if infrared_path and os.path.exists(infrared_path):
                        os.remove(infrared_path)
                except Exception as e:
                    print(f"Error deleting image files: {str(e)}")
            
            # 删除图片组
            cursor.execute(
                "DELETE FROM image_groups WHERE project_id = %s",
                (project_id,)
            )
            
            # 删除项目标签
            cursor.execute(
                "DELETE FROM project_tags WHERE project_id = %s",
                (project_id,)
            )
            
            # 删除项目
            cursor.execute(
                "DELETE FROM projects WHERE id = %s",
                (project_id,)
            )
            
            # 提交事务
            conn.commit()
            return True
            
        except Exception as e:
            # 回滚事务
            conn.rollback()
            print(f"Error deleting project: {str(e)}")
            return False
        finally:
            cursor.close()
            conn.close() 