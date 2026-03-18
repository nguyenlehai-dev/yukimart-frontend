# YukiMart Frontend

> Vue 3 + TypeScript + Vite

## Tech Stack

- **Framework**: Vue 3 (Composition API)
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: CSS / SCSS

## Getting Started

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build
```

## Project Structure

```
src/
├── assets/         # Static assets (images, fonts, styles)
├── components/     # Reusable Vue components
├── views/          # Page-level components
├── router/         # Vue Router configuration
├── stores/         # Pinia state management
├── services/       # API service layer
├── types/          # TypeScript type definitions
└── App.vue         # Root component
```

## Git Branching Strategy (Gitflow)

| Branch | Purpose | Deploy |
|--------|---------|--------|
| `prod` | Production-ready code | Auto deploy to Production |
| `staging` | QA testing and demo | Auto deploy to Staging |
| `dev` | Active development | Auto deploy to Dev |
| `feat/<name>` | New feature development | CI only |
| `hotfix/<name>` | Emergency production fix | Direct to prod |

### Workflow

```
feat/xxx  ──PR──>  dev  ──merge──>  staging  ──merge──>  prod
                    │                  │                    │
              Deploy DEV         Deploy STAGING      Deploy PRODUCTION
```

1. Create feature branch from `dev`: `git checkout -b feat/feature_name`
2. Develop and commit following conventions
3. Push and create Pull Request to `dev`
4. CI runs automatically (lint, build, security scan)
5. Code review and merge
6. Auto deploy to DEV environment
7. When stable, merge `dev` → `staging` for QA
8. After QA approval, merge `staging` → `prod` for production release

### Hotfix Process

1. Branch from `prod`: `git checkout -b hotfix/fix_name`
2. Fix and push
3. PR to `prod` → review → merge → auto deploy
4. Merge back: `prod` → `staging` → `dev`

## CI/CD Pipeline

### CI Pipeline (every push/PR)

```
Code Quality Check ──> Build Application ──> CI Summary
Security Audit ────────────────────────────>
```

### Deploy Pipeline

| Environment | Stages |
|-------------|--------|
| **DEV** | Build → Deploy → Verify Health → Report |
| **STAGING** | Build → Security Audit → Deploy → Verify → Report |
| **PRODUCTION** | Quality Gate → Security Audit → Build → Deploy → Smoke Test → Release Report |

## Commit Convention

```
<type>(scope): description
```

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `refactor` | Code restructuring |
| `docs` | Documentation changes |
| `chore` | Maintenance tasks |
| `style` | UI/CSS changes |
| `perf` | Performance improvement |
| `vendor` | Dependency updates |

### Examples

```bash
feat(auth): add login page
fix(cart): resolve quantity calculation error
refactor(api): restructure service layer
docs(readme): update deployment guide
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `https://yukimart.io.vn/api` |

## Deployment

Deployment is automated via GitHub Actions webhook.

- **Server**: Managed via aaPanel
- **Web Server**: Nginx
- **SSL**: Cloudflare + Origin Certificate
- **Domain**: [yukimart.io.vn](https://yukimart.io.vn)

## License

Private - All rights reserved.
