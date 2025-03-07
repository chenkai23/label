from dataclasses import dataclass
from datetime import datetime
from typing import List, Optional

@dataclass
class ProjectTag:
    name: str
    color: str

@dataclass
class Project:
    id: int
    name: str
    description: Optional[str]
    tags: List[ProjectTag]
    created_at: datetime
    updated_at: datetime 