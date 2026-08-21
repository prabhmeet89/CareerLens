# Contributing to CareerLens

Thank you for your interest in contributing to **CareerLens**! We welcome improvements, bug fixes, and suggestions to make AI career intelligence accessible and intuitive for students worldwide.

---

## 🌳 Git Branching Strategy

- **`main`**: Production-ready branch. All merged code must pass CI tests and production builds.
- **`feature/<feature-name>`**: New feature additions (e.g. `feature/redis-cluster`, `feature/company-reviews`).
- **`fix/<issue-name>`**: Bug fixes and patches (e.g. `fix/socket-reconnect-delay`).
- **`docs/<topic>`**: Documentation updates (e.g. `docs/api-spec-expansion`).

---

## 📝 Commit Message Guidelines

We adhere to the [Conventional Commits](https://www.conventionalcommits.org/) specification:

| Prefix | Description | Example |
|---|---|---|
| `feat:` | A new user-facing feature | `feat(applications): add notes field to application tracker` |
| `fix:` | A bug fix | `fix(auth): prevent cookie overwrite in cross-origin environments` |
| `test:` | Adding or refactoring automated tests | `test(matching): add edge-case fixture tests for clamped scores` |
| `docs:` | Documentation improvements | `docs(readme): add Docker Compose quickstart section` |
| `refactor:` | Code change that neither fixes a bug nor adds a feature | `refactor(matcher): optimize skill normalization lookup table` |
| `perf:` | Performance improvements | `perf(redis): add query string hashing for search cache keys` |
| `chore:` | Build tasks, package updates, CI/CD tweaks | `chore(ci): upgrade GitHub Actions checkout to v4` |

---

## 🛠️ Local Development & Testing Workflow

1. **Fork and clone** the repository:
   ```bash
   git clone https://github.com/prabhmeet89/CareerLens.git
   cd CareerLens
   ```

2. **Install dependencies**:
   ```bash
   npm install --prefix backend
   npm install --prefix frontend
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `backend/.env` and update required keys.

4. **Run the local development servers**:
   ```bash
   npm run dev --prefix backend
   npm run dev --prefix frontend
   ```

5. **Run all automated tests before opening a PR**:
   ```bash
   npm test --prefix backend
   npm run test:coverage --prefix backend
   npm run build --prefix frontend
   ```

---

## ✅ Pull Request Checklist

Before submitting a Pull Request, ensure that:
- [ ] All 50+ backend Jest tests pass with zero failures (`npm test --prefix backend`).
- [ ] The frontend Vite bundle builds cleanly with zero errors (`npm run build --prefix frontend`).
- [ ] Code follows security best practices (no hardcoded secrets or arbitrary user IDs accepted in request parameters).
- [ ] New features include corresponding unit/integration test coverage.
