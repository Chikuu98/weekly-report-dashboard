# Weekly Report Dashboard

A full-stack web application built for managing weekly work reports. It allows team members to submit weekly work reports and provides managers with a consolidated dashboard to review submissions, request corrections, and analyze team metrics.

Built with **[React](https://reactjs.org/)** + **[NestJS](https://nestjs.com/)** + **[TypeORM](https://typeorm.io/)** + **[MySQL](https://www.mysql.com/)**.

---

## 🛠️ Tech Stack

- **Frontend**: React (Vite, TypeScript, TailwindCSS, Lucide Icons)
- **Backend**: NestJS (TypeScript, TypeORM)
- **Database**: MySQL 8.x

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
- **Node.js**: v18+ or v20+
- **npm**: v9+
- **MySQL**: v8.0+ running on port `3306` (or configured via environment variables)

---

### Setup & Installation

1. **Clone the repository** (if not already done):
   ```bash
   git clone <repository-url>
   cd weekly-report-dashboard
   ```

2. **Install dependencies**:
   Install root, backend, and frontend dependencies:
   ```bash
   # Install root dependencies
   npm install

   # Install backend dependencies
   cd backend && npm install && cd ..

   # Install frontend dependencies
   cd frontend && npm install && cd ..
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` in the `backend` folder to `.env`:
   ```bash
   cp backend/.env.example backend/.env
   ```
   Ensure your MySQL database credentials (host, port, username, password, database name) match your local MySQL configuration in `backend/.env`.

---

## 🌱 Database Seeding

To populate the MySQL database with initial test data (1 Manager, 4 Team Members, 4 Projects, and 16 past weekly reports spanning all statuses: Draft, Submitted, Needs Correction, Approved), run the seed script:

```bash
# From root directory
npm run seed

# OR from backend directory
cd backend
npm run seed
```

### 🔑 Seeded Demo Accounts (Password for all: `password123`)

| Role | Name | Email | Password |
| :--- | :--- | :--- | :--- |
| **Manager** | Sarah Jenkins (Manager) | `manager@company.com` | `password123` |
| **Team Member** | Alice Smith | `alice@company.com` | `password123` |
| **Team Member** | Bob Johnson | `bob@company.com` | `password123` |
| **Team Member** | Charlie Davis | `charlie@company.com` | `password123` |
| **Team Member** | Diana Prince | `diana@company.com` | `password123` |

### 📁 Seeded Projects & Categories
- **Client A**: Client A Web Portal & E-Commerce (`#3B82F6`)
- **Internal Tooling**: Internal Automation & Developer Tooling (`#10B981`)
- **Infrastructure**: Cloud Infrastructure & CI/CD Pipeline (`#8B5CF6`)
- **Mobile App**: iOS & Android Cross-Platform Mobile App (`#F59E0B`)

---

## 📚 API Documentation (Swagger UI)

Interactive OpenAPI / Swagger UI documentation is available when running the backend:

- **Swagger UI URL**: `http://localhost:3000/api/docs`

You can test all authentication (`/api/auth/register`, `/api/auth/login`, `/api/auth/me`) and project endpoints directly from your browser! To test protected endpoints, click the **Authorize** button in Swagger and enter the `access_token` returned by registration or login.

---

## 🗄️ Database Migrations

TypeORM migration commands can be executed directly from the **root directory** using npm scripts:

| Command | Description |
| :--- | :--- |
| `npm run migration:run` | Runs all pending database migrations against the configured MySQL database. |
| `npm run migration:generate` | Automatically generates a new migration file based on schema changes in entities. |
| `npm run migration:revert` | Reverts the last executed database migration. |
| `npm run migration:create` | Creates a blank migration file skeleton in `backend/src/migrations`. |

> **Note**: You can also run these commands directly inside the `backend` directory:
> ```bash
> cd backend
> npm run migration:run
> npm run migration:generate -- src/migrations/YourMigrationName
> npm run migration:revert
> ```

---

## 💻 Running the Application

You can control both the frontend and backend applications from the **root folder**:

### Development Mode (Both Frontend & Backend)
Runs NestJS backend on `http://localhost:3000` and Vite frontend on `http://localhost:5173` concurrently:
```bash
npm run dev
```

### Individual Development Servers
- **Backend only**: `npm run dev:backend`
- **Frontend only**: `npm run dev:frontend`

### Production Build & Execution
- **Build both projects**: `npm run build`
- **Build Backend**: `npm run build:backend`
- **Build Frontend**: `npm run build:frontend`
- **Start Production Backend**: `npm run start:prod`

---

## 📁 Repository Structure

```text
weekly-report-dashboard/
├── backend/                  # NestJS API Backend
│   ├── src/
│   │   ├── entities/         # TypeORM Database Entities
│   │   ├── migrations/       # TypeORM Migration Files
│   │   ├── data-source.ts    # TypeORM Data Source Configuration
│   │   └── main.ts           # Application Entry Point
│   ├── .env.example          # Environment Variables Template
│   └── package.json
├── frontend/                 # React (Vite + TailwindCSS) Frontend
│   ├── src/
│   └── package.json
├── package.json              # Root package.json with unified scripts
└── README.md                 # Project Documentation
```
