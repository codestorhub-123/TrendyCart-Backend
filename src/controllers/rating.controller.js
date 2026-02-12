const mongoose = require("mongoose");
const Rating = require("../models/rating.model");
const Order = require("../models/order.model");
const { get_message } = require("../../utils/message");

//import model
const User = require("../models/user.model");
const Product = require("../models/product.model");

exports.addRating = async (req, res) => {
  try {
    const { productId, rating } = req.body;
    const userId = req.user.id;

    // 1️⃣ Validation
    if (!productId || rating === undefined) {
      return res.status(200).json({
        status: false,
        message: get_message(1074),
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(200).json({
        status: false,
        message: get_message(1139),
      });
    }

    // 2️⃣ Parallel checks: User, Product, Delivered Order, and Existing Rating
    const [user, product, deliveredOrder, existingRating] = await Promise.all([
      User.findById(userId).select("_id"),
      Product.findById(productId).select("_id"),
      Order.findOne({
        userId: userId,
        items: {
          $elemMatch: {
            productId: productId,
            status: "Delivered"
          }
        }
      }).select("_id"),
      Rating.findOne({ userId, productId }).select("_id"),
    ]);

    if (!user) {
      return res.status(404).json({ status: false, message: get_message(1019) });
    }

    if (!product) {
      return res.status(404).json({ status: false, message: get_message(1059) });
    }

    // ⭐ Check if product was purchased and delivered
    if (!deliveredOrder) {
      return res.status(200).json({
        status: false,
        message: "You can only rate products that have been delivered to you.",
      });
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
      review: "",
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
    const { productId } = req.query;

    if (!productId) {
      return res.status(200).json({ status: false, message: "Product ID is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(200).json({ status: false, message: "Invalid product ID" });
    }

    const totalRating = await Rating.aggregate([
      { $match: { productId: new mongoose.Types.ObjectId(productId) } },
      {
        $group: {
          _id: "$productId",
          totalUser: { $sum: 1 },
          avgRating: { $avg: "$rating" },
        },
      },
    ]);

    return res.status(200).json({
      status: true,
      message: "Rating retrieved successfully",
      rating: totalRating.length > 0 ? totalRating[0] : { totalUser: 0, avgRating: 0 }
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error",
    });
  }
};
