# Performance Intelligence (Frontend)

React + Vite UI for the Intelligent Student Performance Prediction System.

## Configure
```bash
cp .env.example .env
```
Set:
- `VITE_API_BASE_URL=http://127.0.0.1:8000`

## Run
```bash
npm install
npm run dev
```

## Backend endpoints used
- GET/POST `/api/students/`
- GET `/api/students/{id}/`
- GET/POST `/api/records/?student_id={id}` and `/api/records/`
- GET `/api/predictions/`
- POST `/api/students/{id}/predict/`

## Notes
If you hit CORS errors, enable CORS in Django for `http://localhost:5173`.
