const mongoose = require("mongoose");

const likeHistoryOfReelSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "Seller", default: null },
    reelId: { type: mongoose.Schema.Types.ObjectId, ref: "Reel", default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

likeHistoryOfReelSchema.index({ userId: 1 });
likeHistoryOfReelSchema.index({ sellerId: 1 });
likeHistoryOfReelSchema.index({ reelId: 1 });

module.exports = mongoose.model("LikeHistoryOfReel", likeHistoryOfReelSchema);
