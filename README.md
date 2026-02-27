# InvoiceFlow — AI-Powered Invoice Factoring Platform

> A full-stack SaaS platform that uses AI/ML to score invoice risk and enable instant factoring for Indian SMEs.

![Dashboard](https://img.shields.io/badge/Status-Complete-brightgreen) ![React](https://img.shields.io/badge/Frontend-React_19-61DAFB) ![Node.js](https://img.shields.io/badge/Backend-Node.js_Express-339933) ![Python](https://img.shields.io/badge/AI-Python_FastAPI-3776AB) ![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-4169E1)

---

## 🏗️ Architecture

```
┌──────────────────────┐     ┌───────────────────────┐     ┌─────────────────────┐
│   React Frontend     │────▶│  Node.js Backend API  │────▶│  Python AI Service  │
│   (Vite + React 19)  │     │  (Express + JWT)      │     │  (FastAPI + ML)     │
│   Port: 5173         │     │  Port: 5000           │     │  Port: 8000         │
└──────────────────────┘     └───────────┬───────────┘     └─────────────────────┘
                                         │
                              ┌──────────▼──────────┐
                              │    PostgreSQL DB     │
                              │    (Sequelize ORM)   │
                              └─────────────────────┘
```

---

## 📁 Project Structure

```
SIFP/
├── invoiceflow-react/          # 🎨 React Frontend (Vite)
│   ├── src/
│   │   ├── pages/              # Page components
│   │   │   ├── LandingPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── ForgotPage.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── UploadPage.jsx
│   │   │   ├── FinanceDashboard.jsx
│   │   │   └── AdminDashboard.jsx
│   │   ├── components/         # Reusable components
│   │   │   ├── Sidebar.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── context/            # React Context
│   │   │   └── AuthContext.jsx
│   │   ├── services/           # API service layer
│   │   │   └── api.js
│   │   └── styles/             # CSS stylesheets
│   └── package.json
│
├── backend/                    # ⚙️ Node.js Backend API
│   ├── config/
│   │   └── db.js               # PostgreSQL + Sequelize config
│   ├── controllers/
│   │   ├── authController.js   # Register, Login, Forgot, Profile
│   │   ├── invoiceController.js # CRUD + PDF upload
│   │   ├── factoringController.js # Approve, Reject, Fund
│   │   ├── adminController.js  # User management + stats
│   │   └── aiController.js     # AI service proxy
│   ├── middleware/
│   │   └── auth.js             # JWT verification middleware
│   ├── models/
│   │   ├── User.js             # User model (bcrypt hashing)
│   │   ├── Invoice.js          # Invoice model
│   │   └── Transaction.js      # Factoring transactions
│   ├── routes/                 # Express route definitions
│   ├── services/
│   │   └── email.js            # Nodemailer email service
│   ├── utils/
│   │   └── helpers.js          # JWT generation, utilities
│   ├── server.js               # Express app entry point
│   └── package.json
│
├── ai-service/                 # 🤖 Python AI/ML Service
│   ├── main.py                 # FastAPI server + /score endpoint
│   ├── train_model.py          # ML model training script
│   ├── requirements.txt        # Python dependencies
│   └── model/                  # Trained scikit-learn model
│
├── *.html / *.css / *.js       # 📄 Original HTML prototypes
├── .gitignore
└── README.md
```

---

## 🚀 Features

### 👤 Authentication & Authorization
- JWT-based authentication with bcrypt password hashing
- Role-based access control (Business Owner / Finance Partner / Admin)
- Protected routes with automatic role-based redirects
- Forgot password with OTP email verification

### 📊 Business Dashboard
- Real-time invoice statistics from PostgreSQL
- Invoice table with status tracking (Draft → Submitted → Approved → Funded)
- Cash flow overview charts
- Personalized greeting with user context

### 📤 Invoice Upload & AI Scoring
- Drag & drop PDF upload with file validation
- 4-step guided workflow (Upload → Review → AI Score → Submit)
- Real-time AI risk scoring via Python ML service
- Risk breakdown: Debtor Credit, Payment History, Industry Risk, Invoice Validity

### 💰 Finance Partner Dashboard
- Invoice review queue with approve/reject actions
- AI score-based risk assessment
- Detailed invoice breakdown panel
- Portfolio management

### 🛡️ Admin Dashboard
- User management (verify, suspend, restore)
- Platform statistics and analytics
- System health monitoring
- Role-based user listing

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite, React Router v7, Axios |
| **Backend** | Node.js, Express.js, Sequelize ORM |
| **Database** | PostgreSQL |
| **AI/ML** | Python, FastAPI, scikit-learn, joblib |
| **Auth** | JWT (jsonwebtoken), bcryptjs |
| **Email** | Nodemailer |
| **File Upload** | Multer |

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js (v18+)
- Python (v3.8+)
- PostgreSQL (v14+)

### 1. Clone the Repository
```bash
git clone https://github.com/WolfKishner23/PBL.git
cd PBL
```

### 2. Backend Setup
```bash
cd backend
npm install

# Create .env file
cp .env.example .env   # or create manually with:
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=invoiceflow
# DB_USER=postgres
# DB_PASSWORD=your_password
# JWT_SECRET=your_jwt_secret
# PORT=5000

npm run dev
```

### 3. AI Service Setup
```bash
cd ai-service
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

pip install -r requirements.txt
python train_model.py        # Train ML model
python main.py               # Start FastAPI server on port 8000
```

### 4. Frontend Setup
```bash
cd invoiceflow-react
npm install
npm run dev                  # Starts on http://localhost:5173
```

---

## 🔌 API Endpoints

### Auth Routes (`/api/auth`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Register new user |
| POST | `/login` | Login with email/password |
| GET | `/me` | Get current user profile |
| POST | `/forgot` | Send OTP for password reset |

### Invoice Routes (`/api/invoices`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List all invoices |
| POST | `/` | Create new invoice |
| GET | `/:id` | Get invoice details |
| POST | `/:id/upload` | Upload invoice PDF |
| POST | `/:id/submit` | Submit for AI scoring |

### Factoring Routes (`/api/factoring`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| PUT | `/:id/approve` | Approve invoice for funding |
| PUT | `/:id/reject` | Reject invoice |
| POST | `/:id/fund` | Fund approved invoice |

### Admin Routes (`/api/admin`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/stats` | Platform statistics |
| GET | `/users` | List all users |
| PUT | `/users/:id/verify` | Verify user |
| PUT | `/users/:id/suspend` | Suspend/restore user |

### AI Service (`localhost:8000`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/score` | Score invoice risk |
| GET | `/health` | Health check |

---

## 🤖 AI Risk Scoring Model

The ML model evaluates invoices on 5 factors:

| Factor | Weight | Description |
|--------|--------|-------------|
| Debtor Credit | 35% | Creditworthiness of the paying company |
| Payment History | 25% | Historical payment track record |
| Industry Risk | 20% | Sector-specific risk assessment |
| Invoice Validity | 10% | Document authenticity indicators |
| Days to Maturity | 10% | Time until payment due date |

**Risk Levels:**
- 🟢 **Low Risk** (70-100): Safe for immediate funding
- 🟡 **Medium Risk** (40-69): Requires additional review
- 🔴 **High Risk** (0-39): Not recommended for funding

---

## 👥 Team

Built as a Project-Based Learning (PBL) project.

---

## 📄 License

This project is for educational purposes.
