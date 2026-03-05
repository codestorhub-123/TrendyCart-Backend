const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const PromoCode = require('./src/models/promocode.model');

async function fixBogo() {
    try {
        if (!process.env.MONGODB_CONNECTION_STRING) {
            console.error("MONGODB_CONNECTION_STRING is missing in .env");
            process.exit(1);
        }
        await mongoose.connect(process.env.MONGODB_CONNECTION_STRING);
        console.log("Connected to MongoDB");

        // Update BOGO to discountType: 2 (Flat)
        const result = await PromoCode.updateOne(
            { promoCode: "BOGO" },
            { $set: { discountType: 2 } }
        );

        if (result.modifiedCount > 0) {
            console.log("SUCCESS: BOGO promo code discountType updated to 2 (Flat).");
        } else {
            console.log("INFO: BOGO promo code already updated or not found.");
        }

        const bogo = await PromoCode.findOne({ promoCode: "BOGO" }).lean();
        console.log("Updated BOGO PromoCode Data:", JSON.stringify(bogo, null, 2));

        await mongoose.connection.close();
    } catch (err) {
        console.error("ERROR:", err);
        process.exit(1);
    }
}

fixBogo();
