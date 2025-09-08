# Valex
**Task Management Platform - Computer Engineering Co-op Project**  
*University of Ottawa | Winter 2025*

## 🎯 Project Goal
Building a modern task management system to demonstrate full-stack development skills during my co-op term. Inspired by tools like Linear and Notion, but focused on developer teams.

## 🛠 Tech Stack
- **Frontend:** Next.js 14, TypeScript, Tailwind CSS
- **Backend:** Node.js, Express, PostgreSQL
- **Real-time:** Socket.io
- **DevOps:** Docker, GitHub Actions

## 🚧 Current Status
**Project Timeline: 3 weeks**

- [x] ✅ Project setup and repository structure
- [ ] 🔨 Database schema design
- [ ] 🔨 User authentication system
- [ ] 🔨 Basic CRUD operations
- [ ] 🔨 Kanban board interface
- [ ] 🔨 Real-time collaboration
- [ ] 🔨 GitHub integration
- [ ] 🔨 Production deployment

## 🏗 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL
- Git

### Installation
```bash
# Clone the repository
git clone https://github.com/yourusername/valex.git
cd valex

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install

# Set up environment variables (coming soon)
cp .env.example .env

### 📚 Learning Objectives
This project helps me practice:

- TypeScript development
- Database design with PostgreSQL
- Real-time web applications
- RESTful API design
- Modern React patterns
- DevOps practices

### 📝 Development Log

Week 1: Project setup, tech stack research, initial architecture
Week 2: [Coming soon] Authentication and database implementation
Week 3: [Coming soon] UI development and real-time features

## 🔗 GitHub Integration

The app supports GitHub webhooks to attach commits/PRs to tasks and auto-move tasks when PRs are merged.

- Setup in your repo:
  - Payload URL: `https://<your-domain>/api/github/webhook` (or `http://localhost:5001/api/github/webhook` in dev)
  - Content type: `application/json`
  - Secret: set the same value as `GITHUB_WEBHOOK_SECRET` in the backend env
  - Events: select at least `push` and `pull_request` (and optionally `ping` for testing)

- Backend env:
  - `GITHUB_WEBHOOK_SECRET` must be set
  - Ensure `CORS_ORIGIN` allows your frontend origin

- Local ping test (replace values as needed):

```bash
export GITHUB_WEBHOOK_SECRET=your_secret
curl -X POST \
  -H 'Content-Type: application/json' \
  -H 'X-GitHub-Event: ping' \
  -H 'X-GitHub-Delivery: test-123' \
  -H "X-Hub-Signature-256: sha256=$(printf '{}' | openssl dgst -sha256 -hmac $GITHUB_WEBHOOK_SECRET -r | awk '{print $1}')" \
  --data '{}' \
  http://localhost:5001/api/github/webhook
```

Expected response: `{ "success": true, "pong": true }`.

Include a task key like `PROJ-12` or phrases like `closes PROJ-12` in commit messages or PR titles to link them.
