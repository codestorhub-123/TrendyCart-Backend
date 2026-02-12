const mongoose = require("mongoose");
const Reel = require("../models/reel.model");
const User = require("../models/user.model");
const LikeHistoryOfReel = require("../models/likeHistoryOfReel.model");
const Seller = require("../models/seller.model");
const Product = require("../models/product.model");
const ReportReel = require("../models/reportoReel.model");
const fs = require("fs");
const { deleteFiles } = require("../../utils/deleteFile");
const { get_message } = require("../../utils/message");

const getApiBase = require("../../utils/getApiBase");

const config = { baseURL: getApiBase() };

exports.getReelsForUser = async (req, res) => {
  try {
    // ✅ USER FROM JWT (handle guest)
    const userId = (req.user && req.user.id) ? new mongoose.Types.ObjectId(req.user.id) : null;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const reelId = (req.query.reelId && req.query.reelId !== "undefined" && mongoose.Types.ObjectId.isValid(req.query.reelId))
      ? new mongoose.Types.ObjectId(req.query.reelId)
      : null;

    // ✅ FAST USER CHECK (only if logged in)
    if (userId) {
      const user = await User.findById(userId).select("_id isBlock").lean();
      if (!user) {
        return res.status(404).json({ status: false, message: get_message(1019) });
      }
      if (user.isBlock) {
        return res.status(403).json({ status: false, message: get_message(1017) });
      }
    }

    // ✅ MATCH QUERY (index friendly)
    const matchQuery =
      global.settingJSON?.isFakeData === true
        ? {}
        : { isFake: false };

    const role = req.user ? req.user.role : null;

    // ✅ AGGREGATION PIPELINE
    const reels = await Reel.aggregate([
      { $match: matchQuery },

      // ⭐ PRIORITY LOGIC (NO JS ARRAY OPS)
      ...(reelId
        ? [
          {
            $addFields: {
              priority: {
                $cond: [{ $eq: ["$_id", reelId] }, 0, 1],
              },
            },
          },
        ]
        : []),

      // ✅ SORT FIRST (indexed createdAt)
      { $sort: { priority: 1, createdAt: -1 } },

      // ✅ LIMIT EARLY (CRITICAL FOR SPEED)
      { $skip: skip },
      { $limit: limit },

      // ❤️ LIKE CHECK (lightweight lookup)
      {
        $lookup: {
          from: "likehistoryofreels",
          let: { reelId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$reelId", "$$reelId"] },
                    role === "user"
                      ? { $eq: ["$userId", userId] }
                      : role === "seller"
                        ? { $eq: ["$sellerId", userId] } // 'userId' variable holds the ID from token
                        : { $eq: [1, 0] }, // Nobody (guest or invalid role)
                  ],
                },
              },
            },
            { $limit: 1 },
          ],
          as: "likeData",
        },
      },

      // ✅ SHAPE RESPONSE
      {
        $project: {
          video: 1,
          videoType: 1,
          thumbnail: 1,
          thumbnailType: 1,
          duration: 1,
          productId: 1,
          sellerId: 1,
          like: 1,
          description: 1,
          createdAt: 1,
          isLike: { $gt: [{ $size: "$likeData" }, 0] },
        },
      },
    ]);

    // ✅ POPULATE ONLY REQUIRED FIELDS (FAST)
    const populatedReels = await Reel.populate(reels, [
      {
        path: "productId",
        select:
          "productName productCode price shippingCharges mainImage seller attributes description productSaleType auctionEndDate",
      },
      {
        path: "sellerId",
        select: "firstName lastName businessTag businessName image",
      },
    ]);

    // For pagination metadata, we need total count.
    // However, the original aggregation was optimized for speed without count.
    // To support pagination standard, we should ideally fetch count.
    // Given the complexity/priority logic, a simple countDocuments might be slightly inaccurate if priority influences filtering (it doesn't here, just sorting).
    // So we can use countDocuments with matchQuery.

    const totalReels = await Reel.countDocuments(matchQuery);

    return res.status(200).json({
      status: true,
      message: "Reels retrieved successfully",
      totalReels,
      totalPages: Math.ceil(totalReels / limit),
      currentPage: page,
      reels: populatedReels,
    });
  } catch (error) {
    console.error("getReelsForUser error:", error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error",
    });
  }
};



exports.likeOrDislikeOfReel = async (req, res) => {
  try {
    if (!req.user || !req.user.id || !req.query.reelId) {
      return res.status(200).json({
        status: false,
        message: get_message(1074),
      });
    }

    const id = new mongoose.Types.ObjectId(req.user.id);
    const role = req.user.role;
    const reelId = new mongoose.Types.ObjectId(req.query.reelId);

    let identity = null;
    let query = { reelId };

    if (role === 'user') {
      identity = await User.findById(id).select("_id isBlock");
      query.userId = id;
    } else if (role === 'seller') {
      identity = await Seller.findById(id).select("_id isBlock");
      query.sellerId = id;
    } else {
      return res.status(403).json({ status: false, message: "Invalid role for liking reels." });
    }

    if (!identity) {
      return res.status(404).json({ status: false, message: role === 'user' ? get_message(1019) : get_message(1013) });
    }

    if (identity.isBlock) {
      return res.status(403).json({ status: false, message: role === "user" ? get_message(1017) : get_message(1107) });
    }

    const reel = await Reel.findById(reelId);
    if (!reel) {
      return res.status(404).json({ status: false, message: get_message(1141) });
    }

    const alreadylikedReel = await LikeHistoryOfReel.findOne(query);

    if (alreadylikedReel) {
      await Promise.all([
        LikeHistoryOfReel.deleteOne(query),
        Reel.updateOne({ _id: reel._id, like: { $gt: 0 } }, { $inc: { like: -1 } })
      ]);

      return res.status(200).json({
        status: true,
        message: `finally, reel dislike done by the ${role}!`,
        isLike: false,
      });
    } else {
      const likeHistoryOfReel = new LikeHistoryOfReel(query);

      await Promise.all([
        likeHistoryOfReel.save(),
        reel.updateOne({ $inc: { like: 1 } })
      ]);

      return res.status(200).json({
        status: true,
        message: `finally, reel like done by the ${role}!`,
        isLike: true,
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// Upload fake reel by Admin
exports.uploadReelByAdmin = async (req, res) => {
  try {
    const { sellerId } = req.body;
    let { productIds } = req.body;

    if (typeof productIds === "string") {
      try {
        productIds = JSON.parse(productIds);
      } catch (e) {
        productIds = productIds.replace(/[\[\]\s]/g, "").split(",");
      }
    }

    if (!sellerId || !Array.isArray(productIds) || productIds.length === 0 || !req.files) {
      if (req.files) deleteFiles(req.files);
      return res.status(400).json({ status: false, message: get_message(1074) });
    }

    if (typeof productIds === "string") {
      try {
        productIds = JSON.parse(productIds);
      } catch (e) {
        productIds = productIds.replace(/[\[\]\s]/g, "").split(",");
      }
    }

    const [seller, validProducts] = await Promise.all([
      Seller.findOne({ _id: sellerId }),
      Product.find({
        _id: { $in: productIds },
        createStatus: "Approved",
      }),
    ]);

    if (!seller) {
      if (req.files) deleteFiles(req.files);
      return res.status(404).json({ status: false, message: get_message(1013) });
    }

    if (seller.isBlock) {
      if (req.files) deleteFiles(req.files);
      return res.status(403).json({ status: false, message: get_message(1107) });
    }

    if (!validProducts || validProducts.length === 0) {
      if (req.files) deleteFiles(req.files);
      return res.status(400).json({ status: false, message: get_message(1143) });
    }

    const reel = new Reel();

    reel.sellerId = seller._id;
    reel.productId = validProducts.map((p) => p._id);
    reel.duration = req?.body?.duration;
    reel.isFake = true;

    if (req?.files?.video) {
      const video = reel?.video?.split("storage");

      if (video) {
        if (fs.existsSync("storage" + video[1])) {
          fs.unlinkSync("storage" + video[1]);
        }
      }

      reel.videoType = 1;
      reel.video = "/storage/" + req.files.video[0].filename;
    } else {
      reel.videoType = 2;
      reel.video = req?.body?.video;
    }

    if (req?.files?.thumbnail) {
      const thumbnail = reel?.thumbnail?.split("storage");
      if (thumbnail) {
        if (fs.existsSync("storage" + thumbnail[1])) {
          fs.unlinkSync("storage" + thumbnail[1]);
        }
      }

      reel.thumbnailType = 1;
      reel.thumbnail = "/storage/" + req.files.thumbnail[0].filename;
    } else {
      reel.thumbnailType = 2;
      reel.thumbnail = req?.body?.thumbnail;
    }

    await reel.save();

    const data = await Reel.findById(reel._id).populate([
      { path: "sellerId", select: "firstName lastName businessTag businessName" },
      { path: "productId", select: "productName productCode price shippingCharges mainImage seller createStatus attributes" },
    ]);

    return res.status(200).json({
      status: true,
      message: "Reel has been uploaded by the seller!",
      reel: data,
    });
  } catch (error) {
    if (req.files) deleteFiles(req.files);
    console.log(error);
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server Error",
    });
  }
};

// Upload reel by the seller
exports.uploadReel = async (req, res) => {
  try {
    const { sellerId, duration, description, video, thumbnail } = req.body;
    let { productIds } = req.body;

    if (typeof productIds === "string") {
      try {
        productIds = JSON.parse(productIds);
      } catch (e) {
        productIds = productIds.replace(/[\[\]\s]/g, "").split(",");
      }
    }

    if (!sellerId || !Array.isArray(productIds) || productIds.length === 0 || !req.files) {
      if (req.files) deleteFiles(req.files);
      return res.status(400).json({ status: false, message: get_message(1074) });
    }

    const [seller, validProducts] = await Promise.all([
      Seller.findOne({ _id: sellerId, isFake: false }),
      Product.find({
        _id: { $in: productIds },
        createStatus: "Approved",
      }),
    ]);

    if (!seller) {
      if (req.files) deleteFiles(req.files);
      return res.status(404).json({ status: false, message: get_message(1013) });
    }

    if (seller.isBlock) {
      if (req.files) deleteFiles(req.files);
      return res.status(403).json({ status: false, message: get_message(1107) });
    }

    if (!validProducts || validProducts.length === 0) {
      if (req.files) deleteFiles(req.files);
      return res.status(400).json({ status: false, message: get_message(1143) });
    }

    const reel = new Reel();
    reel.sellerId = seller._id;
    reel.productId = validProducts.map((p) => p._id);
    reel.duration = duration || 0;
    reel.description = description || validProducts[0].description;

    if (req.files.video && req.files.video[0]) {
      const videoParts = reel?.video?.split("storage");
      if (videoParts && videoParts[1] && fs.existsSync("storage" + videoParts[1])) {
        fs.unlinkSync("storage" + videoParts[1]);
      }

      reel.videoType = 1;
      reel.video = "/storage/" + req.files.video[0].filename;
    } else {
      reel.videoType = 2;
      reel.video = video;
    }

    if (req.files.thumbnail && req.files.thumbnail[0]) {
      const thumbParts = reel?.thumbnail?.split("storage");
      if (thumbParts && thumbParts[1] && fs.existsSync("storage" + thumbParts[1])) {
        fs.unlinkSync("storage" + thumbParts[1]);
      }

      reel.thumbnailType = 1;
      reel.thumbnail = "/storage/" + req.files.thumbnail[0].filename;
    } else {
      reel.thumbnailType = 2;
      reel.thumbnail = thumbnail;
    }

    await reel.save();

    const data = await Reel.findById(reel._id).populate([
      { path: "sellerId", select: "firstName lastName businessTag businessName" },
      {
        path: "productId",
        select: "productName productCode price shippingCharges mainImage seller createStatus attributes",
      },
    ]);

    return res.status(200).json({
      status: true,
      message: "Reel uploaded successfully for multiple products!",
      reel: data,
    });
  } catch (error) {
    if (req.files) deleteFiles(req.files);
    console.error("uploadReel error:", error);
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server Error",
    });
  }
};

// Get particular seller's reels
exports.reelsOfSeller = async (req, res) => {
  try {
    if (!req.query.sellerId) {
      return res.status(400).json({ status: false, message: get_message(1074) });
    }

    const page = req.query.page ? parseInt(req.query.page) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;

    const [totalReels, reel] = await Promise.all([
      Reel.countDocuments({ sellerId: req.query.sellerId }),
      Reel.find({ sellerId: req.query.sellerId })
        .populate([
          { path: "sellerId", select: "firstName lastName businessTag businessName" },
          { path: "productId", select: "productName productCode price shippingCharges mainImage seller createStatus attributes description" },
        ])
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
    ]);

    if (!reel) {
      return res.status(404).json({ satus: false, message: get_message(1141) });
    }

    return res.status(200).json({
      status: true,
      message: "Retrive reels by the seller!",
      totalReels,
      totalPages: Math.ceil(totalReels / limit),
      currentPage: page,
      reels: reel,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

// Update fake reel by Admin
exports.updateReelByAdmin = async (req, res) => {
  try {
    if (!req.query.sellerId || req.query.sellerId === "undefined" || !mongoose.Types.ObjectId.isValid(req.query.sellerId) ||
      !req.query.reelId || req.query.reelId === "undefined" || !mongoose.Types.ObjectId.isValid(req.query.reelId)) {
      if (req.files) deleteFiles(req.files);
      return res.status(400).json({ status: false, message: get_message(1074) });
    }

    const reel = await Reel.findOne({ _id: req.query.reelId, sellerId: req.query.sellerId });
    if (!reel) {
      if (req.files) deleteFiles(req.files);
      return res.status(404).json({ satus: false, message: get_message(1141) });
    }

    if (req.body.productId) {
      const product = await Product.findOne({ _id: req.body.productId, createStatus: "Approved" });
      if (!product) {
        if (req.files) deleteFiles(req.files);
        return res.status(404).json({ status: false, message: get_message(1059) });
      }

      reel.productId = req.body.productId ? product._id : reel.productId;
    }

    if (req?.files?.video) {
      const video = reel?.video?.split("storage");
      if (video) {
        if (fs.existsSync("storage" + video[1])) {
          fs.unlinkSync("storage" + video[1]);
        }
      }

      reel.video = "/storage/" + req.files.video[0].filename;
    }

    if (req?.files?.thumbnail) {
      const thumbnail = reel?.thumbnail?.split("storage");
      if (thumbnail) {
        if (fs.existsSync("storage" + thumbnail[1])) {
          fs.unlinkSync("storage" + thumbnail[1]);
        }
      }

      reel.thumbnail = "/storage/" + req.files.thumbnail[0].filename;
    }

    if (Number(req?.body.videoType) === 2) {
      if (reel.videoType === 1) {
        const video = reel?.video?.split("storage");
        if (video) {
          if (fs.existsSync("storage" + video[1])) {
            fs.unlinkSync("storage" + video[1]);
          }
        }
      }

      reel.videoType = 2;
      reel.video = req?.body?.video;
    }

    if (Number(req?.body.thumbnailType) === 2) {
      if (reel.thumbnailType === 1) {
        const thumbnail = reel?.thumbnail?.split("storage");
        if (thumbnail) {
          if (fs.existsSync("storage" + thumbnail[1])) {
            fs.unlinkSync("storage" + thumbnail[1]);
          }
        }
      }

      reel.thumbnailType = 2;
      reel.thumbnail = req?.body?.thumbnail;
    }

    reel.duration = req.body.duration ? req.body.duration : reel.duration;
    await reel.save();

    const data = await Reel.findById(reel._id).populate([
      { path: "sellerId", select: "firstName lastName businessTag businessName" },
      { path: "productId", select: "productName productCode price shippingCharges mainImage seller createStatus attributes" },
    ]);

    return res.status(200).json({
      status: true,
      message: "Reel has been updated by the admin.",
      reel: data,
    });
  } catch (error) {
    if (req.files) deleteFiles(req.files);
    console.log(error);
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server Error",
    });
  }
};

// Get Fake Reels (Admin)
exports.getReels = async (req, res) => {
  try {
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;

    const [totalReels, reels] = await Promise.all([
      Reel.find({ isFake: true }).countDocuments(),
      Reel.find({ isFake: true })
        .populate([
          { path: "sellerId", select: "firstName lastName businessTag businessName" },
          { path: "productId", select: "productName productCode price shippingCharges mainImage seller createStatus attributes" },
        ])
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
    ]);

    return res.status(200).json({
      status: true,
      message: "Retrive the fake reels by the admin!",
      totalReels: totalReels,
      totalPages: Math.ceil(totalReels / limit),
      currentPage: page,
      reels: reels,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// Get Real Reels (User/Seller reels) for Admin
exports.getRealReels = async (req, res) => {
  try {
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;

    const [totalReels, reels] = await Promise.all([
      Reel.countDocuments({ isFake: false }),
      Reel.aggregate([
        { $match: { isFake: false } },
        {
          $lookup: {
            from: "sellers",
            localField: "sellerId",
            foreignField: "_id",
            as: "sellerId",
          },
        },
        { $unwind: { path: "$sellerId", preserveNullAndEmptyArrays: false } },
        {
          $lookup: {
            from: "products",
            localField: "productId",
            foreignField: "_id",
            as: "products",
          },
        },
        {
          $lookup: {
            from: "likehistoryofreels",
            localField: "_id",
            foreignField: "reelId",
            as: "totalLikes",
          },
        },
        {
          $addFields: {
            like: { $size: "$totalLikes" },
          },
        },
        {
          $project: {
            thumbnail: 1,
            video: 1,
            description: 1,
            thumbnailType: 1,
            videoType: 1,
            isFake: 1,
            like: 1,
            createdAt: 1,
            products: {
              _id: 1,
              productCode: 1,
              price: 1,
              shippingCharges: 1,
              createStatus: 1,
              attributes: 1,
              productName: 1,
              mainImage: 1,
              seller: 1,
            },
            "sellerId._id": 1,
            "sellerId.firstName": 1,
            "sellerId.lastName": 1,
            "sellerId.businessTag": 1,
            "sellerId.businessName": 1,
          },
        },
        { $sort: { createdAt: -1 } },
        { $skip: (page - 1) * limit },
        { $limit: limit },
      ]),
    ]);

    // Using totalReels as returned by countDocuments.
    // The aggregate pipeline actually returns one document with `totalReels` if we used $count, but here we used `countDocuments` separately.
    // Wait, the original code had `Reel.countDocuments({ isFake: false })` which returns a number.

    return res.status(200).json({
      status: true,
      message: "Retrieve the real reels by the admin!",
      totalReels,
      totalPages: Math.ceil(totalReels / limit),
      currentPage: page,
      reels,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// Get details of a specific reel
exports.detailsOfReel = async (req, res) => {
  try {
    if (!req.query.reelId) {
      return res.status(400).json({ status: false, message: get_message(1142) });
    }

    if (!mongoose.Types.ObjectId.isValid(req.query.reelId)) {
      return res.status(400).json({ status: false, message: get_message(1106) });
    }

    const reel = await Reel.findById(req.query.reelId)
      .populate([
        { path: "sellerId", select: "firstName lastName businessTag businessName image" },
        { path: "productId", select: "productName productCode price shippingCharges mainImage seller createStatus attributes" },
      ])
      .lean();

    if (!reel) {
      return res.status(404).json({ status: false, message: get_message(1141) });
    }

    return res.status(200).json({
      status: true,
      message: "Reel details retrieved successfully!",
      reel,
    });
  } catch (error) {
    console.error("detailsOfReel error:", error);
    return res.status(500).json({
      status: false,
      message: error instanceof Error ? error.message : "Internal Server Error",
    });
  }
};

// Get like history of a reel
exports.likeHistoryOfReel = async (req, res) => {
  try {
    if (!req.query.reelId) {
      return res.status(400).json({ status: false, message: get_message(1142) });
    }

    const [reel, likeHistoryOfReel] = await Promise.all([
      Reel.findOne({ _id: req?.query?.reelId }),
      LikeHistoryOfReel.find({ reelId: req?.query?.reelId })
        .populate("userId", "firstName lastName image")
        .populate("sellerId", "firstName lastName image"),
    ]);

    if (!reel) {
      return res.status(404).json({ status: false, message: get_message(1141) });
    }

    if (!likeHistoryOfReel) {
      return res.status(200).json({ satus: false, message: "likeHistoryOfReel does not found!" });
    }

    return res.status(200).json({ satus: true, message: "finally, get likeHistory of the particular reel.", likeHistoryOfReel: likeHistoryOfReel });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// Delete Reel
exports.deleteReel = async (req, res) => {
  try {
    if (!req.query.reelId || req.query.reelId === "undefined" || !mongoose.Types.ObjectId.isValid(req.query.reelId)) {
      return res.status(400).json({ status: false, message: get_message(1142) });
    }

    const reelId = new mongoose.Types.ObjectId(req.query.reelId);

    const reel = await Reel.findOne({ _id: reelId });
    if (!reel) {
      return res.status(404).json({ satus: false, message: get_message(1141) });
    }

    res.status(200).json({
      status: true,
      message: "Reel has been deleted!",
    });

    if (reel.video) {
      const video = reel?.video?.split("storage");
      if (video) {
        if (fs.existsSync("storage" + video[1])) {
          fs.unlinkSync("storage" + video[1]);
        }
      }
    }

    if (reel.thumbnail) {
      const thumbnail = reel?.thumbnail?.split("storage");
      if (thumbnail) {
        if (fs.existsSync("storage" + thumbnail[1])) {
          fs.unlinkSync("storage" + thumbnail[1]);
        }
      }
    }

    await Promise.all([LikeHistoryOfReel.deleteMany({ reelId: reelId }), ReportReel.deleteMany({ reelId: reelId })]);

    await reel.deleteOne();
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// Increment view count
exports.addView = async (req, res) => {
  try {
    const { reelId } = req.body;

    if (!reelId) {
      return res.status(400).json({ status: false, message: "Reel ID is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(reelId)) {
      return res.status(400).json({ status: false, message: "Invalid Reel ID" });
    }

    const reel = await Reel.findByIdAndUpdate(
      reelId,
      { $inc: { view: 1 } },
      { new: true }
    );

    if (!reel) {
      return res.status(404).json({ status: false, message: get_message(1141) });
    }

    return res.status(200).json({
      status: true,
      message: "Reel view count updated successfully",
      view: reel.view
    });

  } catch (error) {
    console.error("addView error:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};
