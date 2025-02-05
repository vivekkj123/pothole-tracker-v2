# DriveEase: Pothole Mapping and Driver Alert System

A comprehensive web application built with React and Vite that helps track, monitor, and navigate around potholes. The system includes real-time pothole tracking, administrative management, and navigation assistance.
## Core Features
### 1. Real-time Pothole Mapping
- Interactive map using Leaflet with real-time pothole locations
- Color-coded markers indicating pothole status
Custom popup displays with detailed pothole information
- User location tracking and centering

### 2. Navigation System
- Turn-by-turn navigation with pothole alerts
- Route optimization considering pothole locations
- Location search with autocomplete using OpenStreetMap API
- Real-time route updates and alternative route suggestions

### 3. Administrative Dashboard
- Status tracking (Under Review, In Progress, Resolved)
- Visual analytics with Chart.js
- Bulk management capabilities
- Photo documentation for resolved potholes

### 4. Reporting System
- GPS-based location detection
- Photo upload with preview
- Email notification system
- Status tracking

## Technical Stack
### Frontend
- React 18.3.1
- Vite 5.4.8
- TailwindCSS 3.4.14
- ShadcnUI for components
- Leaflet for mapping
- Chart.js for analytics
### Backend Services (Firebase)
- Authentication
- Firestore Database
- Cloud Storage
- Real-time updates
- Architecture

### Component Structure
```
/src/components/: Reusable UI components
/src/pages/: Main application views
/src/utils/: Utility functions and Firebase configuration
/src/lib/: Helper functions and utilities
```

### State Management
- React Hooks for local state
- Firebase real-time listeners for global state
- Context API for theme and authentication

### Map Integration
- Leaflet for base mapping
- Custom markers and popups
- Real-time location tracking
- Route calculation using Leaflet Routing Machine

## Getting Started
1. Clone the repository
2. Install dependencies:
```
npm install
```
3. Configure environment variables:
```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```
4. Start development server:
```
npm run dev
```
## API Integration
### Firebase
- Authentication using Email/Password
- Firestore for pothole data storage
- Cloud Storage for image uploads
- Real-time updates using onSnapshot
### OpenStreetMap
- Geocoding for location search
- Reverse geocoding for coordinate translation
- Map tile rendering
### Performance Optimizations
- Debounced location search
- Lazy loading of map components
- Image optimization for uploads
- Cached route calculations
### Security Features
- Protected routes using PrivateRoute component
- Firebase Authentication integration
- Secure file upload handling
- Input sanitization
## Contributing
1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request
