from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from database import SessionLocal, engine
from models import Todo, Base
from fastapi.middleware.cors import CORSMiddleware

Base.metadata.create_all(bind=engine)

app = FastAPI()

# CORS Middleware for allowing React frontend to access FastAPI backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "*",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency to get the database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Pydantic model for tasks
class TodoBase(BaseModel):
    text: str
    completed: bool

class TodoCreate(TodoBase):
    pass

class TodoUpdate(TodoBase):
    pass

class TodoInResponse(BaseModel):
    id: int
    text: str
    completed: bool

    class Config:
        from_attributes = True  # New way


# Get all tasks
@app.get("/tasks", response_model=List[TodoInResponse])
def get_tasks(db: Session = Depends(get_db)):
    tasks = db.query(Todo).all()
    return tasks

# Create a new task
@app.post("/tasks", response_model=TodoInResponse)
def create_task(task: TodoCreate, db: Session = Depends(get_db)):
    db_task = Todo(text=task.text, completed=task.completed)
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

# Update a task
@app.put("/tasks/{task_id}", response_model=TodoInResponse)
def update_task(task_id: int, task: TodoUpdate, db: Session = Depends(get_db)):
    db_task = db.query(Todo).filter(Todo.id == task_id).first()
    if db_task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    db_task.text = task.text
    db_task.completed = task.completed
    db.commit()
    db.refresh(db_task)
    return db_task

# Delete a task
@app.delete("/tasks/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db)):
    db_task = db.query(Todo).filter(Todo.id == task_id).first()
    if db_task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(db_task)
    db.commit()
    return {"detail": "Task deleted"}