# Emerald Lakers Basketball Club PWA

A modern Progressive Web App for managing basketball club operations, player development tracking, and team management.

## 🏀 Features

### For Players & Parents
- **Personal Dashboard**: View individual performance metrics, MVP votes, and skill assessments
- **Progress Tracking**: Visual charts showing skill development over time
- **Game History**: Access to all game results and personal MVP awards
- **Coach Notes**: Read public feedback and training notes from coaches
- **Offline Access**: View data even without internet connection

### For Coaches
- **Team Dashboard**: Comprehensive overview of all teams and players
- **Performance Analytics**: Data visualizations for team performance, attendance, and skill progression
- **MVP Leaderboard**: Track top performers across teams
- **Player Comparison**: Compare skill levels and progress between players
- **Training Management**: Record attendance and add player notes
- **Multi-team Support**: Manage multiple teams from one interface

### For Administrators
- **Player Management**: Add, edit, and organize player rosters
- **Team Allocation**: Smart team balancing based on skill levels
- **CSV Import/Export**: Bulk player data management
- **Role Management**: Assign user roles (Player, Coach, Admin)
- **Team Analytics**: View team balance and distribution metrics
- **Audit Logs**: Track all system changes and activities

### Technical Features
- **Offline-First Architecture**: Full functionality without internet
- **Auto-Sync**: Automatic data synchronization when connection is restored
- **Multi-Platform Auth**: Google, Apple, and Email/Password login
- **Role-Based Access**: Secure permissions based on user roles
- **Responsive Design**: Works seamlessly on mobile, tablet, and desktop
- **PWA Installation**: Install as a native app on any device
- **Real-time Updates**: Live data synchronization using Firebase
- **Data Persistence**: Local storage with IndexedDB

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Firebase account (free tier works fine)

### Installation

1. **Clone and install dependencies**
```bash
cd basketball-pwa
npm install
```

2. **Configure Firebase**

Create a `.env` file in the root directory:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

3. **Set up Firebase Authentication**

In Firebase Console:
- Enable Email/Password authentication
- Enable Google authentication
- Enable Apple authentication (optional)
- Add authorized domains for your app

4. **Initialize Firestore Database**

Create these collections in Firestore:
- `users` - User profiles and roles
- `players` - Player information
- `curriculum` - Skills and drills
- `evaluations` - Skill assessments
- `games` - Game records
- `attendance` - Training attendance
- `training_notes` - Coach notes
- `schedule` - Events and calendar
- `notifications` - User notifications
- `audit_logs` - System activity logs

5. **Run the development server**
```bash
npm run dev
```

Visit `http://localhost:3000`

### Building for Production

```bash
npm run build
npm run preview  # Preview production build locally
```

## 📱 Installing as PWA

### On Mobile (iOS/Android)
1. Open the app in your mobile browser
2. Tap the share/menu button
3. Select "Add to Home Screen"
4. The app will install like a native app

### On Desktop (Chrome/Edge)
1. Open the app in your browser
2. Click the install icon in the address bar
3. Click "Install"

## 🔐 User Roles & Permissions

### Player
- View personal dashboard and statistics
- Access game history and skill assessments
- Read public coach notes
- Update personal profile

### Coach
- Everything a Player can do, plus:
- View team dashboards and analytics
- Manage training attendance
- Add player evaluations and notes
- Access all players in assigned teams
- View performance trends and charts

### Admin
- Everything a Coach can do, plus:
- Manage all players and teams
- Import/export player data
- Assign user roles
- Access team allocation tools
- View system-wide analytics
- Manage curriculum and skills

## 📊 Data Structure

### Player Profile
```javascript
{
  name: "John Smith",
  email: "john@example.com",
  dob: "2010-05-15",
  team: "Lakers U14",
  role: "player",
  parent1Name: "Jane Smith",
  parent1Email: "jane@example.com",
  // ... additional fields
}
```

### Skill Evaluation
```javascript
{
  playerId: "player_id",
  skillId: "skill_id",
  level: 3, // 1-4 (Emerging, Developing, Competent, Leader)
  date: "2024-01-15",
  notes: "Great improvement in...",
  evaluatorId: "coach_id"
}
```

### Game Record
```javascript
{
  team: "Lakers U14",
  opponent: "Warriors",
  date: "2024-01-20",
  result: "win", // win, loss, draw
  mvp: "player_id",
  metrics: {
    teamWork: 3,
    defense: 4,
    // ... other metrics
  }
}
```

## 🎨 Customization

### Branding
- Update colors in `tailwind.config.js`
- Replace logo in `public/` folder
- Modify team name in components

### Skills & Drills
- Add custom skill categories
- Define evaluation criteria
- Upload drill videos/documents

## 🔧 Suggested Improvements

### Enhanced Features
1. **Video Integration**: Upload and link drill videos to skills
2. **Player Messaging**: Direct messaging between coaches and players/parents
3. **Advanced Analytics**: ML-powered insights and predictions
4. **Goal Setting**: Personal and team goal tracking
5. **Attendance Patterns**: AI-detected attendance trends and alerts
6. **Season Comparisons**: Compare player/team performance across seasons
7. **Export Reports**: Generate PDF reports for players/parents
8. **Calendar Integration**: Sync with Google Calendar, Outlook
9. **Push Notifications**: Mobile notifications for important updates
10. **Multi-language Support**: Internationalization for different languages

### Technical Improvements
1. **Automated Testing**: Add Jest and React Testing Library
2. **Error Boundary**: Better error handling and recovery
3. **Performance Monitoring**: Integration with Firebase Performance
4. **Code Splitting**: Lazy loading for better performance
5. **Image Optimization**: Compress and cache player photos
6. **Backup System**: Automated database backups
7. **Rate Limiting**: Prevent API abuse
8. **Security Rules**: Enhanced Firestore security rules
9. **TypeScript**: Migrate to TypeScript for better type safety
10. **CI/CD Pipeline**: Automated deployment with GitHub Actions

### UX Enhancements
1. **Onboarding Tutorial**: First-time user guidance
2. **Dark Mode**: Theme toggle for better accessibility
3. **Keyboard Shortcuts**: Power user features
4. **Drag & Drop**: Better team allocation interface
5. **Bulk Operations**: Multi-select for batch updates
6. **Search Improvements**: Advanced filtering and sorting
7. **Export Options**: More export formats (Excel, PDF)
8. **Print Layouts**: Optimized print views
9. **Accessibility**: WCAG 2.1 AA compliance
10. **Animation**: Smooth transitions and micro-interactions

## 📋 CSV Import Format

```csv
Player First,Player Surname,DOB,Team,P1 First,P1 Surname,P2 First,P2 Surname,P1 Email,P2 Email,Role
John,Smith,2010-05-15,Lakers U14,Jane,Smith,Bob,Smith,jane@email.com,bob@email.com,player
Sarah,Johnson,2011-03-20,Lakers U12,Mary,Johnson,,,mary@email.com,,player
```

## 🐛 Troubleshooting

### App won't load offline
- Check if service worker is registered
- Clear browser cache and reinstall PWA
- Verify IndexedDB is enabled

### Login issues
- Verify Firebase configuration in `.env`
- Check Firebase Console for authentication errors
- Ensure authorized domains are configured

### Data not syncing
- Check internet connection
- Verify Firestore security rules
- Check browser console for errors

## 📄 License

This project is licensed under the MIT License.

## 🤝 Support

For support, email support@emeraldlakers.com or create an issue in the repository.

## 🙏 Acknowledgments

Built with:
- React 18
- Vite
- Tailwind CSS
- Firebase
- Chart.js
- React Router
- Lucide Icons
