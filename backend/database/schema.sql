CREATE TABLE projects (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE project_tags (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    project_id BIGINT,
    tag VARCHAR(50),
    color VARCHAR(20),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    UNIQUE KEY unique_project_tag (project_id, tag)
);

CREATE TABLE image_groups (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    project_id BIGINT,
    visible_image_path VARCHAR(255),
    infrared_image_path VARCHAR(255),
    visible_image_oss_url VARCHAR(255) DEFAULT NULL,
    infrared_image_oss_url VARCHAR(255) DEFAULT NULL,
    visible_original_name VARCHAR(255),
    infrared_original_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE yolo_detections (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    group_id BIGINT,
    image_type ENUM('visible', 'infrared'),
    yolo_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES image_groups(id) ON DELETE CASCADE,
    INDEX idx_group_type (group_id, image_type)
);

-- 手动标注表
CREATE TABLE manual_annotations (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    group_id BIGINT,
    image_type ENUM('visible', 'infrared'),
    annotations_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES image_groups(id) ON DELETE CASCADE,
    INDEX idx_group_type (group_id, image_type)
); 