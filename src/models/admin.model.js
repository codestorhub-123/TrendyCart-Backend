const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema(
    {
        username: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        image: { type: String, default: "" },
        name: { type: String, default: "Admin" },
        purchaseCode: { type: String, default: "" }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Admin', adminSchema);
