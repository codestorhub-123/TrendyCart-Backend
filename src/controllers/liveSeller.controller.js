const LiveSellingHistory = require("../models/liveSellingHistory.model");
const Follower = require("../models/follower.model");
const Admin = require("../models/admin.model");
const Product = require("../models/product.model");
const Seller = require("../models/seller.model");
const LiveSeller = require("../models/liveSeller.model");
const User = require("../models/user.model");
const mongoose = require("mongoose");
const moment = require("moment");
const axios = require("axios");
const sendLiveNotification = require("../../utils/sendLiveNotification");
const { get_message } = require("../../utils/message");

// Conditional import for firebase-admin to prevent crash if not installed
let admin;
try {
  admin = require("firebase-admin");
} catch (error) {
  console.warn("firebase-admin not found, notifications will not be sent.");
}

// Helper function from provided code
const liveSellerFunction = async (liveSeller, data) => {
  liveSeller.firstName = data.firstName;
  liveSeller.lastName = data.lastName;
  liveSeller.businessName = data.businessName;
  liveSeller.businessTag = data.businessTag;
  liveSeller.image = data.image;
  liveSeller.channel = data.channel;
  liveSeller.sellerId = data._id;

  await liveSeller.save();
  return liveSeller;
};

// Start logic for sellerGoLive
exports.sellerGoLive = async (req, res) => {
  try {
    const { sellerId, liveType, agoraUID = 0, productIds } = req.body;

    /* ===================== BASIC VALIDATION ===================== */
    if (!sellerId || !liveType) {
      return res.status(200).json({
        status: false,
        message: get_message(1074)
      });
    }

    const parsedLiveType = Number(liveType);

    /* ===================== LICENSE CHECK ===================== */
    if (parsedLiveType === 2) {
      const adminData = await Admin.findOne({}, { purchaseCode: 1 }).lean();

      if (!adminData?.purchaseCode) {
        return res.status(200).json({
          status: false,
          message: get_message(1108)
        });
      }

      const licenseData = await validatePurchaseCode(adminData.purchaseCode);

      if (!licenseData || !licenseData.license) {
        return res.status(200).json({
          status: false,
          message: get_message(1108)
        });
      }

      if (licenseData.license !== "Extended License") {
        return res.status(200).json({
          status: false,
          message: `Auction Live is restricted. Your license: "${licenseData.license}". Upgrade to Extended License.`
        });
      }
    }

    /* ===================== SELLER ===================== */
    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(200).json({
        status: false,
        message: get_message(1013)
      });
    }

    /* ===================== PRODUCT SELECTION ===================== */
    if (Array.isArray(productIds) && productIds.length > 0) {
      const productObjectIds = productIds.map(
        id => new mongoose.Types.ObjectId(id)
      );

      // Deselect all seller products
      await Product.updateMany(
        { seller: seller._id },
        { $set: { isSelect: false } }
      );

      // Select requested products
      const updateResult = await Product.updateMany(
        {
          _id: { $in: productObjectIds },
          seller: seller._id,
        },
        { $set: { isSelect: true } }
      );

      console.log("✅ Products selected:", updateResult.modifiedCount);
    }

    /* ===================== FETCH SELECTED PRODUCTS ===================== */
    const selectedProducts = await Product.find({
      seller: seller._id,
      isSelect: true
    });

    if (!selectedProducts.length) {
      return res.status(200).json({
        status: false,
        message: "selectedProducts must be a non-empty array."
      });
    }

    /* ===================== ATTRIBUTE VALIDATION ===================== */
    for (const product of selectedProducts) {
      if (
        !Array.isArray(product.attributes) ||
        product.attributes.some(
          attr =>
            typeof attr.key !== "string" ||
            !Array.isArray(attr.values) ||
            !attr.values.length
        )
      ) {
        return res.status(200).json({
          status: false,
          message:
            "Invalid productAttributes format. Each attribute must have key and values."
        });
      }
    }

    /* ===================== DELETE EXISTING LIVE ===================== */
    await LiveSeller.deleteMany({ sellerId: seller._id });

    /* ===================== HISTORY ===================== */
    const liveSellingHistory = new LiveSellingHistory({
      sellerId: seller._id,
      startTime: new Date().toLocaleTimeString("en-IN", {
        timeZone: "Asia/Kolkata"
      })
    });

    seller.isLive = true;
    seller.channel = liveSellingHistory._id.toString();
    seller.liveSellingHistoryId = liveSellingHistory._id;

    /* ===================== MAP PRODUCTS ===================== */
    const mappedProducts = selectedProducts.map(p => ({
      productId: p._id,
      productName: p.productName,
      mainImage: p.mainImage,
      price: p.price,
      productAttributes: p.attributes,
      minimumBidPrice: p.minimumBidPrice || p.price || 0,
      minAuctionTime: p.minAuctionTime || 60,
      status: "pending",
      winnerUserId: null,
      winningBid: 0
    }));

    /* ===================== UPDATE SELLER ===================== */
    seller.selectedProducts = selectedProducts.map(p => ({
      productId: p._id,
      productName: p.productName,
      mainImage: p.mainImage,
      price: p.price,
      productAttributes: p.attributes
    }));

    /* ===================== LIVE SELLER ===================== */
    const liveSeller = new LiveSeller({
      liveSellingHistoryId: liveSellingHistory._id,
      agoraUID,
      selectedProducts: mappedProducts,
      liveType: parsedLiveType
    });

    await liveSellerFunction(liveSeller, seller);

    await Promise.all([
      liveSellingHistory.save(),
      seller.save()
    ]);

    /* ===================== NOTIFICATIONS (SAFE) ===================== */
    const followerIds = await Follower.distinct("userId", {
      sellerId: seller._id
    });

    if (followerIds.length) {
      const users = await User.find({
        _id: { $in: followerIds },
        isBlock: false,
        isSeller: false,
        fcmToken: { $ne: null }
      }).select("fcmToken");

      const tokens = users.map(u => u.fcmToken).filter(Boolean);

      // fire-and-forget (never blocks API)
      sendLiveNotification({
        tokens,
        seller,
        liveSellingHistoryId: liveSellingHistory._id
      });
    }

    /* ===================== RESPONSE ===================== */
    return res.status(200).json({
      status: true,
      message: "Seller is live Successfully!",
      liveseller: liveSeller
    });

  } catch (error) {
    console.error("sellerGoLive error:", error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error"
    });
  }
};
exports.getSelectedProducts = async (req, res) => {
  try {
    if (!req.query.liveSellingHistoryId) {
      return res.status(400).json({ status: false, message: get_message(1127) });
    }

    const liveSellingHistory = await LiveSeller.findOne({ liveSellingHistoryId: req.query.liveSellingHistoryId }).select("firstName lastName businessName businessTag image selectedProducts").lean();
    if (!liveSellingHistory) {
      return res.status(404).json({ status: false, message: get_message(1109) });
    }

    return res.status(200).json({
      status: true,
      message: "Retrive selectedProducts for the user!",
      data: liveSellingHistory,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};
exports.liveSellerList = async (req, res) => {
  try {
    let userId = null;
    if (req.query.userId) {
      userId = new mongoose.Types.ObjectId(req.query.userId);
    }

    const start = parseInt(req.query.start) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const [fakeSellers, realSellers] = await Promise.all([
      Seller.aggregate([
        {
          $match: {
            isFake: true,
            isBlock: false,
            isLive: true,
          },
        },
        {
          $project: {
            _id: 1,
            image: 1,
            isLive: 1,
            firstName: 1,
            lastName: 1,
            businessTag: 1,
            businessName: 1,
            email: 1,
            mobileNumber: 1,
            isFake: 1,
            video: 1,
            selectedProducts: 1,
          },
        },
        {
          $addFields: {
            liveSellingHistoryId: null,
            view: {
              $floor: {
                $add: [
                  30,
                  {
                    $multiply: [{ $subtract: [100, 6] }, { $rand: {} }],
                  },
                ],
              },
            },
          },
        },
      ]),
      Seller.aggregate([
        {
          $match: {
            isFake: false,
            isBlock: false,
            isLive: true,
            ...(userId ? { userId: { $ne: userId } } : {}), // only apply if userId provided
          },
        },
        {
          $lookup: {
            from: "livesellers",
            let: { liveSellerId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$$liveSellerId", "$sellerId"] },
                },
              },
            ],
            as: "liveseller",
          },
        },
        { $unwind: { path: "$liveseller", preserveNullAndEmptyArrays: false } },
        {
          $project: {
            _id: 1,
            isLive: 1,
            firstName: 1,
            lastName: 1,
            businessTag: 1,
            businessName: 1,
            email: 1,
            mobileNumber: 1,
            isFake: 1,
            video: 1,
            image: 1,
            selectedProducts: "$liveseller.selectedProducts",
            liveSellingHistoryId: {
              $cond: [{ $eq: ["$isLive", true] }, "$liveseller.liveSellingHistoryId", null],
            },
            view: {
              $cond: [{ $eq: ["$isLive", true] }, "$liveseller.view", 0],
            },
          },
        },
      ]),
    ]);

    const combinedList = [...realSellers, ...fakeSellers];
    const total = combinedList.length;

    const paginatedList = combinedList.slice((start - 1) * limit, start * limit);

    return res.status(200).json({
      status: true,
      message: "Retrieve live seller list!",
      total,
      liveSeller: paginatedList,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server Error",
    });
  }
};

exports.retrieveProductList = async (req, res) => {
  try {
    if (!req.query.sellerId) {
      return res.status(400).json({ status: false, message: get_message(1074) });
    }

    const sellerId = new mongoose.Types.ObjectId(req.query.sellerId);

    const [seller, products] = await Promise.all([
      Seller.findOne({ _id: sellerId }),
      Product.find({
        seller: sellerId,
      })
        .select("productName mainImage")
        .sort({ createdAt: -1 }),
    ]);

    if (!seller) {
      return res.status(404).json({ status: false, message: get_message(1013) });
    }

    return res.status(200).json({
      status: true,
      message: "Retrive products or services for the seller.",
      data: products,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

exports.setSellerLiveWithProducts = async (req, res) => {
  try {
    const { productIds, sellerId } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0 || !sellerId) {
      return res.status(400).json({
        status: false,
        message: get_message(1074),
      });
    }

    const sellerObjectId = new mongoose.Types.ObjectId(sellerId);

    const [seller, updateProducts] = await Promise.all([Seller.findOne({ _id: sellerObjectId }), Product.updateMany({ seller: sellerObjectId }, { $set: { isSelect: false } })]);

    if (!seller) {
      return res.status(404).json({
        status: false,
        message: get_message(1013),
      });
    }

    const selectedProductsDetails = [];
    for (const productId of productIds) {
      const productObjectId = new mongoose.Types.ObjectId(productId);

      const selectedProduct = await Product.findOneAndUpdate({ _id: productObjectId, seller: sellerObjectId }, { $set: { isSelect: true } }, { new: true });

      if (selectedProduct) {
        selectedProductsDetails.push({
          productId: selectedProduct?._id,
          productName: selectedProduct?.productName,
          mainImage: selectedProduct?.mainImage,
          price: selectedProduct?.price,
          productAttributes: selectedProduct?.attributes,
        });
      }
    }

    if (selectedProductsDetails.length === 0) {
      return res.status(400).json({
        status: false,
        message: get_message(1074),
      });
    }

    seller.selectedProducts = selectedProductsDetails;
    seller.isLive = true;
    await seller.save();

    return res.status(200).json({
      status: true,
      message: "Products selected successfully, seller is now live.",
      data: seller,
    });
  } catch (error) {
    console.error("Error in selectProductsAndSetSellerLive API:", error);
    return res.status(500).json({ status: false, message: "Internal Server Error", error: error.message });
  }
};

exports.setSellerOfflineAndResetProducts = async (req, res) => {
  try {
    const { sellerId } = req.query;

    const sellerObjectId = new mongoose.Types.ObjectId(sellerId);

    const seller = await Seller.findOne({ _id: sellerObjectId });

    if (!seller) {
      return res.status(404).json({
        status: false,
        message: get_message(1013),
      });
    }

    seller.selectedProducts = [];
    seller.isLive = false;
    await seller.save();

    return res.status(200).json({
      status: true,
      message: "Seller live status stopped and products deselected successfully.",
      data: seller,
    });
  } catch (error) {
    console.error("Error in stopSellerLiveAndDeselectProducts API:", error);
    return res.status(500).json({
      status: false,
      message: "An error occurred while stopping seller live status.",
      error: error.message,
    });
  }
};

exports.retrieveLiveAnalytics = async (req, res) => {
  try {
    const { liveHistoryId } = req.query;

    if (!liveHistoryId) {
      return res.status(400).json({ status: false, message: get_message(1074) });
    }

    const liveHistoryObjectId = new mongoose.Types.ObjectId(liveHistoryId);

    const liveHistoryData = await LiveSellingHistory.findById(liveHistoryObjectId).populate("sellerId", "firstName lastName businessName businessTag image uniqueId").lean();

    if (!liveHistoryData) {
      return res.status(404).json({ status: false, message: get_message(1109) });
    }

    const response = {
      seller: {
        firstName: liveHistoryData.sellerId?.firstName || "",
        lastName: liveHistoryData.sellerId?.lastName || "",
        businessTag: liveHistoryData.sellerId?.businessTag || "",
        businessName: liveHistoryData.sellerId?.businessName || "",
        gender: liveHistoryData.sellerId?.gender || "",
        image: liveHistoryData.sellerId?.image || "",
        uniqueId: liveHistoryData.sellerId?.uniqueId || "",
      },
      totalUser: liveHistoryData.totalUser ?? 0,
      comment: liveHistoryData.comment ?? 0,
      startTime: liveHistoryData.startTime || "",
      endTime: liveHistoryData.endTime || "",
      duration: liveHistoryData.duration || "00:00:00",
    };

    return res.status(200).json({
      status: true,
      message: "Live metrics fetched successfully.",
      data: response,
    });
  } catch (error) {
    console.error("Error fetching live metrics:", error);
    return res.status(500).json({ status: false, message: "Internal server error.", error: error.message });
  }
};
