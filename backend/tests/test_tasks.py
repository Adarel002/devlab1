import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app, get_db
from app.database import Base

# Use in-memory SQLite for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    Base.metadata.create_all(bind=engine)
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)


# ─── Unit tests ────────────────────────────────────────────────

class TestHealthCheck:
    def test_health_endpoint_returns_ok(self, client):
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}


class TestTaskSchemas:
    def test_task_create_requires_title(self):
        from pydantic import ValidationError
        from app.schemas import TaskCreate
        with pytest.raises(ValidationError):
            TaskCreate()  # missing title

    def test_task_create_default_priority(self):
        from app.schemas import TaskCreate
        task = TaskCreate(title="Test")
        assert task.priority == "medium"

    def test_task_update_all_optional(self):
        from app.schemas import TaskUpdate
        update = TaskUpdate()
        assert update.title is None
        assert update.completed is None


# ─── Integration tests ─────────────────────────────────────────

class TestTaskCRUD:
    def test_get_tasks_empty(self, client):
        response = client.get("/tasks")
        assert response.status_code == 200
        assert response.json() == []

    def test_create_task(self, client):
        payload = {"title": "Buy groceries", "description": "Milk, eggs", "priority": "high"}
        response = client.post("/tasks", json=payload)
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "Buy groceries"
        assert data["completed"] is False
        assert data["priority"] == "high"
        assert "id" in data

    def test_get_task_by_id(self, client):
        created = client.post("/tasks", json={"title": "My Task"}).json()
        response = client.get(f"/tasks/{created['id']}")
        assert response.status_code == 200
        assert response.json()["title"] == "My Task"

    def test_get_task_not_found(self, client):
        response = client.get("/tasks/9999")
        assert response.status_code == 404

    def test_update_task(self, client):
        created = client.post("/tasks", json={"title": "Old Title"}).json()
        response = client.put(f"/tasks/{created['id']}", json={"title": "New Title", "completed": True})
        assert response.status_code == 200
        assert response.json()["title"] == "New Title"
        assert response.json()["completed"] is True

    def test_delete_task(self, client):
        created = client.post("/tasks", json={"title": "Delete me"}).json()
        response = client.delete(f"/tasks/{created['id']}")
        assert response.status_code == 204
        # Verify it's gone
        response = client.get(f"/tasks/{created['id']}")
        assert response.status_code == 404

    def test_list_tasks_after_creation(self, client):
        client.post("/tasks", json={"title": "Task 1"})
        client.post("/tasks", json={"title": "Task 2"})
        response = client.get("/tasks")
        assert len(response.json()) == 2
