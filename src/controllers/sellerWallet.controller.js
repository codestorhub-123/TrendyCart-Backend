const mongoose = require("mongoose");
const Seller = require("../models/seller.model");
const SellerWallet = require("../models/sellerWallet.model");
const { get_message } = require("../../utils/message");

// Retrieve seller wallet history (User/Seller usage)
exports.retrieveSellerWalletHistory = async (req, res) => {
    try {
        const { sellerId } = req.query;

        if (!sellerId) {
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

// Fetch Admin Earnings (Admin usage)
exports.fetchAdminEarnings = async (req, res) => {
    try {
        const start = req.query.start ? parseInt(req.query.start) : 1;
        const limit = req.query.limit ? parseInt(req.query.limit) : 20;

        const startDate = req?.query?.startDate || "All";
        const endDate = req?.query?.endDate || "All";

        let dateFilterQuery = {};
        if (startDate !== "All" && endDate !== "All") {
            const [startDay, startMonth, startYear] = startDate.split("-");
            const [endDay, endMonth, endYear] = endDate.split("-");

            const formatStartDate = new Date(startYear, startMonth - 1, startDay);
            const formatEndDate = new Date(endYear, endMonth - 1, endDay);
            formatEndDate.setHours(23, 59, 59, 999);

            dateFilterQuery = {
                createdAt: {
                    $gte: formatStartDate,
                    $lte: formatEndDate,
                },
            };
        }

        const [total, transactions, totalEarnings] = await Promise.all([
            SellerWallet.countDocuments(dateFilterQuery),
            SellerWallet.aggregate([
                {
                    $match: {
                        ...dateFilterQuery,
                    },
                },
                {
                    $addFields: {
                        productId: {
                            $convert: {
                                input: "$productId",
                                to: "objectId",
                                onError: null,
                                onNull: null,
                            },
                        },
                        orderId: {
                            $convert: {
                                input: "$orderId",
                                to: "objectId",
                                onError: null,
                                onNull: null,
                            },
                        },
                    },
                },
                {
                    $lookup: {
                        from: "products",
                        localField: "productId",
                        foreignField: "_id",
                        as: "productDetails",
                    },
                },
                {
                    $lookup: {
                        from: "orders",
                        localField: "orderId",
                        foreignField: "_id",
                        as: "orderDetails",
                    },
                },
                {
                    $unwind: { path: "$productDetails", preserveNullAndEmptyArrays: true },
                },
                {
                    $unwind: { path: "$orderDetails", preserveNullAndEmptyArrays: true },
                },
                {
                    $lookup: {
                        from: "sellers",
                        localField: "sellerId",
                        foreignField: "_id",
                        as: "seller",
                    },
                },
                { $unwind: { path: "$seller", preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        amount: 1,
                        commissionPerProductQuantity: 1,
                        date: 1,
                        sellerName: {
                            $trim: {
                                input: {
                                    $concat: [
                                        { $ifNull: ["$seller.firstName", ""] },
                                        " ",
                                        { $ifNull: ["$seller.lastName", ""] },
                                    ],
                                },
                            },
                        },
                        businessTag: "$seller.businessTag",
                        businessName: "$seller.businessName",
                        orderId: { $ifNull: ["$orderDetails.orderId", "-"] },
                        productName: { $ifNull: ["$productDetails.productName", "-"] },
                        productImage: { $ifNull: ["$productDetails.mainImage", ""] },
                    },
                },
                { $sort: { createdAt: -1 } },
                { $skip: (start - 1) * limit },
                { $limit: limit },
            ]),
            SellerWallet.aggregate([
                {
                    $match: {
                        ...dateFilterQuery,
                    },
                },
                {
                    $group: {
                        _id: null,
                        totalEarnings: { $sum: "$commissionPerProductQuantity" }, // Sum of admin commissions
                    },
                },
            ]),
        ]);

        return res.status(200).json({
            status: true,
            message: "Success",
            totalEarnings: totalEarnings.length > 0 ? totalEarnings[0].totalEarnings : 0,
            total: total,
            data: transactions,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
    }
};

// Retrieve transactions for a specific seller (Admin usage)
exports.retrieveSellerTransactions = async (req, res) => {
    try {
        if (!req.query.sellerId || !req.query.startDate || !req.query.endDate) {
            return res.status(400).json({ status: false, message: get_message(1074) });
        }

        const start = req.query.start ? parseInt(req.query.start) : 1;
        const limit = req.query.limit ? parseInt(req.query.limit) : 20;
        const sellerObjId = new mongoose.Types.ObjectId(req.query.sellerId);

        let dateFilterQuery = {};
        if (req.query.startDate !== "All" && req.query.endDate !== "All") {
            const [startDay, startMonth, startYear] = req.query.startDate.split("-");
            const [endDay, endMonth, endYear] = req.query.endDate.split("-");

            const startDate = new Date(startYear, startMonth - 1, startDay);
            const endDate = new Date(endYear, endMonth - 1, endDay);
            endDate.setHours(23, 59, 59, 999);

            dateFilterQuery = {
                createdAt: {
                    $gte: startDate,
                    $lte: endDate,
                },
            };
        }

        let transactionTypeQuery = {};
        if (req.query.type && req.query.type !== "All") {
            transactionTypeQuery.transactionType = parseInt(req.query.type);
        }

        const [seller, total, data] = await Promise.all([
            Seller.findOne({ _id: sellerObjId, isBlock: false }).select("_id").lean(),
            SellerWallet.countDocuments({ ...dateFilterQuery, ...transactionTypeQuery, sellerId: sellerObjId }),
            SellerWallet.aggregate([
                {
                    $match: {
                        ...dateFilterQuery,
                        ...transactionTypeQuery,
                        sellerId: sellerObjId,
                    },
                },
                {
                    $addFields: {
                        productId: {
                            $convert: {
                                input: "$productId",
                                to: "objectId",
                                onError: null,
                                onNull: null,
                            },
                        },
                        orderId: {
                            $convert: {
                                input: "$orderId",
                                to: "objectId",
                                onError: null,
                                onNull: null,
                            },
                        },
                    },
                },
                {
                    $lookup: {
                        from: "orders",
                        localField: "orderId",
                        foreignField: "_id",
                        as: "order",
                    },
                },
                {
                    $unwind: {
                        path: "$order",
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $lookup: {
                        from: "sellers",
                        localField: "sellerId",
                        foreignField: "_id",
                        as: "seller",
                    },
                },
                { $unwind: { path: "$seller", preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: "users",
                        localField: "order.userId", // This is still good as it comes from the matched order
                        foreignField: "_id",
                        as: "user",
                    },
                },
                {
                    $unwind: {
                        path: "$user",
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $lookup: {
                        from: "products",
                        localField: "productId",
                        foreignField: "_id",
                        as: "product",
                    },
                },
                {
                    $unwind: {
                        path: "$product",
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $addFields: {
                        orderAmount: {
                            $add: [{ $ifNull: ["$amount", 0] }, { $ifNull: ["$commissionPerProductQuantity", 0] }],
                        },
                    },
                },
                {
                    $project: {
                        sellerName: {
                            $trim: {
                                input: {
                                    $concat: [
                                        { $ifNull: ["$seller.firstName", ""] },
                                        " ",
                                        { $ifNull: ["$seller.lastName", ""] },
                                    ],
                                },
                            },
                        },
                        businessTag: "$seller.businessTag",
                        businessName: "$seller.businessName",
                        buyerName: "$user.firstName",
                        productName: { $ifNull: ["$product.productName", "-"] },
                        orderId: { $ifNull: ["$order.orderId", "-"] },
                        sellerEarning: "$amount",
                        adminEarning: "$commissionPerProductQuantity",
                        transactionType: 1,
                        date: 1,
                        orderAmount: 1,
                    },
                },
                { $sort: { createdAt: -1 } },
                { $skip: (start - 1) * limit },
                { $limit: limit },
            ]),
        ]);

        if (!seller) {
            return res.status(404).json({ status: false, message: get_message(1013) });
        }

        return res.status(200).json({
            status: true,
            message: "Success",
            total: total,
            data: data,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
    }
};
