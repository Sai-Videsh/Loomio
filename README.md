# Loomio - Threads of Effort, Woven into Outcomes

**Loomio** is a full-stack web-based community task management platform with contribution assessment. It is designed to empower communities by helping them organize, assign, track, and evaluate collaborative tasks with transparency and fairness.

---

## 🚀 Features

- **Task Board** – Visualize and manage tasks in a Kanban-style board with status tracking
- **Volunteer-Based Task Assignment** – Members can request tasks; leaders approve and assign
- **Community Calendar** – Schedule and track events, deadlines, and milestones
- **Contribution Points System** – Earn points as you complete and contribute to tasks
- **Leave & Attendance Management** – Apply for leaves and track daily attendance
- **Email Notifications** – Receive task updates, approvals, and reminders
- **Role-Based Dashboards** – Visual insights into contributions and community activity
- **Real-time Updates** – Live data synchronization across all users

---

## 🏗️ Architecture

| Layer         | Technology      |
|---------------|------------------|
| **Frontend**  | React.js, Vite, Tailwind CSS |
| **Backend**   | Node.js, Express.js |
| **Database**  | MySQL |
| **Auth**      | JWT (JSON Web Tokens) |
| **State Management** | React Query, Context API |
| **Notifications** | Nodemailer (Email) |
| **Deployment** | Vercel (Frontend), Render / Railway (Backend) |

---

## 📦 Core Modules

### 1. User & Role Management
- User registration and login with password hashing
- Role-based access control (Admin, Leader, Member)
- JWT-based session handling and role-restricted routes
- Profile management and password changes

### 2. Task Management
- Create, edit, and delete tasks with rich descriptions
- Task status tracking (Not Started, In Progress, Completed, Overdue)
- Priority levels and deadline management
- File attachments and progress notes
- Points reward system integration

### 3. Contribution Assessment
- Points awarded for task completion, attendance, and participation
- Configurable point weights for different activities
- Contribution charts and analytics
- Leaderboard and ranking system

### 4. Attendance & Leave Management
- Daily attendance logs with status tracking (Present, Absent, Late)
- Leave request system with approval workflow
- Integration with contribution scoring
- Attendance statistics and reports

### 5. Community Calendar
- Event scheduling and management
- Event participation tracking
- Calendar views with filtering
- Event reminders and notifications

### 6. Notifications
- Email notifications for task assignments, approvals, and reminders
- In-app notification system
- Real-time updates and alerts

### 7. Dashboards & Analytics
- Role-based dashboards with relevant metrics
- Contribution analytics with charts
- Task and attendance statistics
- Export capabilities for reports

---

## 🗄️ Database Schema

The application uses a comprehensive MySQL database with the following key tables:

- **users** - User accounts, roles, and profile information
- **tasks** - Task definitions, assignments, and status tracking
- **contributions** - Point awards and contribution records
- **attendance** - Daily attendance logs
- **leaves** - Leave requests and approvals
- **events** - Community events and scheduling
- **event_participants** - Event participation tracking
- **notifications** - In-app notification system
- **point_weights** - Configurable point values for activities

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Loomio
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database and email settings
   ```

4. **Set up the database**
   ```bash
   # Create MySQL database and run schema
   mysql -u root -p < schema.sql
   ```

5. **Start the backend server**
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Start the development server**
   ```bash
   npm run dev
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

---

## 🔧 Configuration

### Environment Variables

**Backend (.env)**
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=loomio_db
DB_PORT=3306

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# Email Configuration (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=Loomio <your_email@gmail.com>

# File Upload
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

### Frontend Configuration

The frontend automatically proxies API requests to the backend during development. For production, update the API base URL in `src/services/api.js`.

---

## 📱 Features by Role

### Admin
- Full system access and user management
- Create and manage all users
- Configure point weights and system settings
- View comprehensive analytics and reports
- Approve/reject leave requests

### Leader
- Create and assign tasks
- Mark attendance for team members
- Award points for contributions
- Approve/reject leave requests
- Manage events and community activities

### Member
- View assigned tasks and update status
- Submit leave requests
- Join community events
- Track personal contributions and statistics
- View attendance history

---

## 🔒 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - bcryptjs for secure password storage
- **Role-Based Access Control** - Granular permissions by user role
- **Input Validation** - Comprehensive validation on all endpoints
- **Rate Limiting** - Protection against abuse
- **CORS Configuration** - Secure cross-origin requests
- **Helmet Security** - HTTP security headers

---

## 📊 Performance Targets

- **Login**: ≤ 2 seconds
- **Task creation**: ≤ 3 seconds
- **Dashboard load**: ≤ 5 seconds (up to 500 users)
- **Attendance marking**: ≤ 1 minute (100 users)
- **Availability**: 99% uptime
- **Mobile responsiveness**: Optimized for all devices

---

## 🛠️ Development

### Project Structure
```
Loomio/
├── backend/
│   ├── config/          # Database and app configuration
│   ├── middleware/      # Authentication and validation
│   ├── routes/          # API route handlers
│   ├── utils/           # Utility functions (email, etc.)
│   ├── uploads/         # File upload directory
│   ├── server.js        # Main server file
│   └── schema.sql       # Database schema
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── contexts/    # React contexts (Auth)
│   │   ├── pages/       # Page components
│   │   ├── services/    # API service layer
│   │   └── utils/       # Utility functions
│   ├── public/          # Static assets
│   └── index.html       # Main HTML file
└── README.md
```

### Available Scripts

**Backend**
```bash
npm run dev      # Start development server
npm start        # Start production server
npm test         # Run tests
```

**Frontend**
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

---

## 🚀 Deployment

### Backend Deployment (Render/Railway)
1. Connect your repository to Render or Railway
2. Set environment variables in the deployment platform
3. Configure the build command: `npm install && npm start`
4. Set the start command: `npm start`

### Frontend Deployment (Vercel)
1. Connect your repository to Vercel
2. Set the build command: `npm run build`
3. Set the output directory: `dist`
4. Configure environment variables if needed

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation in the `/docs` folder
- Review the API documentation in the backend routes

---

## 🎯 Roadmap

- [ ] Real-time notifications with WebSockets
- [ ] Mobile app (React Native)
- [ ] Advanced analytics and reporting
- [ ] Integration with external calendar services
- [ ] Bulk operations for task and user management
- [ ] Advanced search and filtering
- [ ] Export functionality (CSV/PDF)
- [ ] Multi-language support
- [ ] Dark mode theme
- [ ] API rate limiting dashboard

---

**Built with ❤️ for community collaboration and transparency**
