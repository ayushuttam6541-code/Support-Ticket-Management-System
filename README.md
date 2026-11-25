# 🎫 Support Ticket Management System

A full-stack **Mini Helpdesk System** built with **Node.js**, **Express**, **MongoDB**, and **React + Tailwind CSS**. Users can raise support tickets; admins can manage, filter, and resolve them  all with a polished, professional interface.

---

## 🚀 Live Demo

> https://support-ticket-management-system-phi.vercel.app/

---

## 📸 Features at a Glance

| Role  | Capabilities |
|-------|-------------|
| **User** | Register · Login · Create Tickets · Track Status · Edit/Delete Own Tickets · Add Comments |
| **Admin** | View All Tickets · Search & Filter · Sort & Paginate · Update Status,Priority · View Activity Log · Dashboard Stats |

---

## 🛠 Tech Stack

### Backend
| Tech | Purpose |
|------|---------|
| Node.js + Express.js | REST API server |
| MongoDB + Mongoose | Database & ODM |
| JWT (jsonwebtoken) | Stateless auth |
| bcryptjs | Password hashing |
| express-validator | Input validation |
| Helmet + CORS | Security headers |
| Morgan | HTTP request logging |
| Node EventEmitter | Event-driven activity logging |

### Frontend
| Tech | Purpose |
|------|---------|
| React 19 + Vite | UI framework & build tool |
| Tailwind CSS v4 | Utility-first styling |
| React Router DOM v7 | Client-side routing |
| Axios | HTTP client with interceptors |
| Lucide React | Icon library |
| React Hot Toast | Toast notifications |

---

## 📁 Project Structure

```
support-ticket-system/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js     # Register, Login
│   │   ├── ticketController.js   # CRUD + Stats + Search/Pagination
│   │   └── commentController.js  # Add & fetch comments
│   ├── events/
│   │   └── ticketEvents.js       # EventEmitter → Activity log
│   ├── middleware/
│   │   ├── authMiddleware.js     # JWT protect
│   │   └── adminMiddleware.js    # Admin-only guard
│   ├── models/
│   │   ├── User.js
│   │   ├── Ticket.js
│   │   ├── Comment.js
│   │   └── Activity.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── ticketRoutes.js
│   │   └── commentRoutes.js
│   ├── seedAdmin.js              # Seed default admin account
│   ├── server.js
│   └── .env
└── frontend/
    └── src/
        ├── context/
        │   └── AuthContext.jsx   # Global auth state
        ├── components/
        │   └── ProtectedRoute.jsx
        ├── pages/
        │   ├── Login.jsx
        │   ├── Register.jsx
        │   ├── UserDashboard.jsx
        │   ├── AdminDashboard.jsx
        │   ├── CreateTicket.jsx
        │   └── TicketDetails.jsx
        └── services/
            └── api.js            # Axios instance + interceptors
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js ≥ 18
- MongoDB Atlas account (or local MongoDB)

### 1. Clone & install

```bash
git clone https://github.com/YOUR_USERNAME/support-ticket-system.git
cd support-ticket-system

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 2. Configure environment

Edit `backend/.env`:

```env
PORT=5000
MONGO_URI=""
JWT_SECRET=secret_key
JWT_EXPIRES_IN=1d
CLIENT_URL=http://localhost:5173
```

### 3. Seed the admin account

```bash
cd backend
npm run seed:admin
```

Default admin credentials:
- **Email:** `admin@helpdesk.com`
- **Password:** `admin1234`

### 4. Run the application

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

App available at: `http://localhost:5173`

---

## 🐳 Docker Support

```bash
# From project root
docker-compose up --build
```

---

## 📡 API Reference

Base URL: `http://localhost:5000/api`

All protected routes require: `Authorization: Bearer <token>`

### Auth

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/auth/register` | Public | Register a new user |
| POST | `/auth/login` | Public | Login and receive JWT |

### Tickets

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/tickets` | User | Create a ticket |
| GET | `/tickets/my` | User | Get own tickets |
| GET | `/tickets/:id` | User/Admin | Get ticket details + comments + activity |
| PUT | `/tickets/:id` | User (owner) | Edit ticket (not Resolved/Closed) |
| DELETE | `/tickets/:id` | User (owner) | Delete ticket (Open/Closed only) |
| GET | `/tickets` | Admin | Get all tickets (search, filter, sort, paginate) |
| GET | `/tickets/stats` | Admin | Dashboard statistics |
| PATCH | `/tickets/:id/status` | Admin | Update status and/or priority |

#### Query Parameters for `GET /tickets` (Admin)

| Param | Type | Example | Description |
|-------|------|---------|-------------|
| `status` | string | `Open` | Filter by status |
| `priority` | string | `High` | Filter by priority |
| `category` | string | `Technical` | Filter by category |
| `search` | string | `login issue` | Search title & description |
| `page` | number | `2` | Page number (default: 1) |
| `limit` | number | `10` | Items per page (default: 10) |
| `sortBy` | string | `createdAt` | Field to sort by |
| `order` | string | `desc` | Sort direction: `asc` / `desc` |

### Comments

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/tickets/:id/comments` | User/Admin | Add a comment |
| GET | `/tickets/:id/comments` | User/Admin | Get all comments |

---

## 🗄️ Database Design

### User
```
_id, name, email (unique), password (bcrypt), role (user|admin), createdAt, updatedAt
```

### Ticket
```
_id, title, description, category (Technical|Billing|Account|General),
priority (Low|Medium|High), status (Open|In Progress|Resolved|Closed),
createdBy → User, createdAt, updatedAt
```

### Comment
```
_id, ticket → Ticket, user → User, message, createdAt, updatedAt
```

### Activity
```
_id, ticket → Ticket, performedBy → User, event (string), details (string), createdAt
```

**Relationships:**
```
User ──< Ticket (one user, many tickets)
Ticket ──< Comment (one ticket, many comments)
Ticket ──< Activity (one ticket, many activity logs)
User ──< Comment (one user, many comments)
User ──< Activity (one user, many activities)
```

---

## 🎯 Event-Driven Architecture

The system uses Node's built-in `EventEmitter` to trigger activity logging on key actions:

| Event | Trigger |
|-------|---------|
| `TICKET_CREATED` | New ticket submitted |
| `TICKET_UPDATED` | Ticket edited |
| `TICKET_DELETED` | Ticket removed |
| `STATUS_CHANGED` | Admin changes status |
| `PRIORITY_CHANGED` | Admin changes priority |
| `COMMENT_ADDED` | Comment posted |
| `TICKET_RESOLVED` | Status set to Resolved |

Each event is captured by the `ticketEvents` listener and persisted to the `Activity` collection. The activity log is visible on each ticket's detail page.

---

## 🔐 Security

- **JWT authentication** with configurable expiry
- **bcryptjs** password hashing (cost factor 12)
- **Role-based access control** (User / Admin) on every protected route
- **Helmet.js** security headers
- **CORS** restricted to `CLIENT_URL`
- **Input validation** via manual checks and express-validator
- Sensitive fields (password) excluded from all API responses (`select: false`)
- JSON body size limit (10kb) to prevent payload attacks

---

## ✅ Bonus Features Implemented

- [x] **Search** (title + description full-text via regex)
- [x] **Pagination** (page/limit with totalPages response)
- [x] **Sorting** (by any field, asc/desc)
- [x] **Multi-filter** (status + priority + category simultaneously)
- [x] **Dashboard stats** (total, open, in-progress, resolved, closed, high-priority)
- [x] **Activity log** (event-driven, persisted per ticket)
- [x] **Professional React UI** with Tailwind CSS v4
- [x] **Admin inline status update** directly from the tickets table
- [x] **Password strength indicator** on register
- [x] **Docker support** (docker-compose)

---

## 🧠 Architecture Decisions

1. **Monorepo structure** – backend and frontend in one repo for easy setup and deployment.
2. **EventEmitter over message queues** – lightweight event handling appropriate for the scale; can be swapped to Bull/Redis for production.
3. **Stateless JWT** – no session storage needed; token carries role information.
4. **Route ordering** – admin-specific routes (`/stats`, `/`) placed before `/:id` to prevent route conflicts in Express.
5. **Tailwind v4 via Vite plugin** – zero-config, faster builds, no `tailwind.config.js` needed.

---

## 📄 License

MIT © 2026

## Author
Ayush Raj

