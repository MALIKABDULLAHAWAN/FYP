# DHYAN DevOps Documentation

This document outlines the DevOps infrastructure set up for the DHYAN project, including containerization, CI/CD pipelines, and dependency management.

## 1. Containerization (Docker)

The application is fully containerized to ensure consistency across environments.

### 1.1 Local Development

You can run the entire stack (Database, Backend API, Frontend UI) locally using a single command from the root directory:

```bash
docker-compose up --build
```

**Services:**
- **`db`**: PostgreSQL 16 database. Runs on port `5432`. Data is persisted in the `dhyan_pg` Docker volume.
- **`api`**: Django REST Framework backend. Runs on port `8000`. Uses the `Backend/Dockerfile`.
- **`frontend`**: React/Vite application. Served via Nginx on port `3000`. Uses the `frontend/Dockerfile`.

### 1.2 Frontend Dockerfile (`frontend/Dockerfile`)
A multi-stage build is used for the frontend:
1. **Build Stage**: Uses Node.js 20 to install dependencies and build the static assets (`npm run build`).
2. **Serve Stage**: Uses a lightweight Nginx container to serve the built assets. A custom `nginx.conf` ensures client-side routing works correctly.

### 1.3 Backend Dockerfile (`Backend/Dockerfile`)
Uses Python 3.11-slim. It installs dependencies from `requirements.txt` and runs the application using `docker/entrypoint.sh`.

## 2. Continuous Integration (CI)

GitHub Actions are configured to automatically test and lint the code on every push and pull request to the `main` or `master` branches.

### Pipeline Configuration (`.github/workflows/ci.yml`)
The CI pipeline is split into two parallel jobs:

- **Backend CI**:
  - Sets up Python 3.11.
  - Installs dependencies from both root and `Backend/` requirements files.
  - Runs syntax checking using `flake8`.
  - Runs formatting validation using `black` (dry-run).

- **Frontend CI**:
  - Sets up Node.js 20.
  - Installs dependencies via `npm ci`.
  - Runs static analysis via `npm run lint`.
  - Attempts a production build via `npm run build` to catch compilation errors.

## 3. Dependency Management

To keep dependencies secure and up-to-date, GitHub Dependabot is configured in `.github/dependabot.yml`.

It checks for updates on a **weekly** basis for:
- Python packages (`pip`) in the root directory.
- Python packages (`pip`) in the `Backend/` directory.
- Node packages (`npm`) in the `frontend/` directory.
- GitHub Actions used in the workflow files.

## 4. Deployment

The repository is already configured with metadata files for various Platform-as-a-Service (PaaS) providers:
- **Render**: `Backend/render.yaml` (Backend)
- **Railway**: `Backend/railway.toml` (Backend/DB)
- **Vercel**: `frontend/vercel.json` (Frontend)

With the new Dockerfiles, you can also easily deploy the full stack to any server supporting Docker or a Kubernetes cluster using the provided images.
