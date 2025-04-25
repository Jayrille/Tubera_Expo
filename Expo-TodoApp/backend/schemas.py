from pydantic import BaseModel

class TodoCreate(BaseModel):
    text: str
    completed: bool