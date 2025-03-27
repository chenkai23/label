from flask import Blueprint, request, jsonify
from service.project_service import ProjectService

project_bp = Blueprint('project', __name__)
project_service = ProjectService()

@project_bp.route('/api/createProject', methods=['POST'])
def create_project():
    try:
        data = request.json
        
        project = project_service.create_project(
            name=data['name'],
            description=data.get('description', ''),
            tags=data.get('tags', [])
        )
        
        # 格式化标签颜色
        formatted_tags = []
        for tag in project.tags:
            formatted_color = _format_color(tag.color)
            formatted_tags.append({
                "name": tag.name,
                "color": formatted_color
            })
        
        return jsonify({
            "projectId": project.id,
            "name": project.name,
            "tags": formatted_tags,
            "description": project.description,
            "createdAt": project.created_at.isoformat()
        })
        
    except ValueError as e:
        # 处理项目名称重复等特定错误
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        # 处理其他未知错误
        return jsonify({'error': str(e)}), 500

def _format_color(color: str) -> str:
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

@project_bp.route('/api/getAllProjects', methods=['GET'])
def get_all_projects():
    try:
        projects = project_service.get_all_projects()
        
        return jsonify({
            "projects": projects
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@project_bp.route('/api/getProjectInfo', methods=['GET'])
def get_project_info():
    try:
        project_id = request.args.get('projectId')
        if not project_id:
            return jsonify({'error': 'Missing projectId parameter'}), 400
            
        project_info = project_service.get_project_info(project_id)
        
        return jsonify(project_info)
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@project_bp.route('/api/deleteProject', methods=['GET'])
def delete_project():
    try:
        project_id = request.args.get('projectId')
        if not project_id:
            return jsonify({'error': 'Missing projectId parameter'}), 400
            
        success = project_service.delete_project(project_id)
        
        if success:
            return jsonify({'status': 'success'})
        else:
            return jsonify({'error': 'Failed to delete project'}), 500
            
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500 