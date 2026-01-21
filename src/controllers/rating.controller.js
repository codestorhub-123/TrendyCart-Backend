const Rating = require("../models/rating.model");
const { get_message } = require("../../utils/message");

//import model
const User = require("../models/user.model");
const Product = require("../models/product.model");

exports.addRating = async (req, res) => {
  try {
    const { productId, rating, review } = req.body;
    const userId = req.user.id;

    // 1️⃣ Validation
    if (!productId || rating === undefined) {
      return res.status(200).json({
        status: false,
        message: get_message(1138),
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(200).json({
        status: false,
        message: get_message(1139),
      });
    }

    // 2️⃣ Parallel checks
    const [user, product, existingRating] = await Promise.all([
      User.findById(userId).select("_id"),
      Product.findById(productId).select("_id"),
      Rating.findOne({ userId, productId }).select("_id"),
    ]);

    if (!user) {
      return res.status(404).json({ status: false, message: get_message(1019) });
    }

    if (!product) {
      return res.status(404).json({ status: false, message: get_message(1059) });
    }

    if (existingRating) {
      return res.status(200).json({
        status: false,
        message: get_message(1140),
      });
    }

    // 3️⃣ Save rating
    const newRating = await Rating.create({
      userId,
      productId,
      rating,
      review: review || "",
    });

    return res.status(200).json({
      status: true,
      message: "Rating added successfully",
      rating: newRating,
    });
  } catch (error) {
    console.error("addRating error:", error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error",
    });
  }
};


exports.getRating = async (req, res) => {
  try {
    const totalRating = await Rating.aggregate([
      {
        $group: {
          _id: "$productId",
          totalUser: { $sum: 1 }, //totalRating by user
          avgRating: { $avg: "$rating" },
        },
      },
      { $sort: { avgRating: -1 } },
    ]);

    return res.status(200).json({ status: true, message: "Success", totalRating });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error",
    });
  }
};
