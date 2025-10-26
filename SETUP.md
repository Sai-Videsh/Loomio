# 🚀 Loomio - Quick Setup Guide

## Automated Setup (Recommended)

### For Fresh Installation (First Time Setup)

```bash
# Run the complete setup wizard
setup.bat
```

**What it does:**
1. ✅ Checks system requirements (Node.js, npm, MySQL, Git)
2. ✅ Prompts for database credentials interactively
3. ✅ Creates `.env` file with your configuration
4. ✅ Installs all dependencies (root, backend, frontend)
5. ✅ Creates MySQL database (if needed)
6. ✅ Runs database migrations
7. ✅ Initializes database models
8. ✅ Verifies installation

**Estimated time:** 5-10 minutes (depending on internet speed)

---

## Manual Setup (Alternative)

### 1. Prerequisites Check
Ensure you have installed:
- **Node.js** v16+ ([Download](https://nodejs.org/))
- **MySQL** v8.0+ ([Download](https://dev.mysql.com/downloads/))
- **Git** ([Download](https://git-scm.com/))

Verify installations:
```bash
node -v
npm -v
mysql --version
git --version
```

### 2. Clone Repository
```bash
git clone https://github.com/jvkousthub/Loomio.git
cd Loomio
```

### 3. Environment Configuration

Create `.env` file in the root directory:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=loomio_db
DB_USER=root
DB_PASSWORD=your_mysql_password

# JWT Configuration
JWT_SECRET=your_random_secret_key_here
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=5000
NODE_ENV=development

# Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Frontend Configuration
FRONTEND_URL=http://localhost:3000
VITE_API_URL=http://localhost:5000/api
```

### 4. Install Dependencies

**All at once:**
```bash
install-dependencies.bat
```

**Or manually:**
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install

cd ..
```

### 5. Database Setup

**Option A - Using MySQL Workbench:**
1. Open MySQL Workbench
2. Create new database: `CREATE DATABASE loomio_db;`
3. Run migrations from `backend/migrations/` folder

**Option B - Using Command Line:**
```bash
mysql -u root -p
```
```sql
CREATE DATABASE loomio_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE loomio_db;
SOURCE backend/migrations/add-collaboration-features.sql;
SOURCE backend/migrations/add-performance-tracking.sql;
SOURCE backend/migrations/add-subtasks.sql;
SOURCE backend/migrations/add-task-tags.sql;
SOURCE backend/migrations/update-notification-types.sql;
exit;
```

### 6. Start Application

**Recommended (with checks):**
```bash
start.bat
```

**Quick start (without checks):**
```bash
start-quick.bat
```

**Manual start:**
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

### 7. Access Application

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000/api
- **API Health Check:** http://localhost:5000/api/health

---

## 🎯 Common Issues & Solutions

### Issue: MySQL Connection Failed
**Solution:**
1. Ensure MySQL is running:
   ```bash
   # Check if running
   sc query mysql
   
   # Start if not running
   net start mysql
   ```
2. Verify credentials in `.env` file
3. Check if port 3306 is available

### Issue: Port Already in Use
**Error:** `EADDRINUSE: address already in use :::5000`

**Solution:**
```bash
# Find and kill process on port 5000
netstat -ano | findstr :5000
taskkill /PID <process_id> /F

# Or change port in .env file
PORT=5001
```

### Issue: Frontend Can't Connect to Backend
**Solution:**
1. Check backend is running on http://localhost:5000
2. Verify `VITE_API_URL` in `.env` matches backend port
3. Check browser console for CORS errors
4. Restart frontend dev server

### Issue: Database Tables Not Created
**Solution:**
```bash
# Run migrations manually
cd backend/migrations
mysql -u root -p loomio_db < add-collaboration-features.sql
mysql -u root -p loomio_db < add-performance-tracking.sql
mysql -u root -p loomio_db < add-subtasks.sql
mysql -u root -p loomio_db < add-task-tags.sql
mysql -u root -p loomio_db < update-notification-types.sql
```

### Issue: Dependencies Installation Failed
**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rmdir /s /q backend\node_modules
rmdir /s /q frontend\node_modules
del backend\package-lock.json
del frontend\package-lock.json

# Reinstall
install-dependencies.bat
```

---

## 📋 Available Scripts

| Script | Description |
|--------|-------------|
| `setup.bat` | **Complete automated setup** - First time installation |
| `start.bat` | Start application with system checks |
| `start-quick.bat` | Quick start without checks (for development) |
| `stop.bat` | Stop all running servers |
| `install-dependencies.bat` | Install/update all dependencies |

---

## 🗂️ Project Structure

```
Loomio/
├── backend/                    # Backend API (Node.js/Express)
│   ├── src/
│   │   ├── config/            # Database configuration
│   │   ├── controllers/       # Request handlers
│   │   ├── middleware/        # Auth & validation
│   │   ├── models/            # Sequelize models
│   │   ├── routes/            # API routes
│   │   ├── services/          # Business logic
│   │   └── server.js          # Entry point
│   ├── migrations/            # SQL migrations
│   └── package.json
│
├── frontend/                   # Frontend UI (React/Vite)
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   ├── context/           # React Context
│   │   ├── pages/             # Page components
│   │   ├── services/          # API calls
│   │   └── main.jsx           # Entry point
│   ├── public/                # Static assets
│   └── package.json
│
├── .env                        # Environment variables
├── setup.bat                   # Setup wizard
├── start.bat                   # Start script (with checks)
├── start-quick.bat             # Quick start script
├── stop.bat                    # Stop script
├── README.md                   # Project documentation
└── IMPROVEMENTS-ROADMAP.md     # Feature roadmap
```

---

## 🔐 First Login

After setup, create your account:

1. Navigate to http://localhost:5173
2. Click **"Get Started"** or **"Register"**
3. Fill in registration form
4. First user becomes **Platform Admin** automatically
5. Create communities and invite members

---

## 📚 Next Steps

1. **Read Documentation:**
   - `README.md` - Full project overview
   - `IMPROVEMENTS-ROADMAP.md` - Planned features
   - `SETUP.md` - Detailed setup guide

2. **Explore Features:**
   - Create a community
   - Add tasks
   - Invite team members
   - Track contributions

3. **Development:**
   - Backend code: `backend/src/`
   - Frontend code: `frontend/src/`
   - Database models: `backend/src/models/`

---

## 🆘 Getting Help

- **GitHub Issues:** [Report a bug](https://github.com/jvkousthub/Loomio/issues)
- **Documentation:** Check README.md and SETUP.md
- **Check Logs:** 
  - Backend console output
  - Browser console (F12)
  - MySQL error logs

---

## 📝 Development Notes

### Hot Reload
- Frontend: ✅ Automatic (Vite HMR)
- Backend: ❌ Manual restart needed (or use nodemon)

### Environment Variables
- Changes require application restart
- Frontend vars must start with `VITE_`
- Never commit `.env` to version control

### Database Changes
- Modify models in `backend/src/models/`
- Backend auto-syncs on restart (development mode)
- For production, use migrations in `backend/migrations/`

---

**Last Updated:** January 2025  
**Version:** 1.0  
**License:** MIT
