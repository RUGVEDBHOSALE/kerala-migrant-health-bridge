# Kerala Migrant Health Bridge

A comprehensive healthcare management system connecting migrant workers, doctors, and government health officials in Kerala with real-time disease surveillance and predictive analytics.

![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![React](https://img.shields.io/badge/react-18.2.0-blue)

## 🏥 Features

### Doctor Portal
- **Worker Search**: Find migrant workers by unique ID
- **Prescription Engine**: Create prescriptions with diagnosis and medications
- **Voice-to-Text**: Record voice notes for low-literacy workers
- **Medicine Requisition**: Request medicine supplies from government

### Government Portal
- **Real-time Dashboard**: Live case monitoring with instant updates
- **Disease Heatmap**: Kerala map visualization with case density
- **Predictive Analytics**: AI-powered outbreak forecasting (Vertex AI mock-up)
- **Medicine Demand**: Manage hospital requisition requests

### Security
- JWT-based authentication
- Role-based access control (Doctor/Government)
- Secure API endpoints
- HIPAA/DISHA considerations

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.0.0
- PostgreSQL 14+ (or use the demo mode without DB)
- npm or yarn

### Installation

1. **Clone and install dependencies:**

```bash
cd kerala-migrant-health-bridge

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

2. **Configure environment:**

```bash
# Backend (.env)
cd backend
cp .env.example .env
# Edit .env with your PostgreSQL credentials

# Frontend (.env)
cd ../frontend
cp .env.example .env
# Add Google Maps API key (optional)
```

3. **Start the application:**

```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
cd frontend
npm run dev
```

4. **Access the application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

### Demo Credentials

| Portal | Email | Password |
|--------|-------|----------|
| Doctor | doctor@hospital.kerala.gov.in | doctor123 |
| Government | health.officer@kerala.gov.in | gov123 |

## 📁 Project Structure

```
kerala-migrant-health-bridge/
├── backend/
│   ├── src/
│   │   ├── config/          # Database configuration
│   │   ├── middleware/      # JWT authentication
│   │   ├── routes/          # API endpoints
│   │   └── server.js        # Express server
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── common/      # Shared components
│   │   │   ├── doctor/      # Doctor portal components
│   │   │   ├── government/  # Government portal components
│   │   │   └── maps/        # Map visualizations
│   │   ├── context/         # Auth context
│   │   ├── pages/           # Main pages
│   │   ├── services/        # API service
│   │   └── App.jsx
│   └── package.json
│
└── README.md
```

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/register` | User registration |
| GET | `/api/auth/me` | Get current user |

### Workers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/workers/:id` | Get worker by unique ID |
| GET | `/api/workers/:id/history` | Get worker medical history |
| POST | `/api/workers` | Create new worker |

### Cases
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/cases` | Submit new case |
| GET | `/api/cases/stats` | Get case statistics |
| GET | `/api/cases/heatmap` | Get heatmap coordinates |
| GET | `/api/cases/trends` | Get disease trends |

### Medicine
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/medicine/request` | Submit requisition |
| GET | `/api/medicine/requests` | List all requests |
| PATCH | `/api/medicine/request/:id` | Update request status |

## 🗺️ Google Maps Setup (Optional)

1. Get an API key from [Google Cloud Console](https://console.cloud.google.com)
2. Enable Maps JavaScript API and Visualization Library
3. Add to `frontend/.env`:
   ```
   VITE_GOOGLE_MAPS_API_KEY=your_key_here
   ```

**Note:** A fallback SVG map is provided if no API key is configured.

## 📱 Mobile Responsiveness

The application is fully responsive and optimized for:
- 📱 Mobile phones (375px+)
- 📱 Tablets (768px+)
- 💻 Desktops (1024px+)

## 🔒 Security Considerations

- All API endpoints require JWT authentication
- Role-based access control for Doctor/Government portals
- Medical records are read-only for doctors
- Passwords are hashed with bcrypt
- CORS configured for frontend origin only

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Tailwind CSS, Vite |
| Backend | Node.js, Express |
| Database | PostgreSQL |
| Real-time | Socket.IO |
| Maps | Google Maps API |
| Charts | Chart.js |
| Auth | JWT, bcrypt |

## 📄 License

MIT License - See LICENSE file for details.

---

Built with ❤️ for Kerala's migrant worker community
