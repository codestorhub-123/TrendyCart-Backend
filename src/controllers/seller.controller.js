const Seller = require("../models/seller.model");
const SellerWallet = require("../models/sellerWallet.model");
const User = require("../models/user.model");
const Product = require("../models/product.model");
const Cart = require("../models/cart.model");
const Order = require("../models/order.model");
const Favorite = require("../models/favorite.model");
const Review = require("../models/review.model");
const Rating = require("../models/rating.model");
const ProductRequest = require("../models/productRequest.model");
const Reel = require("../models/reel.model");
const AuctionBid = require("../models/auctionBid.model");
const LikeHistoryOfReel = require("../models/likeHistoryOfReel.model");
const ReportReel = require("../models/reportoReel.model");
const WithdrawRequest = require("../models/withdrawRequest.model");
const fs = require("fs");
const fsPromises = require("fs").promises;
const path = require("path");
const { get_message } = require("../../utils/message");

const { deleteFile, deleteFiles } = require("../../utils/deleteFile");
const getApiBase = require("../../utils/getApiBase");
const config = { baseURL: getApiBase() };
const jwt = require("jsonwebtoken");

const Cryptr = require("cryptr");
const cryptr = new Cryptr("myTotallySecretKey");

// Helper to generate UniqueId (copied from user.controller.js)
const generateFastUniqueId = () => {
  return (
    Date.now().toString().slice(-7) +
    Math.floor(100 + Math.random() * 900)
  );
};

/**
 * Safe async file cleanup
 */
const safeDeleteFiles = async (files) => {
  try {
    if (!files) return;

    const allFiles = [];
    if (files.image) allFiles.push(...files.image);
    if (files.video) allFiles.push(...files.video);

    await Promise.all(
      allFiles.map((file) =>
        fsPromises.unlink(path.resolve(file.path)).catch(() => { })
      )
    );
  } catch (_) { }
};
// Get list of all real sellers
exports.getRealSeller = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);

    const sellers = await Seller.aggregate([
      { $match: { isFake: false } },

      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "seller",
          as: "products",
        },
      },

      {
        $lookup: {
          from: "orders",
          let: { sellerId: "$_id" },
          pipeline: [
            { $unwind: "$items" },
            { $match: { $expr: { $eq: ["$items.sellerId", "$$sellerId"] } } },
            { $count: "count" }
          ],
          as: "orders",
        },
      },

      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },

      {
        $unwind: { path: "$user", preserveNullAndEmptyArrays: true },
      },

      {
        $addFields: {
          totalProduct: { $size: "$products" },
          totalOrder: { $ifNull: [{ $arrayElemAt: ["$orders.count", 0] }, 0] },
        },
      },

      {
        $project: {
          firstName: 1,
          lastName: 1,
          businessTag: 1,
          businessName: 1,
          mobileNumber: 1,
          gender: 1,
          image: 1,
          email: 1,
          loginType: 1,
          identity: 1,
          uniqueId: 1,
          followers: 1,
          following: 1,
          isSeller: 1,
          isBlock: 1,
          isFake: 1,
          date: 1,
          fcmToken: 1,
          address: 1,
          bankDetails: 1,
          totalProduct: 1,
          totalOrder: 1,
        },
      },

      { $sort: { createdAt: -1 } },

      {
        $facet: {
          totalSellers: [{ $count: "count" }],
          sellers: [
            { $skip: (page - 1) * limit },
            { $limit: limit },
          ],
        },
      },
    ]);

    const result = sellers[0];
    const totalSellers = result?.totalSellers[0]?.count || 0;

    return res.status(200).json({
      status: true,
      message: "Retrieve seller successfully!",
      totalSellers: totalSellers,
      totalPages: Math.ceil(totalSellers / limit),
      currentPage: page,
      sellers: result?.sellers || [],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error",
    });
  }
};


exports.getProfileByAdmin = async (req, res) => {
  try {
    const { sellerId } = req.query;

    if (!sellerId || sellerId === "undefined" || !require('mongoose').Types.ObjectId.isValid(sellerId)) {
      return res.status(400).json({
        status: false,
        message: get_message(1074),
      });
    }

    const [seller, totalProduct, totalOrder] = await Promise.all([
      Seller.findById(sellerId).select(
        "firstName lastName businessTag businessName email mobileNumber image address bankDetails isBlock isFake createdAt followers following userId"
      ).lean(),
      Product.countDocuments({ seller: sellerId, isDeleted: { $ne: true } }),
      Order.countDocuments({ "items.sellerId": sellerId })
    ]);

    if (!seller) {
      return res.status(404).json({
        status: false,
        message: get_message(1013),
      });
    }

    seller.totalProduct = totalProduct;
    seller.totalOrder = totalOrder;

    // Handle corrupted address string
    if (seller.address && seller.address.address === "[object Object]") {
      seller.address.address = "";
    }

    return res.status(200).json({
      status: true,
      message: "Seller profile retrieved successfully",
      seller,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error",
    });
  }
};


exports.updateProfile = async (req, res) => {
  try {
    const { sellerId } = req.query;

    if (!sellerId || sellerId === "undefined" || !require('mongoose').Types.ObjectId.isValid(sellerId)) {
      if (req.files) deleteFile(req.files);
      return res.status(400).json({
        status: false,
        message: get_message(1074),
      });
    }

    const seller = await Seller.findOne({ _id: sellerId, isFake: false });

    if (!seller) {
      if (req.files) deleteFile(req.files);
      return res.status(404).json({
        status: false,
        message: get_message(1013),
      });
    }

    if (seller.isBlock) {
      return res.status(403).json({
        status: false,
        message: "You are blocked by admin",
      });
    }

    // Ensure nested objects exist
    seller.address = seller.address || {};
    seller.bankDetails = seller.bankDetails || {};

    // Basic fields
    if (req.body.fcmToken && req.body.fcmToken !== "string") seller.fcmToken = req.body.fcmToken;
    if (req.body.firstName && req.body.firstName !== "string") seller.firstName = req.body.firstName;
    if (req.body.lastName && req.body.lastName !== "string") seller.lastName = req.body.lastName;
    if (req.body.businessTag && req.body.businessTag !== "string") seller.businessTag = req.body.businessTag;
    if (req.body.businessName && req.body.businessName !== "string") seller.businessName = req.body.businessName;
    if (req.body.dob && req.body.dob !== "string") seller.dob = req.body.dob;
    if (req.body.gender && req.body.gender !== "string") seller.gender = req.body.gender;
    if (req.body.mobileNumber && req.body.mobileNumber !== "string") seller.mobileNumber = req.body.mobileNumber;

    // Address
    if (req.body.address && typeof req.body.address === 'object') {
      const { address, landMark, city, pinCode, state, country } = req.body.address;
      if (address && address !== "string") seller.address.address = address;
      if (landMark && landMark !== "string") seller.address.landMark = landMark;
      if (city && city !== "string") seller.address.city = city;
      if (pinCode && pinCode !== "string") seller.address.pinCode = pinCode;
      if (state && state !== "string") seller.address.state = state;
      if (country && country !== "string") seller.address.country = country;
    } else {
      if (req.body.address && req.body.address !== "string") seller.address.address = req.body.address;
      if (req.body.landMark && req.body.landMark !== "string") seller.address.landMark = req.body.landMark;
      if (req.body.city && req.body.city !== "string") seller.address.city = req.body.city;
      if (req.body.pinCode && req.body.pinCode !== "string") seller.address.pinCode = req.body.pinCode;
      if (req.body.state && req.body.state !== "string") seller.address.state = req.body.state;
      if (req.body.country && req.body.country !== "string") seller.address.country = req.body.country;
    }

    // Bank details
    if (req.body.bankDetails && typeof req.body.bankDetails === 'object') {
      const { bankBusinessName, bankName, accountNumber, IFSCCode, branchName } = req.body.bankDetails;
      if (bankBusinessName && bankBusinessName !== "string") seller.bankDetails.bankBusinessName = bankBusinessName;
      if (bankName && bankName !== "string") seller.bankDetails.bankName = bankName;
      if (accountNumber && !isNaN(accountNumber) && accountNumber !== "string" && accountNumber !== 0) seller.bankDetails.accountNumber = Number(accountNumber);
      if (IFSCCode && IFSCCode !== "string") seller.bankDetails.IFSCCode = IFSCCode;
      if (branchName && branchName !== "string") seller.bankDetails.branchName = branchName;
    } else {
      if (req.body.bankBusinessName && req.body.bankBusinessName !== "string") seller.bankDetails.bankBusinessName = req.body.bankBusinessName;
      if (req.body.bankName && req.body.bankName !== "string") seller.bankDetails.bankName = req.body.bankName;
      if (req.body.accountNumber && !isNaN(req.body.accountNumber) && req.body.accountNumber !== "string" && Number(req.body.accountNumber) !== 0) {
        seller.bankDetails.accountNumber = Number(req.body.accountNumber);
      }
      if (req.body.IFSCCode && req.body.IFSCCode !== "string") seller.bankDetails.IFSCCode = req.body.IFSCCode;
      if (req.body.branchName && req.body.branchName !== "string") seller.bankDetails.branchName = req.body.branchName;
    }

    // Image upload
    if (req.files?.image?.length) {
      const imageParts = seller.image?.split("storage");
      if (imageParts?.[1] && fs.existsSync("storage" + imageParts[1])) {
        fs.unlinkSync("storage" + imageParts[1]);
      }
      seller.image = "/storage/" + req.files.image[0].filename;
    }

    await seller.save();

    // Return SAFE fields only
    const updatedSeller = await Seller.findById(seller._id).select(
      "firstName lastName businessTag businessName email mobileNumber image address bankDetails"
    );

    return res.status(200).json({
      status: true,
      message: "Seller updated successfully",
      seller: updatedSeller,
    });
  } catch (error) {
    if (req.files) deleteFile(req.files);
    console.error(error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error",
    });
  }
};


exports.blockUnblock = async (req, res) => {
  try {
    const { sellerId } = req.query;

    if (!sellerId || sellerId === "undefined" || !require('mongoose').Types.ObjectId.isValid(sellerId)) {
      return res.status(400).json({
        status: false,
        message: get_message(1074),
      });
    }

    const seller = await Seller.findById(sellerId);

    if (!seller) {
      return res.status(404).json({
        status: false,
        message: get_message(1013),
      });
    }

    seller.isBlock = !seller.isBlock;
    seller.blockedAt = seller.isBlock ? new Date() : null;
    await seller.save();

    return res.status(200).json({
      status: true,
      message: seller.isBlock ? "Seller blocked successfully" : "Seller unblocked successfully",
      seller: {
        _id: seller._id,
        isBlock: seller.isBlock,
        blockedAt: seller.blockedAt,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error",
    });
  }
};


// Get top sellers for the dashboard
exports.topSellers = async (req, res) => {
  try {
    const topSellers = await Seller.aggregate([
      { $match: { isBlock: false, isFake: false } },

      {
        $lookup: {
          from: "products",
          let: { sellerId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$seller", "$$sellerId"] } } },
            {
              $group: {
                _id: null,
                totalProduct: { $sum: 1 },
                totalProductsSold: {
                  $sum: { $ifNull: ["$sold", 0] }
                }
              }
            }
          ],
          as: "stats"
        }
      },

      {
        $addFields: {
          totalProduct: { $ifNull: [{ $arrayElemAt: ["$stats.totalProduct", 0] }, 0] },
          totalProductsSold: { $ifNull: [{ $arrayElemAt: ["$stats.totalProductsSold", 0] }, 0] }
        }
      },

      { $match: { totalProductsSold: { $gt: 0 } } },

      {
        $sort: {
          totalProductsSold: -1,
          totalProduct: -1
        }
      },

      { $limit: 10 },

      {
        $project: {
          firstName: 1,
          lastName: 1,
          businessName: 1,
          businessTag: 1,
          email: 1,
          mobileNumber: 1,
          image: 1,
          totalProduct: 1,
          totalProductsSold: 1
        }
      }
    ]);

    return res.status(200).json({
      status: true,
      message: "Top sellers fetched successfully!",
      topSellers
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
};


// Get seller wallet information

exports.sellerWallet = async (req, res) => {
  try {
    const { sellerId } = req.query;

    if (!sellerId || sellerId === "undefined" || !require('mongoose').Types.ObjectId.isValid(sellerId)) {
      return res.status(400).json({
        status: false,
        message: get_message(1074),
      });
    }

    // 1️⃣ Check seller
    const seller = await Seller.findById(sellerId).select(
      "firstName lastName businessTag businessName email mobileNumber isBlock"
    );

    if (!seller) {
      return res.status(404).json({
        status: false,
        message: get_message(1013),
      });
    }

    if (seller.isBlock) {
      return res.status(403).json({
        status: false,
        message: get_message(1017),
      });
    }

    // 2️⃣ Aggregate wallet data
    const walletSummary = await SellerWallet.aggregate([
      {
        $match: { sellerId: seller._id },
      },
      {
        $group: {
          _id: "$sellerId",
          totalCredit: {
            $sum: {
              $cond: [{ $eq: ["$transactionType", 1] }, "$amount", 0],
            },
          },
          totalDebit: {
            $sum: {
              $cond: [{ $eq: ["$transactionType", 2] }, "$amount", 0],
            },
          },
        },
      },
    ]);

    const totalCredit = walletSummary[0]?.totalCredit || 0;
    const totalDebit = walletSummary[0]?.totalDebit || 0;
    const walletBalance = totalCredit - totalDebit;

    // 3️⃣ Fetch wallet transactions
    const transactions = await SellerWallet.find({ sellerId })
      .sort({ createdAt: -1 })
      .limit(20)
      .select(
        "orderId productId amount transactionType commissionPerProductQuantity shippingCharges createdAt"
      );

    return res.status(200).json({
      status: true,
      message: "Seller wallet retrieved successfully",
      seller,
      wallet: {
        balance: walletBalance,
        totalCredit,
        totalDebit,
      },
      transactions,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// Create a fake seller
exports.createFakeSeller = async (req, res) => {
  console.time("createFakeSeller");

  try {
    const { firstName, mobileNumber } = req.body;

    // Validation (same behavior)
    if (!firstName || !mobileNumber) {
      if (req.files) await safeDeleteFiles(req.files);
      return res.status(200).json({
        status: false,
        message: get_message(1074),
      });
    }

    // Create seller
    const seller = new Seller({
      firstName: firstName.trim(),
      lastName: req.body.lastName?.trim() || "",
      businessName: req.body.businessName || "",
      businessTag: req.body.businessTag || "",
      mobileNumber: mobileNumber.toString(),
      gender: req.body.gender || "male",
      email: req.body.email || "",

      isFake: true,
      isSeller: true,
      isBlock: false,

      uniqueId: generateFastUniqueId(),
      date: new Date().toLocaleString("en-US", {
        timeZone: "Asia/Kolkata",
      }),

      address: {
        address: (req.body.address && typeof req.body.address === 'object') ? req.body.address.address : (req.body.address || null),
        landMark: (req.body.address && typeof req.body.address === 'object') ? req.body.address.landMark : (req.body.landMark || null),
        city: (req.body.address && typeof req.body.address === 'object') ? req.body.address.city : (req.body.city || null),
        state: (req.body.address && typeof req.body.address === 'object') ? req.body.address.state : (req.body.state || null),
        country: (req.body.address && typeof req.body.address === 'object') ? req.body.address.country : (req.body.country || null),
        pinCode: (req.body.address && typeof req.body.address === 'object') ? req.body.address.pinCode : (req.body.pinCode || null),
      },

      bankDetails: {
        bankBusinessName: (req.body.bankDetails && typeof req.body.bankDetails === 'object') ? req.body.bankDetails.bankBusinessName : (req.body.bankBusinessName || null),
        bankName: (req.body.bankDetails && typeof req.body.bankDetails === 'object') ? req.body.bankDetails.bankName : (req.body.bankName || null),
        accountNumber: (req.body.bankDetails && typeof req.body.bankDetails === 'object') ? req.body.bankDetails.accountNumber : (req.body.accountNumber || null),
        IFSCCode: (req.body.bankDetails && typeof req.body.bankDetails === 'object') ? req.body.bankDetails.IFSCCode : (req.body.IFSCCode || null),
        branchName: (req.body.bankDetails && typeof req.body.bankDetails === 'object') ? req.body.bankDetails.branchName : (req.body.branchName || null),
      },
    });

    // Image upload (non-blocking)
    if (req.files?.image?.length) {
      seller.image = "/storage/" + req.files.image[0].filename;
    }

    // Video upload (non-blocking)
    if (req.files?.video?.length) {
      seller.video = "/storage/" + req.files.video[0].filename;
    }

    // Save seller (single DB call)
    await seller.save();

    console.timeEnd("createFakeSeller");

    // ❌ NO extra DB query
    // ❌ NO password decrypt
    // ✅ SAME response structure

    return res.status(200).json({
      status: true,
      message: "finally, fakeSeller added by the admin!",
      sellerData: seller, // 🔴 EXACT SAME RESPONSE SHAPE
    });
  } catch (error) {
    if (req.files) await safeDeleteFiles(req.files);

    console.error(error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error",
    });
  }
};
exports.updateFakeSellerProfile = async (req, res) => {
  try {
    if (!req.query.sellerId || req.query.sellerId === "undefined" || !require('mongoose').Types.ObjectId.isValid(req.query.sellerId)) {
      if (req.files) await safeDeleteFiles(req.files);
      return res.status(200).json({
        status: false,
        message: get_message(1074),
      });
    }

    const seller = await Seller.findById(req.query.sellerId);

    if (!seller) {
      if (req.files) await safeDeleteFiles(req.files);
      return res.status(200).json({
        status: false,
        message: get_message(1013),
      });
    }

    if (seller.isBlock) {
      return res.status(200).json({
        status: false,
        message: get_message(1017),
      });
    }

    // Update fields
    seller.firstName = req.body.firstName ?? seller.firstName;
    seller.lastName = req.body.lastName ?? seller.lastName;
    seller.businessTag = req.body.businessTag ?? seller.businessTag;
    seller.businessName = req.body.businessName ?? seller.businessName;
    seller.gender = req.body.gender ?? seller.gender;
    seller.mobileNumber = req.body.mobileNumber ?? seller.mobileNumber;

    // Ensure nested objects exist
    seller.address = seller.address || {};
    seller.bankDetails = seller.bankDetails || {};

    // Address Update
    if (req.body.address && typeof req.body.address === 'object') {
      seller.address.address = req.body.address.address ?? seller.address.address;
      seller.address.landMark = req.body.address.landMark ?? seller.address.landMark;
      seller.address.city = req.body.address.city ?? seller.address.city;
      seller.address.pinCode = req.body.address.pinCode ?? seller.address.pinCode;
      seller.address.state = req.body.address.state ?? seller.address.state;
      seller.address.country = req.body.address.country ?? seller.address.country;
    } else {
      seller.address.address = req.body.address ?? seller.address.address;
      seller.address.landMark = req.body.landMark ?? seller.address.landMark;
      seller.address.city = req.body.city ?? seller.address.city;
      seller.address.pinCode = req.body.pinCode ?? seller.address.pinCode;
      seller.address.state = req.body.state ?? seller.address.state;
      seller.address.country = req.body.country ?? seller.address.country;
    }

    // Bank Details Update
    if (req.body.bankDetails && typeof req.body.bankDetails === 'object') {
      seller.bankDetails.bankBusinessName = req.body.bankDetails.bankBusinessName ?? seller.bankDetails.bankBusinessName;
      seller.bankDetails.bankName = req.body.bankDetails.bankName ?? seller.bankDetails.bankName;
      seller.bankDetails.accountNumber = req.body.bankDetails.accountNumber ?? seller.bankDetails.accountNumber;
      seller.bankDetails.IFSCCode = req.body.bankDetails.IFSCCode ?? seller.bankDetails.IFSCCode;
      seller.bankDetails.branchName = req.body.bankDetails.branchName ?? seller.bankDetails.branchName;
    } else {
      seller.bankDetails.bankBusinessName = req.body.bankBusinessName ?? seller.bankDetails.bankBusinessName;
      seller.bankDetails.bankName = req.body.bankName ?? seller.bankDetails.bankName;
      seller.bankDetails.accountNumber = req.body.accountNumber ?? seller.bankDetails.accountNumber;
      seller.bankDetails.IFSCCode = req.body.IFSCCode ?? seller.bankDetails.IFSCCode;
      seller.bankDetails.branchName = req.body.branchName ?? seller.bankDetails.branchName;
    }

    // Image update (NON-BLOCKING)
    if (req.files?.image?.length) {
      if (seller.image?.includes("storage")) {
        const oldImage = seller.image.split("storage/")[1];
        if (oldImage) {
          fsPromises.unlink(path.resolve("storage", oldImage)).catch(() => { });
        }
      }

      seller.image = "/storage/" + req.files.image[0].filename;
    }

    // Video update (NON-BLOCKING)
    if (req.files?.video?.length) {
      if (seller.video?.includes("storage")) {
        const oldVideo = seller.video.split("storage/")[1];
        if (oldVideo) {
          fsPromises.unlink(path.resolve("storage", oldVideo)).catch(() => { });
        }
      }

      seller.video = "/storage/" + req.files.video[0].filename;
    }

    // Save once
    await seller.save();

    // ❌ NO extra DB call
    // ❌ NO password decryption

    return res.status(200).json({
      status: true,
      message: "Fake Seller updated Successfully!",
      seller: seller, // 🔴 SAME response shape
    });
  } catch (error) {
    if (req.files) await safeDeleteFiles(req.files);
    console.error(error);
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server Error",
    });
  }
};
//fakeSeller is live or not handled for admin
exports.liveOrNot = async (req, res) => {
  try {
    if (!req.query.sellerId || req.query.sellerId === "undefined" || !require('mongoose').Types.ObjectId.isValid(req.query.sellerId)) {
      return res.status(400).json({ status: false, message: get_message(1074) });
    }

    const seller = await Seller.findById(req.query.sellerId);
    if (!seller) {
      return res.status(404).json({ status: false, message: get_message(1013) });
    }

    seller.isLive = !seller.isLive;
    await seller.save();

    return res.status(200).json({
      status: true,
      message: "Success",
      seller,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server Error",
    });
  }
};

// Get all fake sellers for admin (FAST & SAFE)
exports.getFakeSeller = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);

    const filter = { isFake: true, isBlock: false, isDeleted: { $ne: true } };

    const [totalSellers, sellers] = await Promise.all([
      Seller.countDocuments(filter),
      Seller.find(filter)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(), // 🚀 faster
    ]);

    return res.status(200).json({
      status: true,
      message: "Fake sellers retrieved successfully",
      totalSellers,
      totalPages: Math.ceil(totalSellers / limit),
      currentPage: page,
      sellers,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error",
    });
  }
};


//get all fake sellers when reel or product create by the admin (dropdown)
exports.fakeSellers = async (req, res) => {
  try {
    const seller = await Seller.find({ isFake: true, isBlock: false }).select("firstName lastName").sort({ createdAt: -1 });
    if (!seller) {
      return res.status(404).json({ status: false, message: get_message(1013) });
    }

    return res.status(200).json({
      status: true,
      message: "finally, get all fake sellers by admin!",
      seller: seller,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

// Seller Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ status: false, message: "Email and password are required." });
    }

    const seller = await Seller.findOne({ email: email, isFake: false });
    if (!seller) {
      return res.status(404).json({ status: false, message: "Seller not found." });
    }

    if (seller.isBlock) {
      return res.status(403).json({ status: false, message: "You are blocked by admin." });
    }

    let isPasswordMatch = false;
    try {
      if (seller.password) {
        isPasswordMatch = cryptr.decrypt(seller.password) === password;
      }
    } catch (e) {
      isPasswordMatch = seller.password === password;
    }

    if (!isPasswordMatch) {
      return res.status(400).json({ status: false, message: "Invalid password." });
    }

    const token = jwt.sign({ id: seller._id, role: "seller" }, process.env.JWT_SECRET);

    return res.status(200).json({
      status: true,
      message: "Login successful.",
      seller,
      token,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

// Get Logged-in Seller Profile
exports.getProfile = async (req, res) => {
  try {
    const seller = await Seller.findById(req.user.id);
    if (!seller) {
      return res.status(404).json({ status: false, message: "Seller not found." });
    }
    return res.status(200).json({ status: true, message: "Profile retrieved.", seller });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

// Get Public Seller Profile
exports.fetchSellerProfile = async (req, res) => {
  try {
    const { sellerId } = req.query;
    if (!sellerId) return res.status(400).json({ status: false, message: "Seller ID is required." });

    const seller = await Seller.findById(sellerId).select("-password -fcmToken -__v");
    if (!seller) {
      return res.status(404).json({ status: false, message: "Seller not found." });
    }

    return res.status(200).json({ status: true, message: "Public profile retrieved.", seller });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

// Update Seller Profile
exports.update = async (req, res) => {
  try {
    const seller = await Seller.findById(req.user.id);
    if (!seller) return res.status(404).json({ status: false, message: "Seller not found." });

    req.body = req.body || {};

    // Update fields
    if (req.body.firstName && req.body.firstName !== "string") seller.firstName = req.body.firstName;
    if (req.body.lastName && req.body.lastName !== "string") seller.lastName = req.body.lastName;
    if (req.body.businessName && req.body.businessName !== "string") seller.businessName = req.body.businessName;
    if (req.body.businessTag && req.body.businessTag !== "string") seller.businessTag = req.body.businessTag;
    if (req.body.mobileNumber && req.body.mobileNumber !== "string") seller.mobileNumber = req.body.mobileNumber;
    if (req.body.email && req.body.email !== "string") seller.email = req.body.email;
    if (req.body.gender && req.body.gender !== "string") seller.gender = req.body.gender;
    if (req.body.dob && req.body.dob !== "string") seller.dob = req.body.dob;

    // Ensure nested objects exist
    seller.address = seller.address || {};
    seller.bankDetails = seller.bankDetails || {};

    // Address
    if (req.body.address && req.body.address !== "string") seller.address.address = req.body.address;
    if (req.body.city && req.body.city !== "string") seller.address.city = req.body.city;
    if (req.body.state && req.body.state !== "string") seller.address.state = req.body.state;
    if (req.body.country && req.body.country !== "string") seller.address.country = req.body.country;
    if (req.body.pinCode && req.body.pinCode !== "string") seller.address.pinCode = req.body.pinCode;
    if (req.body.landMark && req.body.landMark !== "string") seller.address.landMark = req.body.landMark;

    // Bank Details
    if (req.body.bankName && req.body.bankName !== "string") seller.bankDetails.bankName = req.body.bankName;
    if (req.body.accountNumber && !isNaN(req.body.accountNumber) && req.body.accountNumber !== "string" && Number(req.body.accountNumber) !== 0) {
      seller.bankDetails.accountNumber = Number(req.body.accountNumber);
    }
    if (req.body.IFSCCode && req.body.IFSCCode !== "string") seller.bankDetails.IFSCCode = req.body.IFSCCode;
    if (req.body.branchName && req.body.branchName !== "string") seller.bankDetails.branchName = req.body.branchName;
    if (req.body.bankBusinessName && req.body.bankBusinessName !== "string") seller.bankDetails.bankBusinessName = req.body.bankBusinessName;


    if (req.files?.image?.length) {
      if (seller.image && seller.image.includes("storage")) {
        const oldImage = seller.image.split("storage")[1];
        if (oldImage && fs.existsSync("storage" + oldImage)) fs.unlinkSync("storage" + oldImage);
      }
      seller.image = "/storage/" + req.files.image[0].filename;
    }

    await seller.save();
    return res.status(200).json({ status: true, message: "Profile updated.", seller });
  } catch (error) {
    if (req.files) deleteFiles(req.files);
    console.error(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

// Update Seller Password
exports.updatePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) return res.status(400).json({ status: false, message: "Old and new passwords are required." });

    const seller = await Seller.findById(req.user.id);
    if (!seller) return res.status(404).json({ status: false, message: "Seller not found." });

    let isMatch = false;
    try {
      isMatch = cryptr.decrypt(seller.password) === oldPassword;
    } catch (e) {
      isMatch = seller.password === oldPassword;
    }

    if (!isMatch) return res.status(400).json({ status: false, message: "Old password does not match." });

    seller.password = cryptr.encrypt(newPassword);
    await seller.save();

    return res.status(200).json({ status: true, message: "Password updated successfully." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

// Set Seller Password
exports.setPassword = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ status: false, message: "Password is required." });

    const seller = await Seller.findById(req.user.id);
    if (!seller) return res.status(404).json({ status: false, message: "Seller not found." });

    seller.password = cryptr.encrypt(password);
    await seller.save();

    return res.status(200).json({ status: true, message: "Password set successfully." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};


//delete fake seller for admin
exports.deleteSeller = async (req, res) => {
  try {
    if (!req.query.sellerId || req.query.sellerId === "undefined" || !require('mongoose').Types.ObjectId.isValid(req.query.sellerId)) {
      return res.status(400).json({ status: false, message: get_message(1074) });
    }

    const seller = await Seller.findOne({ _id: req.query.sellerId, isFake: true });
    if (!seller) {
      return res.status(404).json({ status: false, message: get_message(1013) });
    }

    // Delete seller image and video
    if (seller?.image) {
      const image = seller?.image?.split("storage");
      if (image && image[1]) {
        if (fs.existsSync("storage" + image[1])) {
          fs.unlinkSync("storage" + image[1]);
        }
      }
    }

    if (seller?.video) {
      const video = seller?.video?.split("storage");
      if (video && video[1]) {
        if (fs.existsSync("storage" + video[1])) {
          fs.unlinkSync("storage" + video[1]);
        }
      }
    }

    const products = await Product.find({ seller: seller._id });

    if (products.length > 0) {
      for (const product of products) {
        // Delete product images
        if (product.mainImage) {
          const mainImage = product?.mainImage?.split("storage");
          if (mainImage && mainImage[1]) {
            if (fs.existsSync("storage" + mainImage[1])) {
              fs.unlinkSync("storage" + mainImage[1]);
            }
          }
        }

        if (product.images && product.images.length > 0) {
          for (const imgPath of product.images) {
            const images = imgPath?.split("storage");
            if (images && images[1]) {
              if (fs.existsSync("storage" + images[1])) {
                fs.unlinkSync("storage" + images[1]);
              }
            }
          }
        }

        // Cleanup associated data
        const [productRequests, reels] = await Promise.all([
          ProductRequest.find({ productCode: product?.productCode }),
          Reel.find({ productId: product?._id }),
          Cart.deleteMany({ "items.productId": product?._id }),
          Order.deleteMany({ "items.productId": product?._id }),
          Favorite.deleteMany({ productId: product?._id }),
          Review.deleteMany({ productId: product?._id }),
          Rating.deleteMany({ productId: product?._id }),
          AuctionBid.deleteMany({ productId: product?._id }),
          SellerWallet.deleteMany({ productId: product?._id }),
        ]);

        // Cleanup product requests
        if (productRequests.length > 0) {
          for (const pReq of productRequests) {
            if (pReq.mainImage) {
              const image = pReq?.mainImage?.split("storage");
              if (image && image[1]) {
                if (fs.existsSync("storage" + image[1])) {
                  fs.unlinkSync("storage" + image[1]);
                }
              }
            }
            if (pReq.images && pReq.images.length > 0) {
              for (const imgPath of pReq.images) {
                const images = imgPath?.split("storage");
                if (images && images[1]) {
                  if (fs.existsSync("storage" + images[1])) {
                    fs.unlinkSync("storage" + images[1]);
                  }
                }
              }
            }
            await pReq.deleteOne();
          }
        }

        // Cleanup reels
        if (reels.length > 0) {
          for (const reel of reels) {
            if (reel.video) {
              const video = reel?.video?.split("storage");
              if (video && video[1]) {
                if (fs.existsSync("storage" + video[1])) {
                  fs.unlinkSync("storage" + video[1]);
                }
              }
            }
            if (reel.thumbnail) {
              const thumbnail = reel?.thumbnail?.split("storage");
              if (thumbnail && thumbnail[1]) {
                if (fs.existsSync("storage" + thumbnail[1])) {
                  fs.unlinkSync("storage" + thumbnail[1]);
                }
              }
            }
            await Promise.all([
              LikeHistoryOfReel.deleteMany({ reelId: reel?._id }),
              ReportReel.deleteMany({ reelId: reel?._id })
            ]);
            await reel.deleteOne();
          }
        }

        await product.deleteOne();
      }
    }

    await Promise.all([
      WithdrawRequest.deleteMany({ sellerId: seller?._id }),
      SellerWallet.deleteMany({ sellerId: seller?._id })
    ]);
    await seller.deleteOne();

    return res.status(200).json({
      status: true,
      message: "FakeSeller has been deleted!",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error",
    });
  }
};