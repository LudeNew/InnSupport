
# InnSupport Project

## Setup Instructions

### Backend (Django)
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Create virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   .\venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run migrations:
   ```bash
   python manage.py makemigrations api
   python manage.py migrate
   ```
5. Create superuser:
   ```bash
   python manage.py createsuperuser
   ```
6. Run server:
   ```bash
   python manage.py runserver
   ```

### Frontend (React)
1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
   *Note: If `npm` is not found, ensure Node.js is installed.*
3. Run development server:
   ```bash
   npm run dev
   ```

## Architecture
- **Backend API**: Django REST Framework (Port 8000)
- **Frontend**: Vite + React (Port 5173)
- **Database**: SQLite (Local Dev), MySQL (Production/Reg.ru)

## Deployment to Reg.ru
1. Upload `backend` contents to the server.
2. Configure `passenger_wsgi.py` as entry point.
3. Build frontend: `npm run build` locally.
4. Upload `frontend/dist` content to the server (or configure Django to serve it).
