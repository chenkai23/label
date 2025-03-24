from flask import Blueprint, request, jsonify, send_file
from service.image_service import ImageService
from service.annotation_service import AnnotationService
import os

image_bp = Blueprint('image', __name__)
image_service = ImageService()
annotation_service = AnnotationService()

@image_bp.route('/api/uploadImageGroups', methods=['POST'])
def upload_image_groups():
    try:
        # 检查请求格式
        if 'projectId' not in request.form:
            return jsonify({'error': 'Missing projectId in form data'}), 400
            
        if 'visibleImage' not in request.files:
            return jsonify({'error': 'Missing visibleImage file'}), 400
            
        if 'infraredImage' not in request.files:
            return jsonify({'error': 'Missing infraredImage file'}), 400
        
        project_id = request.form['projectId']
        visible_image = request.files['visibleImage']
        infrared_image = request.files['infraredImage']
        
        # 检查文件是否为空
        if visible_image.filename == '':
            return jsonify({'error': 'Empty visibleImage file'}), 400
            
        if infrared_image.filename == '':
            return jsonify({'error': 'Empty infraredImage file'}), 400
        
        # 检查文件类型
        allowed_extensions = {'jpg', 'jpeg', 'png'}
        if not (visible_image.filename.lower().endswith(tuple('.' + ext for ext in allowed_extensions))):
            return jsonify({'error': 'Invalid visibleImage file type. Allowed: jpg, jpeg, png'}), 400
            
        if not (infrared_image.filename.lower().endswith(tuple('.' + ext for ext in allowed_extensions))):
            return jsonify({'error': 'Invalid infraredImage file type. Allowed: jpg, jpeg, png'}), 400
        
        image_group = image_service.upload_image_group(
            project_id=project_id,
            visible_image=visible_image,
            infrared_image=infrared_image
        )
        
        return jsonify({
            "groupId": image_group.id,
            "projectId": image_group.project_id,
            "createdAt": image_group.created_at.isoformat()
        })
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@image_bp.route('/api/getImageGroupsInfo', methods=['POST'])
def get_image_groups_info():
    try:
        data = request.json
        group_id = data['groupId']
        
        # 获取图片组信息
        image_group = image_service.get_image_group_by_id(group_id)
        
        # 获取自动标注数据
        yolo_data = annotation_service.get_annotations(group_id)
        
        # 获取手动标注数据
        manual_annotations = annotation_service.get_manual_annotations(group_id)
        
        return jsonify({
            "visibleImageId": os.path.basename(image_group.visible_image_path),
            "infraredImageId": os.path.basename(image_group.infrared_image_path),
            "yoloData": yolo_data or {},  # 自动标注数据
            "manualAnnotations": manual_annotations,  # 手动标注数据
            "projectId": image_group.project_id,
            "createdAt": image_group.created_at.isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@image_bp.route('/api/getImage', methods=['GET'])
def get_image():
    try:
        image_id = request.args.get('id')
        
        if not image_id:
            return jsonify({'error': 'Missing image id parameter'}), 400
            
        # 从文件名中提取路径
        # 假设文件名格式为: {group_id}_{image_type}.jpg
        # 例如: 1_visible.jpg 或 2_infrared.jpg
        
        # 查找所有可能的图片路径
        image_paths = []
        for root, dirs, files in os.walk(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'uploads')):
            for file in files:
                if file == image_id:
                    image_paths.append(os.path.join(root, file))
        
        if not image_paths:
            return jsonify({'error': 'Image not found'}), 404
            
        # 使用找到的第一个匹配路径
        image_path = image_paths[0]
        
        return send_file(image_path, mimetype='image/jpeg')
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@image_bp.route('/api/deleteImageGroup', methods=['GET'])
def delete_image_group():
    try:
        group_id = request.args.get('groupId')
        if not group_id:
            return jsonify({'error': 'Missing groupId parameter'}), 400
            
        success = image_service.delete_image_group(group_id)
        
        if success:
            return jsonify({'status': 'success'})
        else:
            return jsonify({'error': 'Failed to delete image group'}), 500
            
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500 