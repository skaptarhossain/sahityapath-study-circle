# SahityaPath Study Circle

A Bengali-language study circle application built with React, Firebase, and AI integration using Google Gemini.

## Features

- **Personal Desk**: Manage your personal notes and quizzes
- **Group Study Circles**: Collaborate with peers in study groups
- **AI-Powered Notes**: Generate study notes using Google Gemini AI
- **Category Management**: Organize content with custom categories
- **Firebase Authentication**: Secure login with email/password and Google OAuth
- **Real-time Sync**: Live updates across all connected clients using Firestore

## Setup Instructions

### Prerequisites

- Node.js 18 or higher
- A Google Firebase project
- A Google Gemini API key (optional, for AI features)

### Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Firebase:**
   - Update the `firebaseConfig` object in `index.html` (lines 29-37) with your Firebase project credentials
   - You can find these values in your Firebase Console under Project Settings

3. **Configure Gemini API (Optional):**
   - Copy `.env.example` to `.env`
   - Add your Gemini API key:
     ```bash
     cp .env.example .env
     # Edit .env and add your GEMINI_KEY
     ```
   - Get your API key from: https://makersuite.google.com/app/apikey

4. **Start the development servers:**

   In one terminal, start the frontend:
   ```bash
   npm run start
   ```
   This will start http-server on port 8080

   In another terminal, start the proxy server (for AI features):
   ```bash
   npm run proxy
   ```
   This will start the Express proxy server on port 4000

5. **Access the application:**
   - Open your browser to http://localhost:8080
   - Create an account or sign in with Google

## Manual Verification Steps

### Testing the Frontend (http-server)

1. Run `npm run start`
2. Verify the server starts on port 8080
3. Open http://localhost:8080 in your browser
4. Verify the login page loads correctly
5. Create a test account and sign in
6. Verify you can access the dashboard

### Testing the Proxy Server

1. Run `npm run proxy`
2. Verify the server starts on port 4000
3. Check the health endpoint:
   ```bash
   curl http://localhost:4000/health
   ```
   Expected response: `{"status":"ok","service":"sahityapath-proxy"}`

### Testing AI Features

**Note:** AI features require a valid GEMINI_KEY in your environment.

1. Sign in to the application
2. Navigate to Personal Desk
3. Click "AI নোট" button
4. Enter a topic in Bengali or English
5. Click "তৈরি করুন" to generate a note
6. If GEMINI_KEY is not configured, you'll see a graceful error message

## GitHub Codespaces Setup

This project is configured to work seamlessly with GitHub Codespaces:

1. Open the repository in Codespaces
2. The devcontainer will automatically:
   - Set up Node.js 18
   - Install dependencies via `npm install`
   - Forward ports 8080 and 4000

3. Add your secrets in Codespaces:
   - Go to Codespaces settings for this repository
   - Add `GEMINI_KEY` as a secret
   - The proxy server will automatically pick it up

## Security Notes

- ✅ No secrets are committed to this repository
- ✅ Environment variables are loaded from `.env` (which is gitignored)
- ✅ `.env.example` is provided as a template
- ✅ Firebase client config is public (as intended for client-side apps)
- ⚠️ Never commit your `.env` file or expose your `GEMINI_KEY`

## Project Structure

```
.
├── index.html           # Single-page React application
├── package.json         # Dependencies and scripts
├── server.js           # Express proxy server for Gemini API
├── .env.example        # Environment variables template
├── .gitignore          # Git ignore rules
├── .devcontainer/      # GitHub Codespaces configuration
│   └── devcontainer.json
└── README.md           # This file
```

## Troubleshooting

### Port 8080 or 4000 already in use
```bash
# Find and kill the process using the port
lsof -ti:8080 | xargs kill -9
lsof -ti:4000 | xargs kill -9
```

### npm install fails
- Ensure you're using Node.js 18 or higher
- Try removing `node_modules` and `package-lock.json`, then run `npm install` again

### AI features not working
- Verify your `GEMINI_KEY` is set in the `.env` file
- Check the proxy server logs for error messages
- Ensure the proxy server is running on port 4000

## License

This project is licensed under the MIT License.
