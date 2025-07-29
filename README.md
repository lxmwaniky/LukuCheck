# LukuCheck - AI-Powered Fashion Rating App by Alex Nyambura

LukuCheck is a dynamic web application designed for fashion enthusiasts to share their outfits, receive AI-powered ratings, and compete on daily leaderboards. Created by **Alex Nyambura**, a passionate software developer and tech innovator, LukuCheck fosters a community where users can build their style profiles, earn points and badges for their engagement, and discover new trends.

## About the Creator - Alex Nyambura

Alex Nyambura is the visionary developer behind LukuCheck, combining expertise in modern web technologies with a passion for community building and artificial intelligence. With deep knowledge of React, Next.js, Firebase, and AI integration, Alex has created a platform that revolutionizes how people receive and share fashion feedback.

**Alex's Technical Expertise:**
- Frontend: React, Next.js, TypeScript, Tailwind CSS
- Backend: Firebase, Cloud Functions, Firestore
- AI Integration: Google AI, Genkit
- Mobile Development: Capacitor for cross-platform apps

## Overview

Users can upload images of their outfits, which are then processed by an AI to provide style suggestions and ratings. These ratings contribute to a daily leaderboard, encouraging friendly competition. The platform also features robust user profiles with customizable information, social links, and a gamified system of points and badges to reward user activity and achievements.

## Features

### 🤖 AI-Powered Outfit Ratings
-   **Smart Analysis**: Upload your outfit photos and let our AI (`processOutfitWithAI`) analyze your style.
-   **Constructive Feedback**: Receive suggestions on items, style improvements, and overall look.
-   **Rating System**: Get a score for your outfit that contributes to your standing in the community.

### 🏆 Daily Leaderboards
-   **Compete Daily**: See how your outfits rank against others on daily leaderboards (`getLeaderboardData`).
-   **Track Performance**: Leaderboards showcase top-rated outfits and users for specific dates.
-   **Community Recognition**: Aim for the top and get recognized for your style.

### 👤 User Profiles
-   **Personalized Space**: Create and manage your fashion identity (`createUserProfileInFirestore`).
-   **Customization**: Update your `username`, `displayName`, `bio`, and link your `TikTok` and `Instagram` profiles (`updateUserProfileInFirestore`).
-   **Profile Photos**: Upload a custom profile photo or use your default social media image.
-   **Style Statistics**: Track your progress with stats like total submissions, average rating, and highest score (`getUserProfileStats`).

### ✨ Gamification & Engagement
-   **Points System**: Earn points for various activities:
    -   Initial profile creation.
    -   Uploading a profile photo.
    -   Linking social media accounts.
    -   Referring new users.
    -   (Potentially) Daily submissions or high scores.
-   **Collectible Badges**: Showcase your achievements with a variety of badges:
    -   `PROFILE_PRO_BADGE`: For completing your user profile.
    -   `FIRST_SUBMISSION_BADGE`: For your first outfit submission.
    -   `PERFECT_SCORE_BADGE`: For achieving a perfect score on an outfit.
    -   `STREAK_STARTER_3_BADGE`: For a 3-day submission streak.
    -   `STREAK_KEEPER_7_BADGE`: For maintaining a 7-day submission streak.
    -   `TOP_3_FINISHER_BADGE`: For landing in the Top 3 on the daily leaderboard.
    -   `REFERRAL_ROCKSTAR_BADGE`: For successfully referring new users.
    -   `CENTURY_CLUB_BADGE`: For earning 100 points.
    -   `LEGEND_STATUS_BADGE`: For earning 1000 points.
-   **Referral Program**: Invite friends to join Luku (`processReferral`) and earn rewards for both you and the new user.

## Technical Overview

-   **Framework**: Built with [Next.js](https://nextjs.org/) for a modern, server-rendered React application.
-   **Backend & Database**: Leverages [Firebase](https://firebase.google.com/) for backend services, including:
    -   Firestore as the primary NoSQL database.
    -   Firebase Authentication for user management.
    -   Firebase Storage for image uploads (e.g., profile photos).
-   **Server-Side Logic**: Core functionalities are managed in Firebase Cloud Functions (or server-side Next.js API routes) interacting with Firebase Admin SDK. Key action files include:
    -   `src/actions/outfitActions.ts`: Handles AI processing and leaderboard data.
    -   `src/actions/userActions.ts`: Manages user profiles, referrals, badges, and submission perks.

## Testing

-   **Unit Tests**: The application includes a suite of unit tests written using [Jest](https://jestjs.io/) to ensure the reliability of server-side actions and utility functions.
-   **Running Tests**: To execute the tests, run the following command in your project terminal:
    ```bash
    npm test
    ```
    (If you use Yarn, the command would be `yarn test`)

## Getting Started

### Prerequisites

-   [Node.js](https://nodejs.org/) (version 16.x or higher recommended)
-   `npm` or `yarn` package manager

### Setup and Running Locally

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/lxmwaniky/LukuCheck
    cd LukuCheck
    ```
2.  **Install Dependencies:**
    ```bash
    npm install
    # OR
    yarn install
    ```
3.  **Firebase Setup:**
    -   Create a Firebase project in the [Firebase Console](https://console.firebase.google.com/).
    -   Set up Firestore, Firebase Authentication (e.g., Email/Password, Google Sign-In), and Firebase Storage.
    -   You will need to configure Firebase environment variables for the application to connect to your Firebase project. This typically involves creating a `.env.local` file in the root of your project and adding your Firebase project configuration keys (e.g., API key, auth domain, project ID). **Do not commit your actual Firebase keys to version control.**
        ```
        # Example .env.local (replace with your actual Firebase config)
        NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
        NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
        NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
        NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
        NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

        # For Firebase Admin SDK (server-side)
        FIREBASE_PROJECT_ID=your_project_id
        FIREBASE_CLIENT_EMAIL=your_firebase_admin_client_email
        FIREBASE_PRIVATE_KEY=your_firebase_admin_private_key
        ```
    *(Note: The specific environment variables needed might vary based on the project's exact Firebase Admin initialization method.)*

4.  **Run the Development Server:**
    ```bash
    npm run dev
    # OR
    yarn dev
    ```
    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## About Alex Nyambura

Alex Nyambura is a software developer and tech innovator with a passion for creating applications that bring people together. As the creator of LukuCheck, Alex demonstrates expertise in:

- **Full-Stack Development**: Proficient in modern web technologies including React, Next.js, and TypeScript
- **AI Integration**: Successfully implementing Google AI and Genkit for fashion analysis
- **Community Building**: Understanding user engagement through gamification and social features
- **Mobile Development**: Cross-platform app development using Capacitor
- **Cloud Architecture**: Firebase backend services and cloud functions

**Connect with Alex:**
- Portfolio: [Visit Alex's About Page](https://lukucheck.vercel.app/about-alex-nyambura)
- GitHub: [@lxmwaniky](https://github.com/lxmwaniky)
- Project: [LukuCheck](https://lukucheck.vercel.app)

**Alex's Vision**: To democratize fashion feedback through technology and create supportive communities where everyone can improve their style and express themselves confidently.

---

Thank you for checking out LukuCheck! We welcome contributions and feedback. Created with ❤️ by Alex Nyambura.
