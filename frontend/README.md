# Loomio Frontend - Community Task Management

A React-based frontend application for community task management with mock data.

## 🚀 Features

- **Task Management** - Create, view, and update tasks with status tracking
- **Event Scheduling** - Schedule and join community events
- **Attendance Tracking** - Mark daily attendance and view statistics
- **Leave Management** - Submit and manage leave requests
- **Contribution System** - Track points and view analytics
- **User Management** - Admin interface for user management
- **Role-Based Access** - Different interfaces for Admin, Leader, and Member roles
- **Responsive Design** - Mobile-friendly interface

## 🛠️ Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **React Query** - Data fetching and caching
- **React Router** - Navigation
- **React Hook Form** - Form handling
- **Recharts** - Data visualization
- **Lucide React** - Icons

## 📦 Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start development server**
   ```bash
   npm run dev
   ```

3. **Open in browser**
   - Navigate to `http://localhost:3000`

## 🔐 Mock Authentication

The application uses mock data for demonstration. You can log in with these credentials:

### Admin User
- **Email**: `admin@loomio.com`
- **Password**: `password`

### Leader User
- **Email**: `john@loomio.com`
- **Password**: `password`

### Member Users
- **Email**: `jane@loomio.com` or `bob@loomio.com`
- **Password**: `password`

## 📱 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🏗️ Project Structure

```
src/
├── components/     # Reusable UI components
├── contexts/       # React contexts (Auth)
├── pages/          # Page components
├── services/       # API service layer (mock data)
└── utils/          # Utility functions
```

## 🎨 Features by Role

### Admin
- Full system access
- User management
- System configuration
- Analytics and reports

### Leader
- Task creation and assignment
- Attendance management
- Leave approval
- Event management

### Member
- View assigned tasks
- Submit leave requests
- Join events
- Track personal statistics

## 🔧 Customization

### Adding Real Backend
To connect to a real backend:

1. Update `src/services/api.js` to use real API calls
2. Configure your backend URL in the API service
3. Update authentication to use real JWT tokens

### Modifying Mock Data
Edit `src/services/mockApi.js` to customize the mock data for your needs.

## 📄 License

MIT License - see LICENSE file for details.

---

**Built with ❤️ for community collaboration**
