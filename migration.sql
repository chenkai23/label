ALTER TABLE image_groups ADD COLUMN visible_original_name VARCHAR(255) AFTER infrared_image_path, ADD COLUMN infrared_original_name VARCHAR(255) AFTER visible_original_name;
