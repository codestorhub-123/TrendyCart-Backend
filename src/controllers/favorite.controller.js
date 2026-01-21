const Favorite = require("../models/favorite.model");
const Product = require("../models/product.model");
const Category = require("../models/category.model");
const User = require("../models/user.model");
const mongoose = require("mongoose");
const { get_message } = require("../../utils/message");

exports.favoriteUnfavorite = async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user.id);
        const { productId } = req.body;

        // Validate productId
        if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(200).json({
                status: false,
                message: get_message(1106),
            });
        }

        // Get product & category from DB (trusted source)
        const product = await Product.findById(productId).select("_id category");
        if (!product) {
            return res.status(404).json({
                status: false,
                message: get_message(1059),
            });
        }

        // Check existing favorite
        const existingFavorite = await Favorite.findOne({
            userId,
            productId: product._id,
        });

        // Unfavorite
        if (existingFavorite) {
            await Favorite.deleteOne({ _id: existingFavorite._id });

            return res.status(200).json({
                status: true,
                message: "Unfavorite successfully!",
                isFavorite: false,
            });
        }

        // Favorite
        await Favorite.create({
            userId,
            productId: product._id,
            categoryId: product.category,
        });

        return res.status(200).json({
            status: true,
            message: "Favorite successfully!",
            isFavorite: true,
        });
    } catch (error) {
        console.error("favoriteUnfavorite error:", error);
        return res.status(500).json({
            status: false,
            message: "Internal Server Error",
        });
    }
};

exports.favoriteProduct = async (req, res) => {
    try {
        if (!req.query.userId) {
            return res.status(400).json({ status: false, message: get_message(1074) });
        }

        const userId = new mongoose.Types.ObjectId(req.query.userId);

        const [user, favorite] = await Promise.all([
            User.findById(userId),
            Favorite.aggregate([
                {
                    $match: {
                        userId: { $eq: userId },
                    },
                },
                { $sort: { createdAt: -1 } },
                {
                    $lookup: {
                        from: "products",
                        let: {
                            productId: "$productId", // $productId is field of favorite table
                        },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $eq: ["$$productId", "$_id"], // $_id is field of product table
                                    },
                                },
                            },
                            {
                                $lookup: {
                                    from: "categories",
                                    as: "category",
                                    localField: "category", // localField - category is field of product table
                                    foreignField: "_id",
                                },
                            },
                            {
                                $unwind: {
                                    path: "$category",
                                    preserveNullAndEmptyArrays: false,
                                },
                            },
                            {
                                $lookup: {
                                    from: "subcategories",
                                    as: "subCategory",
                                    localField: "subCategory", // localField - category is field of product table
                                    foreignField: "_id",
                                },
                            },
                            {
                                $unwind: {
                                    path: "$subCategory",
                                    preserveNullAndEmptyArrays: false,
                                },
                            },
                            {
                                $project: {
                                    productName: 1,
                                    price: 1,
                                    size: 1,
                                    mainImage: 1,
                                    enableAuction: 1,
                                    auctionEndDate: 1,
                                    productSaleType: 1,
                                    category: "$category.name",
                                    subCategory: "$subCategory.name",
                                },
                            },
                        ],
                        as: "product",
                    },
                },
                {
                    $project: {
                        createdAt: 0,
                        updatedAt: 0,
                        __v: 0,
                    },
                },
            ]),
        ]);

        if (!user) {
            return res.status(404).json({ status: false, message: get_message(1019) });
        }

        return res.status(200).json({ status: true, message: favorite.length > 0 ? "Success" : "No data found!", favorite: favorite.length > 0 ? favorite : [] });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: false,
            error: error.message || "Internal Server Error",
        });
    }
};
