# ColoVision - CRC Detection Web Application

[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/F63P1L7A)
[![Open in Visual Studio Code](https://classroom.github.com/assets/open-in-vscode-2e0aaae1b6195c2367325f4f02e2d04e9abb55f0b24a779b69b11b9e10269abc.svg)](https://classroom.github.com/online_ide?assignment_repo_id=20100719&assignment_repo_type=AssignmentRepo)

## Overview

ColoVision is a web application designed for colorectal cancer (CRC) detection using advanced image analysis and machine learning techniques. The application provides a secure, user-friendly interface for medical professionals to upload and analyze medical images for potential CRC indicators.

## Features

- 🔐 **Secure Authentication**: Firebase-based authentication with 2FA support
- 📸 **Image Upload & Analysis**: Drag-and-drop image upload with real-time processing
- 🎯 **AI-Powered Detection**: Advanced machine learning models for CRC detection
- 📊 **Detailed Reports**: Comprehensive analysis results with confidence scores
- 🎨 **Modern UI**: Built with React, TypeScript, and Tailwind CSS
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Radix UI Components
- **Authentication**: Firebase Auth with 2FA
- **Routing**: Custom React Router
- **State Management**: React Context API
- **Build Tool**: Vite with SWC

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Firebase project setup

### Installation

1. Clone the repository:
```bash
git clone https://github.com/BobKimani/Colovision-CRC-Detection.git
cd Colovision-CRC-Detection
```

2. Install dependencies:
```bash
npm install
```

3. Set up Firebase environment variables:
Create a `.env.local` file in the root directory with your Firebase configuration:
```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_APP_ID=your_app_id_here
```

**To get these values:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project or create a new one
3. Go to Project Settings > General
4. Scroll down to "Your apps" and select your web app
5. Copy the configuration values to your `.env.local` file

**Enable Google Authentication:**
1. In Firebase Console, go to Authentication > Sign-in method
2. Enable "Google" as a sign-in provider
3. Add your domain to authorized domains if needed

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   └── ...             # Page-specific components
├── routes/             # Routing configuration
├── services/           # API and authentication services
└── styles/             # Global styles
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Medical imaging data sources
- Open source UI component libraries
- Firebase for authentication services
