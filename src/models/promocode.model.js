const { default: mongoose } = require("mongoose");

const promoCodeSchema = new mongoose.Schema(
  {
    promoCode: { type: String, trim: true, default: "" },
    discountType: { type: Number, enum: [1, 2] }, // 1.percentage 2.flat (Aligned with order.controller.js)
    discountAmount: { type: Number, default: 0 }, // amount or percentage
    minOrderValue: { type: Number, default: 0 },
    conditions: { type: Array, default: [] },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

promoCodeSchema.index({ createdAt: -1 });
promoCodeSchema.index({ promoCode: 1 });
promoCodeSchema.index({ isDeleted: 1 });

module.exports = mongoose.model("PromoCode", promoCodeSchema);
