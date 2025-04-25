from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List

from database import SessionLocal, engine
from models import Todo, Base

# Create all tables
Base.metadata.create_all(bind=engine)

app = FastAPI()

# CORS setup for React Native (Expo runs on port 19006)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:19006"],  # or use ["*"] for dev purposes only
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Pydantic schemas
class TodoCreate(BaseModel):
    title: str
    completed: bool = False

class TodoOut(TodoCreate):
    id: int

    class Config:
        orm_mode = True  # Correct way to enable ORM-to-Pydantic conversion

# Create a new task
@app.post("/api/todos/create/", response_model=TodoOut)
def create_todo(todo: TodoCreate, db: Session = Depends(get_db)):
    db_todo = Todo(**todo.dict())
    db.add(db_todo)
    db.commit()
    db.refresh(db_todo)
    return db_todo

# Fetch all tasks
@app.get("/api/todos/fetch/", response_model=List[TodoOut])
def fetch_todos(db: Session = Depends(get_db)):
    return db.query(Todo).all()

# Update a task
@app.put("/api/todos/{todo_id}/update/", response_model=TodoOut)
def update_todo(todo_id: int, updated: TodoCreate, db: Session = Depends(get_db)):
    todo = db.query(Todo).filter(Todo.id == todo_id).first()
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    todo.title = updated.title
    todo.completed = updated.completed
    db.commit()
    db.refresh(todo)
    return todo

# Delete a task
@app.delete("/api/todos/{todo_id}/delete/")
def delete_todo(todo_id: int, db: Session = Depends(get_db)):
    todo = db.query(Todo).filter(Todo.id == todo_id).first()
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    db.delete(todo)
    db.commit()
    return {"message": "Todo deleted successfully"}

# Root endpoint
@app.get("/")
def root():
    return {"message": "FastAPI backend is running."}
