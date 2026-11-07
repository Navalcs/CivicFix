# CivicFix – Smart Civic Issue Reporting Application

CivicFix is a mobile-based civic issue reporting application built using **React Native and Expo**. It helps citizens report local civic problems, submit photographs, share location details, and track the progress of their complaints.

The application aims to improve communication between citizens and local authorities by making civic issue reporting more accessible, organized, and transparent.

---

## Key Features

### 1. User Authentication
- User registration and login.
- Secure authentication using Supabase.
- User profile management.
- Edit profile functionality.

### 2. Civic Issue Reporting
- Report civic problems through the mobile application.
- Capture or select photographs of civic issues.
- Select issue categories.
- Add descriptions of reported problems.
- Capture geographical coordinates using device location.

### 3. AI-Based Issue Detection
- AI-assisted civic issue category detection.
- Groq integration for image-based issue detection.
- Helps identify civic problems from submitted photographs.

### 4. Complaint Management
- View submitted complaints.
- Track complaint status.
- View individual complaint details.
- Access previously submitted reports.

### 5. Location Integration
- Capture geographical coordinates.
- Generate Google Maps location links.
- Associate reported civic issues with their geographical locations.

### 6. Image Management
- Save captured images locally.
- Upload report images to Supabase Storage.
- Upload and manage profile images.

### 7. Email Integration
- Prepare complaint-related email notifications.
- Include issue information and location details.
- Support sending complaint information to the relevant authorities.

### 8. User Settings
- Manage user profile information.
- Access application settings.
- Navigate between different application sections.

---

## Technology Stack

| Technology | Purpose |
|---|---|
| React Native | Mobile application development |
| Expo | React Native development environment |
| JavaScript / TypeScript | Application programming |
| Supabase | Backend services |
| Supabase Auth | User authentication |
| Supabase Database | Application data management |
| Supabase Storage | Image storage |
| Groq API | AI-assisted image classification |
| Expo Location | Geographical location |
| React Navigation | Application navigation |
| Git & GitHub | Version control and source code management |

---

## Application Screens

The application includes the following screens:

- Login Screen
- Signup Screen
- Dashboard
- Report Issue
- Complaint Details
- My Reports
- Profile
- Edit Profile
- Settings

---

## Project Structure

```text
CivicFix/
│
├── assets/
│   ├── adaptive-icon.png
│   ├── civic-cleanup.png
│   ├── favicon.png
│   ├── icon.png
│   └── splash-icon.png
│
├── src/
│   ├── components/
│   │   ├── Button.tsx
│   │   ├── HeaderAvatar.tsx
│   │   └── Input.tsx
│   │
│   ├── hooks/
│   │   └── useAuth.tsx
│   │
│   ├── lib/
│   │   └── supabase.ts
│   │
│   ├── navigation/
│   │   ├── index.tsx
│   │   └── types.ts
│   │
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   └── SignupScreen.tsx
│   │   │
│   │   └── main/
│   │       ├── ComplaintDetailScreen.tsx
│   │       ├── DashboardScreen.tsx
│   │       ├── EditProfileScreen.tsx
│   │       ├── MyReportsScreen.tsx
│   │       ├── ProfileScreen.tsx
│   │       ├── ReportIssueScreen.tsx
│   │       └── SettingsScreen.tsx
│   │
│   ├── theme/
│   │   └── theme.ts
│   │
│   ├── types/
│   │   └── supabase.ts
│   │
│   └── utils/
│       ├── Groq.ts
│       ├── aiDetectIssue.ts
│       ├── email.ts
│       ├── sendEmailWithAttachment.ts
│       ├── uploadProfileImage.ts
│       └── uploadToSupabase.ts
│
├── .env.example
├── .gitignore
├── App.tsx
├── app.json
├── eas.json
├── index.ts
├── package.json
├── package-lock.json
└── tsconfig.json
```

---

# Installation and Setup

Follow these instructions to download and run CivicFix on your local machine.

## 1. Prerequisites

Install the following tools before starting:

- [Node.js (LTS)](https://nodejs.org/)
- [Git](https://git-scm.com/)
- [Visual Studio Code](https://code.visualstudio.com/)
- [Expo Go](https://expo.dev/go) on your Android device (if compatible with your project).

For Android emulator testing, install Android Studio and configure an Android Virtual Device.

## 2. Clone the Repository

Open your terminal and execute:

```bash
git clone https://github.com/Navalcs/CivicFix.git
```

Navigate into the project directory:

```bash
cd CivicFix
```

## 3. Install Dependencies

Install the required project packages:

```bash
npm install
```

This command installs the dependencies specified in `package.json`.

## 4. Configure Environment Variables

Create a `.env` file in the root directory of the project.

Add your Supabase configuration:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_publishable_or_anon_key
```

Make sure the variable names match those used in `src/lib/supabase.ts`.

**Important:**

- Never upload your `.env` file to GitHub.
- Never expose your Supabase service-role key.
- Do not put a private Groq API key in React Native frontend code.
- For Groq integration, use a secure backend API that stores the secret key on the server.

If your project uses different environment variable names, configure them according to the existing source code.

## 5. Configure Supabase

1. Create a project on [Supabase](https://supabase.com/).
2. Obtain your project URL and publishable/anon key.
3. Configure the credentials in your local `.env` file.
4. Create the required database tables according to the application's data model.
5. Configure Supabase Authentication.
6. Create and configure the required Storage buckets.
7. Set appropriate Row Level Security (RLS) policies.

The database schema, storage bucket names, and policies must match the implementation in the application.

## 6. Run the Application

Start the Expo development server:

```bash
npx expo start
```

After the server starts, Expo displays a QR code in the terminal.

### Running on Android

1. Install Expo Go on your Android device if the project is compatible with Expo Go.
2. Connect your phone and development computer to the same Wi-Fi network.
3. Scan the QR code using Expo Go.

Alternatively, press:

```bash
a
```

to launch the Android emulator.

**Note:** If your application uses native modules or development-client-specific functionality that Expo Go does not support, create and run an Expo development build instead.

---

## Useful Development Commands

| Command | Description |
|---|---|
| `npm install` | Install project dependencies |
| `npx expo start` | Start Expo development server |
| `npx expo start -c` | Start Expo and clear Metro cache |
| `npx expo start --android` | Start and open Android |
| `npx expo start --ios` | Start and open iOS (macOS required) |
| `npx expo start --web` | Start web version, if supported |
| `npx expo-doctor` | Check project configuration and dependencies |

---

## AI Integration

CivicFix includes an AI-assisted civic issue detection feature using Groq integration.

The objective is to help identify civic issues from submitted images and assist users in reporting problems.

AI-related functionality requires valid API configuration and a secure backend implementation. Do not expose private API credentials in the mobile application.

---

## Security Considerations

- Environment files are excluded using `.gitignore`.
- Never commit API keys, passwords, or private credentials.
- Use Supabase Row Level Security to protect user data.
- Never expose Supabase service-role credentials in frontend code.
- Store private third-party API keys on a secure backend.
- Validate user input and uploaded images.

---

## Future Improvements

Potential improvements for CivicFix include:

- Admin dashboard for municipal authorities.
- Real-time complaint status notifications.
- Global civic issue map.
- Analytics dashboard for reported issues.
- Improved AI-based civic issue classification.
- Integration with municipal complaint management systems.
- Volunteer participation and community engagement.

---

## Repository

**GitHub:** https://github.com/Navalcs/CivicFix

---

## Author

**Naval Mohanraj**

GitHub: [@Navalcs](https://github.com/Navalcs)

---

## License

This project is developed as an academic and practical software development project.

A formal open-source license can be added separately if the project is intended for public reuse.

---

**CivicFix – Building smarter and more connected communities through technology.**
