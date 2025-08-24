# Wellness & Habit Tracker

A comprehensive wellness and habit tracking application built with React, Node.js, Express, and MySQL. Track your daily habits, progress, and wellness journey with modern UI, animations, and notifications.

## 🌟 Features

### Core Functionalities

1. **User Registration & Authentication**
   - Register/Login using mobile number or email ID
   - OTP verification via email/SMS
   - Secure JWT authentication
   - Profile management

2. **Dashboard (Home)**
   - Display daily habits with completion status
   - Daily motivational quotes
   - Animated streak counter with progress bar
   - Quick action buttons for all features
   - Real-time statistics

3. **Habit Management**
   - Add/Edit/Delete habits
   - Custom icons and frequency settings
   - Reminder time configuration
   - Animated completion toggles
   - Habit statistics and streaks

4. **Reminders**
   - Custom reminder creation
   - Time picker integration
   - Push notifications
   - Recurring reminders
   - Today's and upcoming reminders

5. **Progress Tracking**
   - Animated charts and graphs
   - Streak visualization
   - Badge system for milestones
   - Weekly and monthly progress views
   - Wellness score calculation

6. **Schedules**
   - Daily schedule management
   - Visual timeline UI
   - Activity categorization
   - Time slot management

7. **Yoga Time**
   - Guided yoga poses with instructions
   - Timer functionality
   - Motivational messages
   - Session tracking
   - Pre-built routines

8. **Notifications**
   - Push notification support
   - Habit reminders
   - Motivational quotes
   - Achievement notifications
   - Schedule reminders

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **React Router** - Navigation
- **React Query** - Data fetching and caching
- **Framer Motion** - Animations
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **React Hook Form** - Form management
- **React Hot Toast** - Notifications

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MySQL** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Nodemailer** - Email OTP
- **Twilio** - SMS OTP
- **Helmet** - Security middleware

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd wellness-habit-tracker
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install backend dependencies
   cd server
   npm install
   
   # Install frontend dependencies
   cd ../client
   npm install
   ```

3. **Database Setup**
   ```bash
   # Create MySQL database
   mysql -u root -p
   CREATE DATABASE wellness_tracker;
   USE wellness_tracker;
   
   # Import schema
   source server/config/database.sql;
   ```

4. **Environment Configuration**
   ```bash
   # Copy environment example
   cp server/env.example server/.env
   
   # Edit .env file with your configuration
   nano server/.env
   ```

   Required environment variables:
   ```env
   # Database
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=wellness_tracker
   DB_PORT=3306
   
   # JWT
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRES_IN=7d
   
   # Server
   PORT=5000
   NODE_ENV=development
   
   # Email (for OTP)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   
   # Twilio (for SMS OTP)
   TWILIO_ACCOUNT_SID=your_twilio_account_sid
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   TWILIO_PHONE_NUMBER=your_twilio_phone_number
   
   # Frontend URL
   FRONTEND_URL=http://localhost:3000
   ```

5. **Start the application**
   ```bash
   # From root directory
   npm run dev
   
   # Or start separately
   # Terminal 1 - Backend
   cd server
   npm run dev
   
   # Terminal 2 - Frontend
   cd client
   npm start
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - API Health Check: http://localhost:5000/api/health

## 📱 Demo Account

For testing purposes, you can use the demo account:
- **Email**: demo@wellness.com
- **Password**: demo123

## 🏗️ Project Structure

```
wellness-habit-tracker/
├── client/                 # React frontend
│   ├── public/            # Static files
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── contexts/      # React contexts
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom hooks
│   │   └── utils/         # Utility functions
│   └── package.json
├── server/                # Node.js backend
│   ├── config/           # Configuration files
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   ├── middleware/       # Custom middleware
│   └── package.json
├── package.json          # Root package.json
└── README.md
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/send-otp` - Send OTP
- `POST /api/auth/verify-otp` - Verify OTP
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile

### Habits
- `GET /api/habits` - Get user habits
- `POST /api/habits` - Create habit
- `PUT /api/habits/:id` - Update habit
- `DELETE /api/habits/:id` - Delete habit
- `POST /api/habits/:id/toggle` - Toggle completion

### Dashboard
- `GET /api/dashboard` - Get dashboard data
- `GET /api/dashboard/weekly-progress` - Weekly progress
- `GET /api/dashboard/monthly-progress` - Monthly progress
- `GET /api/dashboard/streaks` - Streak information

### Reminders
- `GET /api/reminders` - Get reminders
- `POST /api/reminders` - Create reminder
- `PUT /api/reminders/:id` - Update reminder
- `DELETE /api/reminders/:id` - Delete reminder

### Progress
- `GET /api/progress` - Get progress metrics
- `POST /api/progress` - Add progress metric
- `GET /api/progress/analytics` - Get analytics

### Schedules
- `GET /api/schedules` - Get schedules
- `POST /api/schedules` - Create schedule
- `PUT /api/schedules/:id` - Update schedule
- `DELETE /api/schedules/:id` - Delete schedule

### Yoga
- `GET /api/yoga/poses` - Get yoga poses
- `GET /api/yoga/routines` - Get yoga routines
- `GET /api/yoga/sessions` - Get user sessions
- `POST /api/yoga/sessions` - Add yoga session

## 🎨 UI Features

- **Modern Design**: Clean, responsive interface
- **Animations**: Smooth transitions and micro-interactions
- **Dark Mode Ready**: CSS variables for easy theming
- **Mobile First**: Responsive design for all devices
- **Accessibility**: ARIA labels and keyboard navigation
- **Loading States**: Skeleton screens and spinners
- **Error Handling**: User-friendly error messages

## 🔒 Security Features

- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt for password security
- **Input Validation**: Server-side validation
- **Rate Limiting**: API rate limiting
- **CORS Protection**: Cross-origin resource sharing
- **Helmet Security**: Security headers
- **SQL Injection Prevention**: Parameterized queries

## 📊 Database Schema

The application uses a comprehensive MySQL schema with tables for:
- Users and authentication
- Habits and completions
- Reminders and schedules
- Progress metrics
- Yoga sessions
- Badges and achievements
- Motivational quotes

## 🚀 Deployment

### Backend Deployment
1. Set up a MySQL database
2. Configure environment variables
3. Deploy to your preferred platform (Heroku, AWS, etc.)

### Frontend Deployment
1. Build the React app: `npm run build`
2. Deploy to static hosting (Netlify, Vercel, etc.)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API endpoints

## 🔮 Future Enhancements

- [ ] Dark mode toggle
- [ ] Social features and sharing
- [ ] Advanced analytics
- [ ] Mobile app (React Native)
- [ ] Integration with fitness trackers
- [ ] AI-powered habit suggestions
- [ ] Community challenges
- [ ] Export/import data
- [ ] Multi-language support

---

**Built with ❤️ for better wellness and habit tracking**
