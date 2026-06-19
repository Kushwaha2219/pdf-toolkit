# PDFVish — Flask + React + Vite

Self-hosted PDF toolkit. Zero cost, zero cloud, zero API keys.

## Stack

| Layer    | Tech                                 |
| -------- | ------------------------------------ |
| Backend  | Python 3.10+ · Flask · flask-cors    |
| PDF work | PyMuPDF · pypdf · pdf2docx · img2pdf |
| Frontend | React 18 · Vite 5 · React Router v6  |
| Styling  | CSS Modules (scoped per component)   |

---

## Setup

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Linux only — for Word → PDF:
sudo apt install libreoffice

python app.py
# → http://localhost:5000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

Vite proxies all `/api/*` requests to Flask on port 5000 automatically (set in `vite.config.js`).

---

## Key differences vs Create React App

| Feature        | CRA                        | Vite                                       |
| -------------- | -------------------------- | ------------------------------------------ |
| Dev start time | ~5–10 s                    | < 1 s (instant)                            |
| Hot reload     | Slow (~1–2 s)              | Instant HMR                                |
| Config file    | `package.json` proxy field | `vite.config.js`                           |
| Entry point    | `src/index.js`             | `src/main.jsx` + `index.html` in root      |
| Build output   | `build/`                   | Configurable — set to `../backend/static/` |

---

## Production build

Builds React into Flask's static folder so a single Python process serves everything:

```bash
cd frontend
npm run build
# Outputs to ../backend/static/

cd ../backend
python app.py
# Visit http://localhost:5000 — no Vite server needed
```

Add this catch-all route to `app.py` for production:

```python
from flask import send_from_directory

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react(path):
    if path and os.path.exists(os.path.join('static', path)):
        return send_from_directory('static', path)
    return send_from_directory('static', 'index.html')
```

---

## Project structure

```
pdf-toolkit/
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   ├── uploads/          ← auto-created
│   ├── outputs/          ← auto-created
│   └── utils/
│       ├── merge.py
│       ├── split.py
│       ├── compress.py
│       ├── convert.py
│       └── protect.py
└── frontend/
    ├── index.html        ← Vite entry (in root, not public/)
    ├── vite.config.js    ← proxy + build config
    ├── package.json
    ├── public/
    │   └── favicon.svg
    └── src/
        ├── main.jsx      ← entry point (replaces index.js)
        ├── App.jsx
        ├── index.css     ← global styles + CSS variables
        ├── components/
        │   ├── Navbar.jsx + .module.css
        │   ├── ToolCard.jsx + .module.css
        │   ├── DropZone.jsx + .module.css
        │   └── ProgressBar.jsx + .module.css
        ├── pages/
        │   ├── Home.jsx + Home.module.css
        │   ├── Merge.jsx
        │   ├── Split.jsx
        │   ├── Compress.jsx
        │   ├── Convert.jsx + Convert.module.css
        │   ├── Protect.jsx
        │   └── Page.module.css   ← shared page layout
        ├── hooks/
        │   └── useToolSubmit.js
        └── utils/
            └── api.js
```
