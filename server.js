// server.js
const express = require('express');
const path = require('path');
require('dotenv').config(); // Step 1: Tell the server to load the .env file

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/env', (req, res) => {
    res.json({
        firebaseConfig: {
            // Step 2: The server looks up the value for FIREBASE_API_KEY
            apiKey: process.env.FIREBASE_API_KEY,
            authDomain: process.env.FIREBASE_AUTH_DOMAIN,
            databaseURL: process.env.FIREBASE_DATABASE_URL,
            projectId: process.env.FIREBASE_PROJECT_ID,
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
            messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
            appId: process.env.FIREBASE_APP_ID
        },
        // The server looks up the value for GOOGLE_CLIENT_ID
        googleClientId: process.env.GOOGLE_CLIENT_ID
    });
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});