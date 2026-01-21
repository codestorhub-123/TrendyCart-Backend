const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
    {
        email: String,
        otp: Number,
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

otpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 600 }); // OTP expires in 10 minutes

module.exports = mongoose.model("OTP", otpSchema);
