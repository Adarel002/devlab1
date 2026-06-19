import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Налаштування тестової БД ПЕРЕД імпортом app
import os
os.environ["DATABASE_URL"] = "sqlite://"

from app.main import app, get_db
from app.database import Base

engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


class TestHealthCheck:
    def test_health(self, client):
        r = client.get("/health")
        assert r.status_code == 200
        assert r.json() == {"status": "ok"}


class TestTaskSchemas:
    def test_create_requires_title(self):
        from pydantic import ValidationError
        from app.schemas import TaskCreate
        with pytest.raises(ValidationError):
            TaskCreate()

    def test_default_priority(self):
        from app.schemas import TaskCreate
        t = TaskCreate(title="Test")
        assert t.priority == "medium"


class TestTaskCRUD:
    def test_get_empty(self, client):
        r = client.get("/tasks")
        assert r.status_code == 200
        assert r.json() == []

    def test_create(self, client):
        r = client.post("/tasks", json={"title": "Test", "priority": "high"})
        assert r.status_code == 201
        assert r.json()["title"] == "Test"

    def test_get_by_id(self, client):
        created = client.post("/tasks", json={"title": "My Task"}).json()
        r = client.get(f"/tasks/{created['id']}")
        assert r.status_code == 200

    def test_not_found(self, client):
        r = client.get("/tasks/9999")
        assert r.status_code == 404

    def test_update(self, client):
        created = client.post("/tasks", json={"title": "Old"}).json()
        r = client.put(f"/tasks/{created['id']}", json={"completed": True})
        assert r.json()["completed"] is True

    def test_delete(self, client):
        created = client.post("/tasks", json={"title": "Delete me"}).json()
        r = client.delete(f"/tasks/{created['id']}")
        assert r.status_code == 204