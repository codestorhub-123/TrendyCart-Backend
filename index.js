
require('dotenv').config();

const mongoose = require('mongoose');
const express = require('express');
const app = express();
const path = require('path');
const cors = require('cors');
const http = require('http');
const logger = require('morgan');

// Swagger
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./utils/swagger.js');

// Initialize Firebase
require('./utils/firebase');

// Existing Middleware & Routes
const { user_auth } = require('./middleware/authorization/authorization.js');
const { check_validation } = require('./utils/validateRequest.js');
const route = require('./src/routes/index.route.js');


require('./middleware/database/connectDatabase.js');



// Styles & Logging
app.use(logger("dev"));

app.use(cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "key"]
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files (Must be BEFORE routes and auth)
const storagePath = path.join(__dirname, "storage");
app.use(["/storage", `${process.env.API_COMMON_ROUTE}/storage`], express.static(storagePath));
app.use(express.static(path.join(__dirname, "public")));

// app.use(`${process.env.API_COMMON_ROUTE}/uploads`, express.static(path.join(__dirname, 'uploads')));
// console.log("API_COMMON_ROUTE =", process.env.API_COMMON_ROUTE);




// Import model
const fs = require('fs'); // Required for updateSettingFile

// Import model
const Setting = require("./src/models/setting.model"); // Updated path
const settingJson = {};

// Declare global variable
global.settingJSON = settingJson;

// Handle global.settingJSON when pm2 restart
async function initializeSettings() {
    try {
        if (!Setting) {
            console.log("Setting model not found, skipping initializeSettings db fetch.");
            global.settingJSON = settingJson;
            return;
        }
        const setting = await Setting.findOne().sort({ createdAt: -1 });
        if (setting) {
            console.log("In setting initialize Settings");
            global.settingJSON = setting;
        } else {
            global.settingJSON = settingJson;
        }
    } catch (error) {
        console.error("Failed to initialize settings:", error);
    }
}

initializeSettings();
// module.exports = initializeSettings; // Typically index.js is entry point, but maybe used elsewhere.

// Declare the function as a global variable to update the setting.js file
global.updateSettingFile = (settingData) => {
    const settingJSON = JSON.stringify(settingData, null, 2);
    try {
        // Saving to setting.js in root or specific path? User code implied root "setting.js"
        fs.writeFileSync("setting.js", `module.exports = ${settingJSON};`, "utf8");
        global.settingJSON = settingData; // Update global variable
        console.log("Settings file updated.", global.settingJSON?.privacyPolicyText);
    } catch (err) {
        console.error("Error writing setting.js", err);
    }
};

// --------------------------------------------------------------------------
// Routes
// --------------------------------------------------------------------------

// Existing Routes
app.use(`${process.env.API_COMMON_ROUTE}/api-docs`, swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get(`${process.env.API_COMMON_ROUTE}/heartbeat`, (req, res) => res.status(200).json({ status: true, message: "Server is reachable" }));
app.use(`${process.env.API_COMMON_ROUTE}`, user_auth, check_validation, route);


// Public File Fallback - Handle SPA routing, excluding API and Storage
app.use((req, res, next) => {
    // console.log("Fallback hit for:", req.path);
    if (req.path.startsWith("/api") || req.path.startsWith("/storage") || req.path.startsWith(`${process.env.API_COMMON_ROUTE}`)) {
        return next();
    }
    const indexFile = path.join(__dirname, "public", "index.html");
    if (fs.existsSync(indexFile)) {
        return res.status(200).sendFile(indexFile);
    }
    next();
});


// --------------------------------------------------------------------------
// Server & Socket.io
// --------------------------------------------------------------------------

const server = http.createServer(app);
global.io = require("socket.io")(server);

// socket.js
// require("./socket"); // WARNING: File does not exist yet

// workers
// require("./workers/auctionWorker"); // WARNING: File does not exist yet
// require("./workers/manualAuctionWorker"); // WARNING: File does not exist yet

// Mongoose connection events (Adding user's listeners to existing connection)
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("MONGO: successfully connected to db (from index.js listener)");
});

// Set port and listen the request
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log("Hello World ! listening on " + PORT);
    console.log(`Magic happens on port ${PORT}`);
});

