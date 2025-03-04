from flask import Flask, request, jsonify
from flask_cors import CORS
from utils.detector import Detector
import os

app = Flask(__name__)
CORS(app)

# 初始化检测器
model_path = os.path.join('models', 'yolov8n.pt')
detector = Detector(model_path)

@app.route('/api/auto-annotate', methods=['POST'])
def auto_annotate():
    try:
        data = request.json
        image_url = data.get('imageUrl')
        
        if not image_url:
            return jsonify({'error': 'No image URL provided'}), 400
            
        # 执行检测
        annotations = detector.detect(image_url)
        
        return jsonify({
            'annotations': annotations
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5050, debug=True) 