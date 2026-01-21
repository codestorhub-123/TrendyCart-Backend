const mongoose = require("mongoose");
const fs = require("fs");
const moment = require("moment");

// Models
const Product = require("../models/product.model");
const Category = require("../models/category.model");
const SubCategory = require("../models/subCategory.model");
const Attributes = require("../models/attributes.model");
const User = require("../models/user.model");
const Rating = require("../models/rating.model");
const Seller = require("../models/seller.model");
const Favorite = require("../models/favorite.model");
const Follower = require("../models/follower.model");
const AuctionBid = require("../models/auctionBid.model");
const Cart = require("../models/cart.model");
const Order = require("../models/order.model");
const Review = require("../models/review.model");
const ProductRequest = require("../models/productRequest.model");
const Reel = require("../models/reel.model");
const SellerWallet = require("../models/sellerWallet.model");
const LikeHistoryOfReel = require("../models/likeHistoryOfReel.model");
const ReportReel = require("../models/reportoReel.model");

// Utils
const { deleteFiles } = require("../../utils/deleteFile");
const { get_message } = require("../../utils/message");
const getApiBase = require("../../utils/getApiBase");

const Config = { baseURL: getApiBase() };

const commonProductPopulate = [
  { path: "category", select: "name" },
  { path: "subCategory", select: "name" },
  { path: "seller", select: "firstName lastName businessTag businessName image" },
];

// Helper to parse and validate attributes
const parseAndValidateAttributes = (attrInput, res, files) => {
  let attributes;
  try {
    attributes = typeof attrInput === "string" ? JSON.parse(attrInput) : attrInput;
  } catch (e) {
    if (files) deleteFiles(files);
    return { error: res.status(400).json({ status: false, message: get_message(1129) }) };
  }

  if (!Array.isArray(attributes)) {
    if (files) deleteFiles(files);
    return { error: res.status(400).json({ status: false, message: get_message(1129) }) };
  }

  for (const attr of attributes) {
    if (!attr.name || typeof attr.name !== "string" || !attr.name.trim()) {
      if (files) deleteFiles(files);
      return { error: res.status(200).json({ status: false, message: "Attribute must have a valid 'name'" }) };
    }
    if (!Array.isArray(attr.values)) {
      if (files) deleteFiles(files);
      return { error: res.status(200).json({ status: false, message: `Attribute '${attr.name}' must have a 'values' array` }) };
    }
    const validValues = attr.values.filter((v) => v !== null && v !== "" && v !== undefined);
    if (validValues.length === 0) {
      if (files) deleteFiles(files);
      return { error: res.status(200).json({ status: false, message: `Attribute '${attr.name}' must have at least one valid value in 'values'` }) };
    }
    if (!attr.image || typeof attr.image !== "string" || !attr.image.trim()) {
      if (files) deleteFiles(files);
      return { error: res.status(200).json({ status: false, message: `Attribute '${attr.name}' must have a valid 'image'` }) };
    }
  }
  return { attributes };
};


exports.fetchCatSubcatAttrData = async (req, res) => {
  try {
    const [categories, subCategories, attributes] = await Promise.all([
      // 🔹 Categories
      Category.find({}, { _id: 1, name: 1 }).lean(),

      // 🔹 SubCategories
      SubCategory.find({}, { _id: 1, name: 1, category: 1 }).lean(),

      // 🔹 Attributes (only active ones)
      Attributes.aggregate([
        {
          $project: {
            subCategory: 1,
            attributes: {
              $filter: {
                input: "$attributes",
                as: "attr",
                cond: { $eq: ["$$attr.isActive", true] },
              },
            },
          },
        },
        // 🔹 Remove empty attribute arrays (optimization only)
        {
          $match: {
            "attributes.0": { $exists: true },
          },
        },
      ]),
    ]);

    return res.status(200).json({
      status: true,
      message: "Categories, subcategories, and attributes retrieved successfully.",
      categories,
      subCategories,
      attributes,
    });
  } catch (error) {
    console.error("fetchCatSubcatAttrData error:", error);
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server Error",
    });
  }
};

exports.categorywiseAllProducts = async (req, res) => {
  try {
    const page = req.query.page ? Math.max(parseInt(req.query.page), 1) : 1;
    const pageLimit = req.query.limit ? Math.max(parseInt(req.query.limit), 1) : 10;

    const _categoryId = new mongoose.Types.ObjectId(categoryId);
    const _userId = new mongoose.Types.ObjectId(req.user.id);

    const matchStage = {
      category: _categoryId,
      createStatus: "Approved",
      isOutOfStock: false,
      isDeleted: { $ne: true }
    };

    const [totalCount, category, products] = await Promise.all([
      // 🔹 Fast count (indexed)
      Product.countDocuments(matchStage),

      // 🔹 Validate category
      Category.findById(_categoryId).select("_id"),

      // 🔹 Main aggregation
      Product.aggregate([
        { $match: matchStage },

        // 🔹 Ratings summary
        {
          $lookup: {
            from: "ratings",
            let: { productId: "$_id" },
            pipeline: [
              { $match: { $expr: { $eq: ["$productId", "$$productId"] } } },
              {
                $group: {
                  _id: null,
                  totalUser: { $sum: 1 },
                  avgRating: { $avg: "$rating" },
                },
              },
            ],
            as: "rating",
          },
        },

        // 🔹 Favorites (user specific)
        {
          $lookup: {
            from: "favorites",
            let: { productId: "$_id", userId: _userId },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$productId", "$$productId"] },
                      { $eq: ["$userId", "$$userId"] },
                    ],
                  },
                },
              },
              { $limit: 1 },
            ],
            as: "isFavorite",
          },
        },

        // 🔹 Category
        {
          $lookup: {
            from: "categories",
            localField: "category",
            foreignField: "_id",
            as: "category",
          },
        },
        { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },

        // 🔹 SubCategory
        {
          $lookup: {
            from: "subcategories",
            localField: "subCategory",
            foreignField: "_id",
            as: "subCategory",
          },
        },
        { $unwind: { path: "$subCategory", preserveNullAndEmptyArrays: true } },

        // 🔹 Sort + pagination
        { $sort: { createdAt: -1 } },
        { $skip: (page - 1) * pageLimit },
        { $limit: pageLimit },

        // 🔹 Final projection (same output)
        {
          $project: {
            seller: 1,
            productName: 1,
            productCode: 1,
            description: 1,
            price: 1,
            review: 1,
            mainImage: 1,
            images: 1,
            shippingCharges: 1,
            quantity: 1,
            sold: 1,
            isOutOfStock: 1,
            category: { _id: 1, name: 1 },
            subCategory: { _id: 1, name: 1 },
            auctionEndDate: 1,
            productSaleType: 1,
            createStatus: 1,
            updateStatus: 1,
            rating: 1,
            isFavorite: { $gt: [{ $size: "$isFavorite" }, 0] },
          },
        },
      ]),
    ]);

    if (!category) {
      return res.status(200).json({
        status: false,
        message: get_message(1067),
      });
    }

    return res.status(200).json({
      status: true,
      message: "Retrieve category wise products successfully.",
      totalCount,
      totalPages: Math.ceil(totalCount / pageLimit),
      currentPage: page,
      product: products || [],
    });
  } catch (error) {
    console.error("categorywiseAllProducts error:", error);
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server Error",
    });
  }
};


exports.detail = async (req, res) => {
  try {
    const { productId } = req.query;

    if (!productId) {
      return res.status(200).json({
        status: false,
        message: get_message(1074),
      });
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        status: false,
        message: get_message(1106),
      });
    }

    const _productId = new mongoose.Types.ObjectId(productId);
    const _userId = new mongoose.Types.ObjectId(req.user.id);

    const productDetails = await Product.aggregate([
      // 🔹 Fast fail
      {
        $match: {
          _id: _productId,
          createStatus: "Approved",
          isDeleted: { $ne: true }
        },
      },

      // 🔹 Check user rating exists
      {
        $lookup: {
          from: "ratings",
          let: { productId: "$_id", userId: _userId },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$productId", "$$productId"] },
                    { $eq: ["$userId", "$$userId"] },
                  ],
                },
              },
            },
            { $limit: 1 },
          ],
          as: "userRating",
        },
      },
      {
        $addFields: {
          isRating: { $gt: [{ $size: "$userRating" }, 0] },
        },
      },

      // 🔹 Rating summary
      {
        $lookup: {
          from: "ratings",
          let: { productId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$productId", "$$productId"] } } },
            {
              $group: {
                _id: null,
                totalUser: { $sum: 1 },
                avgRating: { $avg: "$rating" },
              },
            },
          ],
          as: "rating",
        },
      },

      // 🔹 Seller lookup
      {
        $lookup: {
          from: "sellers",
          localField: "seller",
          foreignField: "_id",
          as: "seller",
        },
      },
      { $unwind: "$seller" },

      // 🔹 Followers (merged lookup)
      {
        $lookup: {
          from: "followers",
          let: { sellerId: "$seller._id", userId: _userId },
          pipeline: [
            { $match: { $expr: { $eq: ["$sellerId", "$$sellerId"] } } },
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
                isFollow: {
                  $sum: {
                    $cond: [{ $eq: ["$userId", "$$userId"] }, 1, 0],
                  },
                },
              },
            },
          ],
          as: "followerData",
        },
      },
      {
        $addFields: {
          followerCount: {
            $ifNull: [{ $arrayElemAt: ["$followerData.count", 0] }, 0],
          },
          isFollow: {
            $gt: [{ $arrayElemAt: ["$followerData.isFollow", 0] }, 0],
          },
        },
      },

      // 🔹 Favorites
      {
        $lookup: {
          from: "favorites",
          let: { productId: "$_id", userId: _userId },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$productId", "$$productId"] },
                    { $eq: ["$userId", "$$userId"] },
                  ],
                },
              },
            },
            { $limit: 1 },
          ],
          as: "isFavorite",
        },
      },

      // 🔹 Category
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },

      // 🔹 SubCategory
      {
        $lookup: {
          from: "subcategories",
          localField: "subCategory",
          foreignField: "_id",
          as: "subCategory",
        },
      },
      { $unwind: { path: "$subCategory", preserveNullAndEmptyArrays: true } },

      // 🔹 Latest auction bid
      {
        $lookup: {
          from: "auctionbids",
          let: { productId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$productId", "$$productId"] },
                    { $eq: ["$mode", 2] },
                  ],
                },
              },
            },
            { $sort: { currentBid: -1 } },
            { $limit: 1 },
            { $project: { _id: 0, currentBid: 1 } },
          ],
          as: "latestBid",
        },
      },
      {
        $addFields: {
          latestBidPrice: {
            $arrayElemAt: ["$latestBid.currentBid", 0],
          },
        },
      },

      // 🔹 Final projection (unchanged)
      {
        $project: {
          mainImage: 1,
          images: 1,
          price: 1,
          shippingCharges: 1,
          productName: 1,
          productCode: 1,
          attributes: 1,
          location: 1,
          sold: 1,
          review: 1,
          isOutOfStock: 1,
          isNewCollection: 1,
          description: 1,
          rating: 1,
          createStatus: 1,
          updateStatus: 1,
          productSaleType: 1,
          allowOffer: 1,
          minimumOfferPrice: 1,
          enableAuction: 1,
          auctionStartingPrice: 1,
          enableReservePrice: 1,
          auctionDuration: 1,
          scheduleTime: 1,
          reservePrice: 1,
          auctionEndDate: 1,
          latestBidPrice: 1,
          followerCount: 1,
          isRating: 1,
          category: { _id: 1, name: 1 },
          subCategory: { _id: 1, name: 1 },
          seller: {
            _id: 1,
            firstName: 1,
            lastName: 1,
            businessTag: 1,
            businessName: 1,
            image: 1,
            "address.city": 1,
            "address.state": 1,
            "address.country": 1,
          },
          isFollow: 1,
          isFavorite: { $gt: [{ $size: "$isFavorite" }, 0] },
        },
      },
    ]);

    if (!productDetails.length) {
      return res.status(404).json({
        status: false,
        message: get_message(1059),
      });
    }

    return res.status(200).json({
      status: true,
      message: "Product details retrieved successfully.",
      product: productDetails[0],
    });
  } catch (error) {
    console.error("detail error:", error);
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server Error",
    });
  }
};

exports.search = async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.body;

    if (!search || !String(search).trim()) {
      return res.status(400).json({
        status: false,
        message: get_message(1074),
      });
    }

    const pageNum = Math.max(parseInt(page), 1);
    const pageLimit = Math.max(parseInt(limit), 1);
    const q = String(search).trim();

    const populatePaths = [
      { path: "category", select: "name" },
      { path: "subCategory", select: "name" },
    ];

    const baseMatch = {
      createStatus: "Approved",
      isOutOfStock: false,
      isDeleted: { $ne: true },
      productName: { $regex: q, $options: "i" },
    };

    // 1️⃣ Fetch products AND count
    const [products, totalCount] = await Promise.all([
      Product.find(baseMatch)
        .sort({ scheduleTime: 1 })
        .skip((pageNum - 1) * pageLimit)
        .limit(pageLimit)
        .populate(populatePaths)
        .lean(),
      Product.countDocuments(baseMatch)
    ]);

    // 2️⃣ Update analytics ONLY for returned products
    if (products.length) {
      const productIds = products.map(p => p._id);

      Product.updateMany(
        { _id: { $in: productIds } },
        {
          $inc: { searchCount: 1 },
          $currentDate: { lastSearchedAt: true },
        }
      ).exec(); // fire & forget (non-blocking)
    }

    return res.status(200).json({
      status: true,
      message: "Products searched successfully.",
      totalCount,
      totalPages: Math.ceil(totalCount / pageLimit),
      currentPage: pageNum,
      products,
    });
  } catch (error) {
    console.error("search error:", error);
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server Error",
    });
  }
};


exports.searchProduct = async (req, res) => {
  try {
    const baseQuery = {
      createStatus: "Approved",
      isOutOfStock: false,
      isDeleted: { $ne: true }
    };

    const popularQuery = {
      ...baseQuery,
      searchCount: { $gt: 0 },
    };

    const projection = { attributes: 0 };

    const recentQuery = Product.find(baseQuery)
      .select(projection)
      .sort({ lastSearchedAt: -1 })
      .limit(5)
      .lean();

    const popularQueryExec = Product.find(popularQuery)
      .select(projection)
      .sort({ searchCount: -1 })
      .limit(5)
      .lean();

    const [lastSearchedProducts, popularSearchedProducts] =
      await Promise.all([recentQuery, popularQueryExec]);

    console.log(
      "LIMIT CHECK",
      lastSearchedProducts.length,
      popularSearchedProducts.length
    );

    return res.status(200).json({
      status: true,
      message: "Search history and popular products retrieved successfully.",
      products: {
        lastSearchedProducts,
        popularSearchedProducts,
      },
    });
  } catch (error) {
    console.error("searchProduct error:", error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error",
    });
  }
};


exports.filterWiseProduct = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const page = req.body.page ? parseInt(req.body.page) : 1;
    const limit = req.body.limit ? parseInt(req.body.limit) : 10;

    // Filters from body
    let categoryArray = [];
    if (req.body.category) {
      categoryArray = Array.isArray(req.body.category) ? req.body.category.map(id => new mongoose.Types.ObjectId(id)) : [new mongoose.Types.ObjectId(req.body.category)];
    }
    const categoryQuery = categoryArray.length > 0 ? { category: { $in: categoryArray } } : {};

    let subCategoryArray = [];
    if (req.body.subCategory) {
      subCategoryArray = Array.isArray(req.body.subCategory) ? req.body.subCategory.map(id => new mongoose.Types.ObjectId(id)) : [new mongoose.Types.ObjectId(req.body.subCategory)];
    }
    const subCategoryQuery = subCategoryArray.length > 0 ? { subCategory: { $in: subCategoryArray } } : {};

    const priceQuery = {};
    if (req.body.minPrice) priceQuery.price = { $gte: req.body.minPrice };
    if (req.body.maxPrice) priceQuery.price = { ...priceQuery.price, $lte: req.body.maxPrice };

    const query = {
      $and: [categoryQuery, subCategoryQuery, priceQuery].filter(q => Object.keys(q).length > 0)
    };
    const finalMatchQuery = query.$and.length > 0 ? { $and: [{ createStatus: "Approved", isOutOfStock: false }, ...query.$and] } : { createStatus: "Approved", isOutOfStock: false };

    const [user, userIsSeller, products] = await Promise.all([
      User.findOne({ _id: userId, isBlock: false }),
      Seller.findOne({ userId: userId }).lean(),
      Product.aggregate([
        { $match: finalMatchQuery },
        {
          $lookup: {
            from: "favorites",
            let: { productId: "$_id", userId: userId },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [{ $eq: ["$productId", "$$productId"] }, { $eq: ["$userId", userId] }],
                  },
                },
              },
            ],
            as: "isFavorite",
          },
        },
        {
          $lookup: {
            from: "ratings",
            localField: "_id",
            foreignField: "productId",
            as: "productRating",
          },
        },
        {
          $project: {
            _id: 1,
            mainImage: 1,
            images: 1,
            price: 1,
            shippingCharges: 1,
            productName: 1,
            productCode: 1,
            location: 1,
            sold: 1,
            review: 1,
            isOutOfStock: 1,
            description: 1,
            category: 1,
            seller: 1,
            createStatus: 1,
            auctionEndDate: 1,
            productSaleType: 1,
            isFavorite: { $cond: [{ $eq: [{ $size: "$isFavorite" }, 0] }, false, true] },
            ratingAverage: { $ifNull: [{ $avg: "$productRating.rating" }, 0] },
          },
        },
        {
          $facet: {
            metadata: [{ $count: "total" }],
            data: [{ $skip: (page - 1) * limit }, { $limit: limit }],
          },
        },
      ]),
    ]);

    const result = products[0];
    const totalCount = result.metadata[0] ? result.metadata[0].total : 0;
    const paginatedProducts = result.data;

    if (!user) {
      return res.status(404).json({ status: false, message: get_message(1019) });
    }

    const filteredProducts = paginatedProducts.filter((p) => !userIsSeller || p.seller.toString() !== userIsSeller._id.toString());

    return res.status(200).json({
      status: true,
      message: "Retrieve Filter wise products successfully.",
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      product: filteredProducts,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};



exports.geAllNewCollection = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);

    // 1️⃣ Validate user FIRST (fail fast)
    const user = await User.findById(userId).select("_id isBlock");
    if (!user) {
      return res.status(404).json({
        status: false,
        message: get_message(1019),
      });
    }

    if (user.isBlock) {
      return res.status(200).json({
        status: false,
        message: get_message(1017),
      });
    }

    // 2️⃣ Optimized aggregation
    const products = await Product.aggregate([
      {
        $match: {
          isNewCollection: true,
          isOutOfStock: false,
          createStatus: "Approved",
        },
      },

      // 🔹 Favorite check (optimized)
      {
        $lookup: {
          from: "favorites",
          let: { productId: "$_id", userId },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$productId", "$$productId"] },
                    { $eq: ["$userId", "$$userId"] },
                  ],
                },
              },
            },
            { $limit: 1 }, // 👈 important optimization
          ],
          as: "favorite",
        },
      },

      // 🔹 Projection (same output)
      {
        $project: {
          seller: 1,
          mainImage: 1,
          images: 1,
          price: 1,
          shippingCharges: 1,
          productName: 1,
          location: 1,
          sold: 1,
          review: 1,
          isOutOfStock: 1,
          isNewCollection: 1,
          description: 1,
          category: 1,
          rating: 1,
          productCode: 1,
          attributes: 1,
          auctionEndDate: 1,
          productSaleType: 1,
          isFavorite: { $gt: [{ $size: "$favorite" }, 0] },
        },
      },

      // 🔹 Sort & pagination
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [{ $skip: (page - 1) * limit }, { $limit: limit }],
        },
      },
    ]);

    const result = products[0];
    const totalCount = result.metadata[0]?.total || 0;
    const productsData = result.data;

    return res.status(200).json({
      status: true,
      message: "New collection products retrieved successfully.",
      totalProducts: totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      products: productsData,
    });
  } catch (error) {
    console.error("geAllNewCollection error:", error);
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server Error",
    });
  }
};

exports.justForYouProducts = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    // 1️⃣ Validate user
    const user = await User.findById(userId).select("_id isBlock");
    if (!user) {
      return res.status(200).json({ status: false, message: "User not found." });
    }
    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "You are blocked by admin." });
    }

    // 2️⃣ Get user's favorite products + categories
    const favorites = await Favorite.find({ userId }).select("productId categoryId").lean();

    const favoriteProductIds = favorites.map(f => f.productId);
    const favoriteCategoryIds = favorites.map(f => f.categoryId);

    // 3️⃣ Personalized aggregation
    const justForYouProducts = await Product.aggregate([
      {
        $match: {
          createStatus: "Approved",
          isOutOfStock: false,
        },
      },

      // 🔹 Ratings summary
      {
        $lookup: {
          from: "ratings",
          let: { productId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$productId", "$$productId"] } } },
            {
              $group: {
                _id: "$productId",
                avgRating: { $avg: "$rating" },
                totalUser: { $sum: 1 },
              },
            },
          ],
          as: "rating",
        },
      },

      // 🔹 Normalize rating
      {
        $addFields: {
          avgRating: {
            $ifNull: [{ $arrayElemAt: ["$rating.avgRating", 0] }, 0],
          },
        },
      },

      // 🔹 isFavorite flag
      {
        $addFields: {
          isFavorite: { $in: ["$_id", favoriteProductIds] },
        },
      },

      // 🔹 Personalization score (REAL)
      {
        $addFields: {
          personalizationScore: {
            $add: [
              { $cond: [{ $in: ["$_id", favoriteProductIds] }, 5, 0] },      // ⭐ highest boost
              { $cond: [{ $in: ["$category", favoriteCategoryIds] }, 3, 0] }, // ⭐ category boost
              { $cond: [{ $gte: ["$avgRating", 4] }, 2, 0] },                 // ⭐ rating boost
            ],
          },
        },
      },

      // 🔹 Sort by relevance
      {
        $sort: {
          personalizationScore: -1,
          sold: -1,
          review: -1,
          avgRating: -1,
        },
      },

      { $limit: 10 },

      // 🔹 Final response shape
      {
        $project: {
          seller: 1,
          mainImage: 1,
          productName: 1,
          review: 1,
          price: 1,
          sold: 1,
          attributes: 1,
          auctionEndDate: 1,
          productSaleType: 1,
          createStatus: 1,
          rating: 1,
          isFavorite: 1,
        },
      },
    ]);

    return res.status(200).json({
      status: true,
      message: "Retrieve just for you products successful.",
      justForYouProducts,
    });
  } catch (error) {
    console.error("justForYouProducts error:", error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error",
    });
  }
};

exports.getAuctionProducts = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(10, Number(req.query.limit) || 10);
    const now = new Date();

    const auctionProducts = await Product.aggregate([
      {
        $match: {
          enableAuction: true,
          createStatus: "Approved",
          isOutOfStock: false,
          auctionEndDate: { $gt: now }
        }
      },
      {
        $project: {
          productName: 1,
          productCode: 1,
          mainImage: 1,
          auctionStartingPrice: 1,
          auctionEndDate: 1
        }
      },
      { $sort: { auctionEndDate: 1 } },
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [{ $skip: (page - 1) * limit }, { $limit: limit }],
        },
      },
    ]);

    const result = auctionProducts[0];
    const totalCount = result.metadata[0]?.total || 0;
    const productsData = result.data;

    return res.status(200).json({
      status: true,
      message: "Retrieved auction products successfully.",
      totalProducts: totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      auctionProducts: productsData
    });
  } catch (error) {
    console.error("getAuctionProducts error:", error);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error"
    });
  }
};

exports.featuredProducts = async (req, res) => {
  try {
    const popularProducts = await Product.aggregate([
      // 1️⃣ Filter first (uses index)
      {
        $match: {
          isOutOfStock: false,
          createStatus: "Approved",
        },
      },

      // 2️⃣ Ratings lookup
      {
        $lookup: {
          from: "ratings",
          let: { productId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$productId", "$$productId"] },
              },
            },
            {
              $group: {
                _id: "$productId",
                totalUser: { $sum: 1 },
                avgRating: { $avg: "$rating" },
              },
            },
          ],
          as: "rating",
        },
      },

      // 3️⃣ Compute avgRating ONLY for sorting
      {
        $addFields: {
          avgRating: {
            $ifNull: [{ $arrayElemAt: ["$rating.avgRating", 0] }, 0],
          },
        },
      },

      // 4️⃣ SORT EARLY (critical)
      {
        $sort: {
          avgRating: -1,
        },
      },

      // 5️⃣ LIMIT EARLY (critical)
      { $limit: 10 },

      // 6️⃣ Category lookup (only 10 docs now)
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category",
        },
      },

      // 7️⃣ Final projection (REMOVE avgRating)
      {
        $project: {
          mainImage: 1,
          productName: 1,
          productCode: 1,
          description: 1,
          price: 1,
          shippingCharges: 1,
          auctionEndDate: 1,
          productSaleType: 1,
          rating: 1, // ✅ rating array only
          categoryName: { $arrayElemAt: ["$category.name", 0] },
        },
      },
    ]);

    return res.status(200).json({
      status: true,
      message: "Retrieve popular/featured products successful.",
      data: popularProducts,
    });
  } catch (error) {
    console.error("featuredProducts error:", error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error",
    });
  }
};

exports.getRelatedProductsByCategory = async (req, res) => {
  try {
    const { productId, categoryId } = req.query;
    const limit = parseInt(req.query.limit) || 10;

    if (!productId || !categoryId) {
      return res.status(200).json({
        status: false,
        message: "Missing productId or categoryId in query parameters.",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(productId) ||
      !mongoose.Types.ObjectId.isValid(categoryId)
    ) {
      return res.status(200).json({
        status: false,
        message: "Invalid ID format in query parameters.",
      });
    }

    const userId = new mongoose.Types.ObjectId(req.user.id);
    const productObjectId = new mongoose.Types.ObjectId(productId);
    const categoryObjectId = new mongoose.Types.ObjectId(categoryId);

    const relatedProducts = await Product.aggregate([
      // 1️⃣ FILTER (uses index)
      {
        $match: {
          _id: { $ne: productObjectId },
          category: categoryObjectId,
          createStatus: "Approved",
          isOutOfStock: false,
        },
      },

      // 2️⃣ LIMIT EARLY (BIG performance gain)
      { $limit: limit },

      // 3️⃣ LIGHT projection early
      {
        $project: {
          productCode: 1,
          productName: 1,
          price: 1,
          shippingCharges: 1,
          auctionEndDate: 1,
          mainImage: 1,
          images: 1,
          description: 1,
          seller: 1,
          productSaleType: 1,
          category: 1,
        },
      },

      // 4️⃣ Rating aggregation (kept consistent)
      {
        $lookup: {
          from: "ratings",
          let: { pid: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$productId", "$$pid"] },
              },
            },
            {
              $group: {
                _id: "$productId",
                totalUser: { $sum: 1 },
                avgRating: { $avg: "$rating" },
              },
            },
          ],
          as: "rating",
        },
      },

      // 5️⃣ Favorite check (user-specific)
      {
        $lookup: {
          from: "favorites",
          let: { pid: "$_id", uid: userId },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$productId", "$$pid"] },
                    { $eq: ["$userId", "$$uid"] },
                  ],
                },
              },
            },
          ],
          as: "favorite",
        },
      },

      // 6️⃣ Boolean favorite flag
      {
        $addFields: {
          isFavorite: { $gt: [{ $size: "$favorite" }, 0] },
        },
      },

      // 7️⃣ Cleanup
      {
        $project: {
          favorite: 0,
        },
      },
    ]);

    return res.status(200).json({
      status: true,
      message: "Related products fetched successfully based on category.",
      relatedProducts,
    });
  } catch (error) {
    console.error("getRelatedProductsByCategory error:", error);
    return res.status(500).json({
      status: false,
      message: "Failed to fetch related products.",
      error: error.message,
    });
  }
};

exports.create = async (req, res) => {
  try {
    console.log("req.body: ", req.body);
    console.log("req.files: ", req.files);

    const requiredFields = ["productName", "description", "price", "category", "subCategory", "sellerId", "shippingCharges", "productCode", "attributes", "productSaleType"];

    for (const field of requiredFields) {
      if (!req.body[field]) {
        if (req.files) deleteFiles(req.files);
        return res.status(200).json({ status: false, message: `Missing field: ${field}` });
      }
    }

    if (!req.files?.mainImage) {
      return res.status(200).json({ status: false, message: "Main image is required." });
    }

    const [category, subCategory, seller, existProduct] = await Promise.all([
      Category.findById(req.body.category),
      SubCategory.findById(req.body.subCategory),
      Seller.findById(req.body.sellerId),
      Product.findOne({
        seller: req.body.sellerId,
        productName: req.body.productName,
        productCode: req.body.productCode,
      }),
    ]);

    if (!category || !subCategory || !seller) {
      if (req.files) deleteFiles(req.files);
      return res.status(200).json({ status: false, message: "Invalid category, subCategory, or seller." });
    }

    if (existProduct) {
      if (req.files) deleteFiles(req.files);
      return res.status(200).json({
        status: false,
        message: existProduct.createStatus === "Pending" ? "Product request already sent to admin." : "Product with the same name already exists.",
        createStatus: existProduct.createStatus,
        request: existProduct,
      });
    }

    let attributes;
    if (typeof req.body.attributes === "string") {
      console.log("attributes in body: ", typeof req.body.attributes);

      attributes = JSON.parse(req.body.attributes);
    } else if (typeof req.body.attributes === "object") {
      console.log("attributes in body: ", typeof req.body.attributes);

      attributes = req.body.attributes;
    } else {
      return res.status(200).json({
        status: false,
        message: "Invalid attributes format",
      });
    }

    const product = new Product();

    product.productName = req.body.productName.trim();
    product.description = req.body.description.trim();
    product.price = parseFloat(req.body.price) || 0;
    product.category = category._id;
    product.subCategory = subCategory._id;
    product.seller = seller._id;
    product.shippingCharges = parseFloat(req.body.shippingCharges) || 0;
    product.productCode = req.body.productCode;
    product.productSaleType = Number(req.body.productSaleType);
    product.attributes = attributes;

    product.processingTime = req.body.processingTime || "";
    product.recipientAddress = req.body.recipientAddress || "";
    product.isImmediatePaymentRequired = req.body.isImmediatePaymentRequired === "true";

    product.allowOffer = req.body.allowOffer === "true";
    product.minimumOfferPrice = Number(req.body.minimumOfferPrice) || 0;
    product.enableAuction = req.body.enableAuction === "true";
    product.auctionStartingPrice = Number(req.body.auctionStartingPrice) || 0;
    product.enableReservePrice = req.body.enableReservePrice === "true";
    product.reservePrice = Number(req.body.reservePrice) || 0;
    product.auctionDuration = Number(req.body.auctionDuration) || 0;

    let scheduleISO = null;
    let auctionStartISO = null;
    let auctionEndISO = null;

    if (req.body.scheduleTime !== undefined && req.body.scheduleTime !== null && `${req.body.scheduleTime}`.trim() !== "") {
      const m = moment(req.body.scheduleTime, moment.ISO_8601, true);
      if (!m.isValid()) {
        if (req.files) deleteFiles(req.files);
        return res.status(200).json({ status: false, message: "Invalid scheduleTime. Expect ISO 8601 date/time." });
      }
      scheduleISO = m.toISOString(); // normalized ISO string (UTC)
    }

    product.scheduleTime = scheduleISO;

    if (product.enableAuction && product.auctionDuration > 0 && product.scheduleTime) {
      const auctionStart = moment(product.scheduleTime); // moment from ISO
      const auctionEnd = auctionStart.clone().add(product.auctionDuration, "days");

      auctionStartISO = auctionStart.toISOString();
      auctionEndISO = auctionEnd.toISOString();

      product.auctionStartDate = auctionStartISO;
      product.auctionEndDate = auctionEndISO;
    }

    product.date = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });

    product.createStatus = global.settingJSON.isAddProductRequest ? "Pending" : "Approved";

    if (req.files.mainImage) {
      product.mainImage = Config.baseURL + req.files.mainImage[0].path;
    }

    if (req.files.images) {
      product.images = req.files.images.map((img) => Config.baseURL + img.path);
    }

    await product.save();

    const populated = await Product.findById(product._id).populate([
      { path: "category", select: "name" },
      { path: "subCategory", select: "name" },
      {
        path: "seller",
        select: "firstName lastName businessTag businessName image",
      },
    ]);

    res.status(200).json({
      status: true,
      message: product.createStatus === "Pending" ? "Product request created by seller to admin." : "Product added directly by seller.",
      product: populated,
    });

    /*
    if (product.productSaleType === 2 && product.enableAuction && product.auctionEndDate && product.createStatus === "Approved") {
      await manualAuctionQueue.add(
        "closeManualAuction",
        { productId: product._id },
        {
          delay: new Date(product.auctionEndDate).getTime() - Date.now(),
        }
      );
    }
    */
  } catch (error) {
    if (req.files) deleteFiles(req.files);
    console.error("createProduct error:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

exports.detailforSeller = async (req, res) => {
  try {
    if (!req.query.productId || !req.query.sellerId) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details." });
    }

    const [product, seller] = await Promise.all([Product.findById(req.query.productId), Seller.findById(req.query.sellerId)]);

    if (!product) {
      return res.status(200).json({
        status: false,
        message: "No product was found!",
      });
    }

    if (!seller) {
      return res.status(200).json({ status: false, message: "seller does not found!" });
    }

    const productData = await Product.find({ _id: product._id, seller: seller._id }).populate([
      { path: "category", select: "name" },
      { path: "subCategory", select: "name" },
      {
        path: "seller",
        select: "firstName lastName businessTag businessName image",
      },
    ]);

    return res.status(200).json({
      status: true,
      message: "Retrive product details for the seller!",
      product: productData,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server Error",
    });
  }
};

exports.allProductForSeller = async (req, res) => {
  try {
    const { page = 1, limit = 10, sellerId, search = "", saleType } = req.query;

    if (!sellerId) {
      return res.status(200).json({ status: false, message: "Oops! Invalid details!" });
    }

    const sellerObjectId = new mongoose.Types.ObjectId(sellerId);
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = [
      { path: "category", select: "name" },
      { path: "subCategory", select: "name" },
      {
        path: "seller",
        select: "firstName lastName businessTag businessName image",
      },
    ];

    const conditions = {
      seller: sellerObjectId,
      isOutOfStock: false,
    };

    if (search && search !== "All" && search.trim() !== "") {
      conditions.$or = [{ productName: { $regex: search.trim(), $options: "i" } }, { description: { $regex: search.trim(), $options: "i" } }];
    }

    if (saleType && saleType !== "All" && saleType !== "") {
      conditions.productSaleType = Number(saleType);
    }

    const [seller, products] = await Promise.all([Seller.findById(sellerObjectId), Product.find(conditions).populate(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit))]);

    if (!seller) {
      return res.status(200).json({ status: false, message: "Seller not found." });
    }

    const totalCount = await Product.countDocuments(conditions);

    return res.status(200).json({
      status: true,
      message: "Retrieved products for the seller",
      totalProducts: totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: parseInt(page),
      products: products,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error",
    });
  }
};

exports.delete = async (req, res) => {
  try {
    if (!req.query.productId) {
      return res.status(200).json({ status: false, message: "productId must be required!" });
    }

    const productId = new mongoose.Types.ObjectId(req.query.productId);

    const product = await Product.findOne({ _id: productId });
    if (!product) {
      return res.status(200).json({ status: false, message: "Product does not found!" });
    }

    res.status(200).json({
      status: true,
      message: "Product has been deleted.",
    });

    if (product.mainImage) {
      const image = product?.mainImage?.split("storage");
      if (image) {
        if (fs.existsSync("storage" + image[1])) {
          fs.unlinkSync("storage" + image[1]);
        }
      }
    }

    if (product.images) {
      if (product.images.length > 0) {
        for (var i = 0; i < product?.images?.length; i++) {
          const images = product?.images[i]?.split("storage");
          if (images) {
            if (fs.existsSync("storage" + images[1])) {
              fs.unlinkSync("storage" + images[1]);
            }
          }
        }
      }
    }

    const [cart, order, favorite, review, rating, productRequest, reels] = await Promise.all([
      Cart.deleteMany({ "items.productId": productId }),
      Order.deleteMany({ "items.productId": productId }),
      Favorite.deleteMany({ productId: productId }),
      Review.deleteMany({ productId: productId }),
      Rating.deleteMany({ productId: productId }),
      ProductRequest.find({ productCode: product?.productCode }),
      Reel.find({ productId: productId }),
      SellerWallet.deleteMany({ productId: product?._id }),
    ]);

    if (productRequest.length > 0) {
      await productRequest.forEach(async (product) => {
        if (product.mainImage) {
          const image = product?.mainImage?.split("storage");
          if (image) {
            if (fs.existsSync("storage" + image[1])) {
              fs.unlinkSync("storage" + image[1]);
            }
          }
        }

        if (product.images) {
          if (product.images.length > 0) {
            for (var i = 0; i < product?.images?.length; i++) {
              const images = product?.images[i]?.split("storage");
              if (images) {
                if (fs.existsSync("storage" + images[1])) {
                  fs.unlinkSync("storage" + images[1]);
                }
              }
            }
          }
        }
      });
    }

    if (reels.length > 0) {
      await reels.forEach(async (reel) => {
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

        await Promise.all([LikeHistoryOfReel.deleteMany({ reelId: reel?._id }), ReportReel.deleteMany({ reelId: reel?._id })]);
      });
    }

    await Promise.all([AuctionBid.deleteMany({ productId: product?._id }), ProductRequest.deleteMany({ productCode: product?.productCode }), Reel.deleteMany({ productId: product?._id })]);
    await product.deleteOne();
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

exports.selectedProducts = async (req, res) => {
  try {
    if (!req.query.sellerId) {
      return res.status(200).json({ status: false, message: "sellerId must be required!" });
    }

    const sellerId = new mongoose.Types.ObjectId(req.query.sellerId);

    const [seller, totalSelectedProducts, selectedProducts, liveSeller] = await Promise.all([
      Seller.findById(sellerId),
      Product.countDocuments({ isSelect: true, seller: sellerId }),
      Product.find({ isSelect: true, isOutOfStock: false, seller: sellerId }).select("mainImage productName price seller isSelect").sort({ createdAt: -1 }),
      Seller.aggregate([
        {
          $match: {
            _id: sellerId,
            isBlock: false,
            isLive: true,
          },
        },
        {
          $lookup: {
            from: "livesellers",
            let: { liveSellerId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ["$$liveSellerId", "$sellerId"],
                  },
                },
              },
            ],
            as: "liveseller",
          },
        },
        {
          $unwind: {
            path: "$liveseller",
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $project: {
            liveSellingHistoryId: {
              $cond: [{ $eq: ["$isLive", true] }, "$liveseller.liveSellingHistoryId", null],
            },
          },
        },
      ]),
    ]);

    if (!seller) {
      return res.status(200).json({ status: false, message: "seller does not found." });
    }

    return res.status(200).json({
      status: true,
      message: "when seller going for live then finally, get all products selected by the seller!",
      totalSelectedProducts: totalSelectedProducts ? totalSelectedProducts : 0,
      SelectedProducts: selectedProducts.length > 0 ? selectedProducts : [],
      liveSellingHistoryId: liveSeller[0]?.liveSellingHistoryId ? liveSeller[0].liveSellingHistoryId : null,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};



exports.createProductByAdmin = async (req, res) => {
  try {
    const { productName, description, price, category: categoryId, subCategory: subCategoryId, shippingCharges } = req.body;
    let attrInput = req.body.attributes || req.query.attributes;
    const sellerId = req.body.sellerId || req.query.sellerId;
    const productCode = req.body.productCode || req.query.productCode;

    // Validation: Check for required fields (handling 0 for numeric fields)
    const missingFields = [];
    if (!productName) missingFields.push("productName");
    if (!description) missingFields.push("description");
    if (price === undefined || price === null || price === "") missingFields.push("price");
    if (!categoryId) missingFields.push("category");
    if (!subCategoryId) missingFields.push("subCategory");
    if (!sellerId) missingFields.push("sellerId");
    if (shippingCharges === undefined || shippingCharges === null || shippingCharges === "") missingFields.push("shippingCharges");
    if (!productCode) missingFields.push("productCode");
    if (!attrInput) missingFields.push("attributes");

    if (missingFields.length > 0) {
      if (req.files) deleteFiles(req.files);
      return res.status(200).json({ status: false, message: `Missing required fields: ${missingFields.join(", ")}` });
    }

    if (!req.files || !req.files.mainImage) {
      return res.status(200).json({ status: false, message: "Main image is required" });
    }

    const [category, subCategory, seller] = await Promise.all([
      Category.findById(categoryId).select("_id"),
      SubCategory.findById(subCategoryId).select("_id"),
      Seller.findById(sellerId).select("_id"),
    ]);

    if (!category || !subCategory || !seller) {
      if (req.files) deleteFiles(req.files);
      const missing = !category ? "Category" : !subCategory ? "SubCategory" : "Seller";
      return res.status(200).json({ status: false, message: `${missing} not found` });
    }

    const existProduct = await Product.findOne({
      seller: seller._id,
      productCode: productCode.trim(),
    }).select("_id productName productCode");

    if (existProduct) {
      if (req.files) deleteFiles(req.files);
      return res.status(200).json({
        status: false,
        message: "Product with this product code already exists",
        product: existProduct,
      });
    }

    const { error, attributes } = parseAndValidateAttributes(attrInput, res, req.files);
    if (error) return;

    const product = new Product({
      productName: productName.trim(),
      description: description.trim(),
      price: parseFloat(price) || 0,
      category: category._id,
      subCategory: subCategory._id,
      seller: seller._id,
      createStatus: "Approved",
      isAddByAdmin: true,
      shippingCharges: parseFloat(shippingCharges) || 0,
      productCode: productCode.trim(),
      attributes,
      date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
    });

    if (req.files.mainImage) {
      product.mainImage = Config.baseURL + req.files.mainImage[0].path;
    }

    if (req.files.images) {
      product.images = req.files.images.map((img) => Config.baseURL + img.path);
    }

    await product.save();

    const populatedProduct = await Product.findById(product._id).populate([
      { path: "category", select: "name" },
      { path: "subCategory", select: "name" },
      {
        path: "seller",
        select: "firstName lastName businessTag businessName image",
      },
    ]).lean();

    return res.status(200).json({
      status: true,
      message: "Product added successfully",
      product: populatedProduct,
    });
  } catch (error) {
    if (req.files) deleteFiles(req.files);
    console.error("Create product error:", error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error",
    });
  }
};

exports.update = async (req, res) => {
  try {
    const { productId } = req.query;

    if (!productId) {
      if (req.files) deleteFiles(req.files);
      return res.status(200).json({ status: false, message: "Oops! Invalid details." });
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      if (req.files) deleteFiles(req.files);
      return res.status(200).json({ status: false, message: "Invalid ID format." });
    }

    const product = await Product.findById(productId);

    if (!product) {
      if (req.files) deleteFiles(req.files);
      return res.status(200).json({ status: false, message: "Product not found!" });
    }

    let category = null;
    if (req.body.category) {
      category = await Category.findById(req.body.category).select("_id");
      if (!category) {
        if (req.files) deleteFiles(req.files);
        return res.status(200).json({ status: false, message: "Category not found." });
      }
    }

    let subCategory = null;
    if (req.body.subCategory) {
      subCategory = await SubCategory.findById(req.body.subCategory).select("_id");
      if (!subCategory) {
        if (req.files) deleteFiles(req.files);
        return res.status(200).json({ status: false, message: "SubCategory not found." });
      }
    }

    product.productName = req.body.productName || product.productName;
    product.description = req.body.description || product.description;
    product.price = req.body.price || product.price;
    product.shippingCharges = req.body.shippingCharges || product.shippingCharges;
    product.category = category ? category._id : product.category;
    product.subCategory = subCategory ? subCategory._id : product.subCategory;
    product.date = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
    product.updateStatus = "Approved";
    product.isUpdateByAdmin = true;

    if (req.files?.mainImage?.length) {
      const currentMainPath = product.mainImage?.split("storage")[1];
      if (currentMainPath && fs.existsSync("storage" + currentMainPath)) {
        fs.unlinkSync("storage" + currentMainPath);
      }
      product.mainImage = Config.baseURL + req.files.mainImage[0].path;
    }

    let removeIndexes = req.body.removeImageIndexes;
    if (typeof removeIndexes === "string") {
      try {
        removeIndexes = JSON.parse(removeIndexes);
      } catch (e) {
        if (req.files) deleteFiles(req.files);
        return res.status(200).json({ status: false, message: "Invalid removeImageIndexes format." });
      }
    }

    if (Array.isArray(removeIndexes) && removeIndexes.length > 0) {
      removeIndexes.map(Number).sort((a, b) => b - a).forEach(index => {
        if (index >= 0 && index < product.images.length) {
          const imgPath = product.images[index]?.split("storage")[1];
          if (imgPath && fs.existsSync("storage" + imgPath)) fs.unlinkSync("storage" + imgPath);
          product.images.splice(index, 1);
        }
      });
    }

    if (req.files?.images) {
      product.images.push(...req.files.images.map(img => Config.baseURL + img.path));
    }

    if (req.body.attributes) {
      const { error, attributes } = parseAndValidateAttributes(req.body.attributes, res, req.files);
      if (error) return;
      product.attributes = attributes;
    }

    await product.save();

    const populatedProduct = await Product.findById(product._id).populate([
      { path: "category", select: "name" },
      { path: "subCategory", select: "name" },
      { path: "seller", select: "firstName lastName businessTag businessName image" },
    ]).lean();

    return res.status(200).json({
      status: true,
      message: "Product updated successfully.",
      product: populatedProduct,
    });
  } catch (error) {
    if (req.files) deleteFiles(req.files);
    console.error("Update product error:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};


exports.getRealProducts = async (req, res) => {
  try {
    const start = parseInt(req.query.start) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const [totalProducts, product] = await Promise.all([
      Product.countDocuments({ isAddByAdmin: false }),
      Product.find({ isAddByAdmin: false })
        .populate(commonProductPopulate)
        .sort({ createdAt: -1 })
        .skip((start - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    return res.status(200).json({
      status: true,
      message: "Retrive the products.",
      totalProducts,
      totalPages: Math.ceil(totalProducts / limit),
      currentPage: start,
      product,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

exports.getFakeProducts = async (req, res) => {
  try {
    const start = parseInt(req.query.start) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const [totalProducts, product] = await Promise.all([
      Product.countDocuments({ isAddByAdmin: true }),
      Product.find({ isAddByAdmin: true })
        .populate(commonProductPopulate)
        .sort({ createdAt: -1 })
        .skip((start - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    return res.status(200).json({
      status: true,
      message: "Retrive the products.",
      totalProducts,
      totalPages: Math.ceil(totalProducts / limit),
      currentPage: start,
      product,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

exports.productDetailsForAdmin = async (req, res) => {
  try {
    const { productId } = req.query;
    if (!productId) return res.status(200).json({ status: false, message: "productId is required." });

    const product = await Product.findById(productId)
      .populate("category")
      .populate("subCategory")
      .populate("seller")
      .lean();

    if (!product) return res.status(200).json({ status: false, message: "Product not found." });

    return res.status(200).json({
      status: true,
      message: "Product details fetched successfully.",
      product,
    });
  } catch (error) {
    console.error("productDetailsForAdmin error:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

exports.getSellerWise = async (req, res) => {
  try {
    const { sellerId, start = 1, limit = 10 } = req.query;
    const skip = (parseInt(start) - 1) * parseInt(limit);

    const query = sellerId ? { seller: sellerId } : {};

    const [totalCount, products] = await Promise.all([
      Product.countDocuments(query),
      Product.find(query)
        .populate("category", "name")
        .populate("subCategory", "name")
        .populate("seller", "firstName lastName businessName")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
    ]);

    return res.status(200).json({
      status: true,
      message: "Seller-wise products fetched successfully.",
      totalCount,
      products,
    });
  } catch (error) {
    console.error("getSellerWise error:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

exports.topSellingProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const products = await Product.aggregate([
      {
        $sort: { sold: -1 },
      },
      {
        $limit: limit,
      },
      {
        $lookup: {
          from: "ratings",
          localField: "_id",
          foreignField: "productId",
          as: "ratings",
        },
      },
      {
        $project: {
          _id: 1,
          productCode: 1,
          mainImage: 1,
          sold: 1,
          productName: 1,
          rating: { $ifNull: [{ $avg: "$ratings.rating" }, 0] },
        },
      },
    ]);

    return res.status(200).json({
      status: true,
      message: "Top selling products fetched successfully.",
      products,
    });
  } catch (error) {
    console.error("topSellingProducts error:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

exports.popularProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const products = await Product.aggregate([
      {
        $sort: { searchCount: -1, review: -1 },
      },
      {
        $limit: limit,
      },
      {
        $lookup: {
          from: "ratings",
          localField: "_id",
          foreignField: "productId",
          as: "ratings",
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "categoryInfo",
        },
      },
      {
        $unwind: {
          path: "$categoryInfo",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          productCode: 1,
          mainImage: 1,
          productName: 1,
          rating: { $ifNull: [{ $avg: "$ratings.rating" }, 0] },
          categoryName: { $ifNull: ["$categoryInfo.name", ""] },
        },
      },
    ]);

    return res.status(200).json({
      status: true,
      message: "Popular products fetched successfully.",
      products,
    });
  } catch (error) {
    console.error("popularProducts error:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

exports.isOutOfStock = async (req, res) => {
  try {
    const { productId } = req.query;
    if (!productId) {
      return res.status(200).json({ status: false, massage: "productId must be required!" });
    }

    const product = await Product.findById(productId)
      .populate("seller", "firstName lastName image")
      .populate("category", "name")
      .populate("subCategory", "name");

    if (!product) {
      return res.status(200).json({ status: false, message: "product does not found!" });
    }

    product.isOutOfStock = !product.isOutOfStock;
    await product.save();

    return res.status(200).json({
      status: true,
      message: "Success",
      product,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server Error!",
    });
  }
};

exports.isNewCollection = async (req, res) => {
  try {
    const { productId } = req.query;
    if (!productId) {
      return res.status(200).json({ status: false, massage: "productId must be required!!" });
    }

    const product = await Product.findById(productId)
      .populate("seller", "firstName lastName image")
      .populate("category", "name")
      .populate("subCategory", "name");

    if (!product) {
      return res.status(200).json({ status: false, message: "product does not found!!" });
    }

    product.isNewCollection = !product.isNewCollection;
    await product.save();

    return res.status(200).json({
      status: true,
      message: "Success",
      product,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server Error",
    });
  }
};



exports.selectOrNot = async (req, res) => {
  try {
    if (!req.query.productId) {
      return res.status(200).json({ status: false, message: "productId must be required!" });
    }

    const product = await Product.findById(req.query.productId);
    if (!product) {
      return res.status(200).json({ status: false, message: "product does not found!" });
    }

    product.isSelect = !product.isSelect;
    await product.save();

    return res.status(200).json({
      status: true,
      message: "Success",
      product,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error!!",
    });
  }
};

