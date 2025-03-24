from dataclasses import dataclass
from datetime import datetime
from typing import Optional

@dataclass
class ImageGroup:
    id: int
    project_id: int
    visible_image_path: str
    infrared_image_path: str
    created_at: datetime
    updated_at: datetime
    visible_original_name: Optional[str] = None
    infrared_original_name: Optional[str] = None 