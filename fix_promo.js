const mongoose = require("mongoose");
require("dotenv").config();
const PromoCode = require("./src/models/promocode.model");

async function fixPromoCode() {
    try {
        await mongoose.connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@e-commerce.of30n2o.mongodb.net/${process.env.DB_NAME}`);
        console.log("Connected to DB:", process.env.DB_NAME);

        const code = "BUY1GET1 $";
        const result = await PromoCode.updateOne(
            { promoCode: code },
            { $set: { discountType: 2 } } // Set to Flat discount
        );

        if (result.matchedCount > 0) {
            console.log(`Success: Updated promo code "${code}" to discountType: 2 (Flat).`);
        } else {
            console.log(`Error: Promo code "${code}" not found.`);
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error("FIX DATA ERROR:", err);
    }
}

fixPromoCode();
