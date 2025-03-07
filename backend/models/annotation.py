from dataclasses import dataclass
from typing import List, Optional

@dataclass
class Annotation:
    id: str
    bbox: List[float]  # [x, y, width, height]
    label: str
    confidence: Optional[float] = None 