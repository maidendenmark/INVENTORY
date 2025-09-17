// server.js
const express = require('express');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Step 1: Handle the specific '/env' API route first.
app.get('/env', (req, res) => {
    res.json({
        firebaseConfig: {
            apiKey: process.env.FIREBASE_API_KEY,
            authDomain: process.env.FIREBASE_AUTH_DOMAIN,
            projectId: process.env.FIREBASE_PROJECT_ID,
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
            messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
            appId: process.env.FIREBASE_APP_ID
        },
        googleClientId: process.env.GOOGLE_CLIENT_ID
    });
});

// Step 2: Then, serve all other static files from the 'public' folder.
// This will handle requests for index.html, script.js, and everything else.
app.use(express.static(path.join(__dirname, 'public')));

// Step 3: Add a catch-all route to serve index.html for any other requests.
// This mirrors the behavior of Firebase Hosting rewrites.
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});