from flask import Blueprint, request, jsonify, send_file, Response, stream_with_context
from service.annotation_service import AnnotationService
import os

annotation_bp = Blueprint('annotation', __name__)
annotation_service = AnnotationService()

@annotation_bp.route('/api/autoAnnotate', methods=['POST'])
def auto_annotate():
    try:
        data = request.json
        group_id = data.get('groupId')
        project_id = data.get('projectId')
        
        if not group_id or not project_id:
            return jsonify({'error': 'Missing groupId or projectId'}), 400
            
        yolo_data = annotation_service.auto_annotate(group_id, project_id)
        
        return jsonify({
            'annotations': yolo_data
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@annotation_bp.route('/api/manualAnnotations', methods=['POST'])
def save_manual_annotations():
    try:
        data = request.json
        project_id = data.get('projectId')
        group_id = data.get('groupId')
        
        # 获取标注数据
        visible_annotations = data.get('visibleImage', {}).get('annotations', [])
        infrared_annotations = data.get('infraredImage', {}).get('annotations', [])
        
        if not project_id or not group_id:
            return jsonify({'error': 'Missing projectId or groupId'}), 400
            
        success = annotation_service.save_manual_annotations(
            project_id, 
            group_id, 
            None,  # 不需要传递图片ID
            None,
            visible_annotations, 
            infrared_annotations
        )
        
        if success:
            return jsonify({'status': 'success'})
        else:
            return jsonify({'error': 'Failed to save annotations'}), 500
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@annotation_bp.route('/api/exportAnnotations', methods=['GET'])
def export_annotations():
    try:
        project_id = request.args.get('projectId')
        if not project_id:
            return jsonify({'error': 'Missing projectId parameter'}), 400
        
        # 导出标注数据
        zip_path = annotation_service.export_annotations(project_id)
        
        # 以流的形式返回ZIP文件
        def generate():
            with open(zip_path, 'rb') as f:
                chunk_size = 4096  # 4KB 的块大小
                while True:
                    chunk = f.read(chunk_size)
                    if not chunk:
                        break
                    yield chunk
            
            # 文件传输完成后删除临时文件
            os.remove(zip_path)
        
        response = Response(stream_with_context(generate()), 
                           mimetype='application/zip')
        response.headers['Content-Disposition'] = f'attachment; filename=project_{project_id}_yolo_export.zip'
        return response
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500 