# Task Manager — Лабораторна робота №1 з DevOps

Веб-додаток для управління завданнями. Складається з трьох сервісів:
- **Frontend** — React (порт 3000)
- **Backend** — Python FastAPI (порт 8000)
- **Database** — PostgreSQL 16 (порт 5432)

---

## Структура проекту

```
task-manager/
├── backend/
│   ├── app/
│   │   ├── main.py        # FastAPI додаток, маршрути
│   │   ├── models.py      # SQLAlchemy моделі
│   │   ├── schemas.py     # Pydantic схеми
│   │   └── database.py    # Підключення до БД
│   ├── tests/
│   │   └── test_tasks.py  # Юніт та інтеграційні тести
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.js
│   │   └── index.js
│   ├── public/
│   │   └── index.html
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── .gitignore
```

---

## Запуск через Docker Compose

```bash
# Зібрати та запустити всі сервіси
docker compose up --build

# Або у фоновому режимі
docker compose up --build -d

# Зупинити
docker compose down

# Зупинити і видалити volume з БД
docker compose down -v
```

Після запуску:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Swagger документація: http://localhost:8000/docs

---

## Запуск тестів

```bash
# Встановити залежності
cd backend
pip install -r requirements.txt

# Запустити тести
pytest tests/ -v

# З покриттям коду
pytest tests/ -v --cov=app --cov-report=term-missing
```

---

## API Endpoints

| Метод  | URL            | Опис                    |
|--------|----------------|-------------------------|
| GET    | /health        | Перевірка стану сервісу |
| GET    | /tasks         | Отримати всі завдання   |
| POST   | /tasks         | Створити завдання       |
| GET    | /tasks/{id}    | Отримати завдання по ID |
| PUT    | /tasks/{id}    | Оновити завдання        |
| DELETE | /tasks/{id}    | Видалити завдання       |
