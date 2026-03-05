const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const PromoCode = require('./src/models/promocode.model');

async function checkBogo() {
    try {
        if (!process.env.MONGODB_CONNECTION_STRING) {
            console.error("MONGODB_CONNECTION_STRING is missing in .env");
            process.exit(1);
        }
        await mongoose.connect(process.env.MONGODB_CONNECTION_STRING);
        console.log("Connected to MongoDB");
        const bogo = await PromoCode.findOne({ promoCode: "BOGO" }).lean();
        console.log("BOGO PromoCode Data:", JSON.stringify(bogo, null, 2));
        await mongoose.connection.close();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkBogo();
