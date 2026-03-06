const mongoose = require("mongoose");
require("dotenv").config();
const Setting = require("./src/models/setting.model");
const PromoCode = require("./src/models/promocode.model");

async function checkData() {
    try {
        await mongoose.connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@e-commerce.of30n2o.mongodb.net/${process.env.DB_NAME}`);
        console.log("Connected to DB:", process.env.DB_NAME);

        const settings = await Setting.find().lean();
        console.log("--- SETTINGS ---");
        settings.forEach(s => {
            console.log(`ID: ${s._id}, Comm: ${s.adminCommissionCharges}, isSellerCanAdd: ${s.isSellerCanAddProduct}, UpdatedAt: ${s.updatedAt}`);
        });

        const code = "BUY1GET1 $";
        const promo = await PromoCode.findOne({ promoCode: code }).lean();
        console.log("\n--- PROMO CODE ---");
        if (promo) {
            console.log(`ID: ${promo._id}, Code: ${promo.promoCode}, Amount: ${promo.discountAmount}, Type: ${promo.discountType}`);
        } else {
            console.log(`Promo code "${code}" not found!`);
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error("DEBUG ERROR:", err);
    }
}

checkData();
