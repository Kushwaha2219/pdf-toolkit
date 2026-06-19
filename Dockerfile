# ---------- Stage 1: build the React frontend ----------
FROM node:20-slim AS frontend

WORKDIR /app
# Install deps first (cached unless package files change)
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci

# Build — vite.config.js emits into ../backend/static, so that dir must exist.
COPY frontend ./frontend
RUN mkdir -p backend/static && cd frontend && npm run build


# ---------- Stage 2: Python runtime ----------
FROM python:3.12-slim AS runtime

# Runtime libs:
#  - libglib2.0-0 / libgl1: needed by opencv (pulled in via pdf2docx)
#  - libreoffice-writer/impress/calc: headless Office -> PDF conversion
#  - fonts: so converted documents render with sensible fonts
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        libglib2.0-0 libgl1 \
        libreoffice-writer libreoffice-impress libreoffice-calc \
        fonts-dejavu fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/backend

# Python deps
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# App source, then the built frontend from stage 1
COPY backend ./
COPY --from=frontend /app/backend/static ./static

# Render/Railway inject $PORT; default to 8000 for local `docker run`.
ENV PORT=8000
EXPOSE 8000

# Production WSGI server. --timeout 180 gives slow PDF conversions room;
# 2 workers keeps memory modest on small/free instances.
CMD gunicorn --bind 0.0.0.0:$PORT --workers 2 --timeout 180 app:app
