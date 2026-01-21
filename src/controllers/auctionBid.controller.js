const { default: mongoose } = require("mongoose");
const moment = require("moment");
const AuctionBid = require("../models/auctionBid.model");
const User = require("../models/user.model");
const Product = require("../models/product.model");
const { get_message } = require("../../utils/message");

exports.getUserAuctionBids = async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ status: false, message: get_message(1018) });
        }

        const objectUserId = new mongoose.Types.ObjectId(userId);

        const results = await AuctionBid.aggregate([
            {
                $match: {
                    userId: objectUserId,
                    mode: 2,
                },
            },
            {
                $group: {
                    _id: "$productId",
                    myBids: {
                        $push: {
                            _id: "$_id",
                            currentBid: "$currentBid",
                            startingBid: "$startingBid",
                            createdAt: "$createdAt",
                        },
                    },
                    myHighestBid: { $max: "$currentBid" },
                },
            },
            {
                $addFields: {
                    myBids: {
                        $sortArray: {
                            input: "$myBids",
                            sortBy: { currentBid: -1 },
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: "auctionbids",
                    let: { productId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$productId", "$$productId"] },
                                mode: 2,
                            },
                        },
                        { $sort: { currentBid: -1, createdAt: -1 } },
                        {
                            $project: {
                                currentBid: 1,
                            },
                        },
                    ],
                    as: "allBids",
                },
            },
            {
                $addFields: {
                    highestBidOnProduct: { $max: "$allBids.currentBid" },
                },
            },
            {
                $lookup: {
                    from: "products",
                    localField: "_id",
                    foreignField: "_id",
                    as: "product",
                },
            },
            {
                $unwind: "$product",
            },
            {
                $lookup: {
                    from: "categories",
                    localField: "product.category",
                    foreignField: "_id",
                    as: "category",
                },
            },
            {
                $unwind: {
                    path: "$category",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: "subcategories",
                    localField: "product.subCategory",
                    foreignField: "_id",
                    as: "subCategory",
                },
            },
            {
                $unwind: {
                    path: "$subCategory",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: "sellers",
                    localField: "product.sellerId",
                    foreignField: "_id",
                    as: "seller",
                },
            },
            {
                $unwind: {
                    path: "$seller",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $project: {
                    _id: 0,
                    productId: "$product._id",
                    productName: "$product.productName",
                    productCode: "$product.productCode",
                    mainImage: "$product.mainImage",
                    attributes: "$product.attributes",
                    auctionEndTime: "$product.auctionEndDate",
                    categoryName: "$category.name",
                    subCategoryName: "$subCategory.name",
                    seller: {
                        _id: "$seller._id",
                        firstName: "$seller.firstName",
                        lastName: "$seller.lastName",
                        businessName: "$seller.businessName",
                        businessTag: "$seller.businessTag",
                        image: "$seller.image",
                    },
                    myBids: 1,
                    myHighestBid: 1,
                    highestBidOnProduct: 1,
                },
            },
            {
                $sort: { myHighestBid: -1 },
            },
        ]);

        return res.status(200).json({
            status: true,
            message: get_message(1057),
            products: results,
        });
    } catch (err) {
        console.error("Auction bid fetch error:", err);
        return res.status(500).json({ status: false, message: "Internal server error" });
    }
};

exports.getSellerAuctionBids = async (req, res) => {
    try {
        return res.status(200).json({ status: true, message: "Get seller auction bids" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
    }
};

exports.getProductWiseUserBids = async (req, res) => {
    try {
        return res.status(200).json({ status: true, message: "Get product wise user bids" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
    }
};

//place bid
exports.placeManualBid = async (req, res) => {
    try {
        const { userId, productId, attributes } = req.body;
        const bid = Number(req.body.bidAmount);

        if (!userId || !productId || !Number.isFinite(bid) || bid <= 0) {
            return res.status(400).json({ status: false, message: get_message(1058) });
        }

        const attr = attributes || [];

        const [product, currentBid] = await Promise.all([
            Product.findById(productId).select("productSaleType enableAuction seller scheduleTime auctionDuration auctionStartingPrice auctionStartDate auctionEndDate").lean(),
            AuctionBid.findOne({ productId, mode: 2 }).sort({ currentBid: -1 }).lean(),
        ]);

        if (!product) return res.status(404).json({ status: false, message: get_message(1059) });
        if (!product.enableAuction) return res.status(400).json({ status: false, message: get_message(1060) });

        const startISO = product.auctionStartDate || product.scheduleTime || null;
        let endISO = product.auctionEndDate || null;

        if (!endISO && startISO && Number.isFinite(Number(product.auctionDuration))) {
            endISO = moment(startISO).add(Number(product.auctionDuration), "days").toISOString();
        }

        if (!startISO || !endISO) {
            return res.status(400).json({ status: false, message: get_message(1061) });
        }

        const startMs = Date.parse(startISO);
        const endMs = Date.parse(endISO);
        if (Number.isNaN(startMs) || Number.isNaN(endMs)) {
            return res.status(400).json({ status: false, message: get_message(1062) });
        }

        const nowMs = Date.now();
        if (nowMs < startMs) return res.status(400).json({ status: false, message: get_message(1063) });
        if (nowMs > endMs) return res.status(400).json({ status: false, message: get_message(1064) });

        const startingBid = Number(currentBid?.startingBid ?? product.auctionStartingPrice ?? 0);
        const highestBid = Number(currentBid?.currentBid ?? startingBid);

        if (!Number.isFinite(startingBid) || !Number.isFinite(highestBid)) {
            return res.status(400).json({ status: false, message: get_message(1065) });
        }

        if (bid <= highestBid) {
            return res.status(400).json({ status: false, message: get_message(1066) });
        }

        const newBid = await AuctionBid.create({
            userId,
            productId,
            sellerId: product.seller || null,
            liveHistoryId: null,
            startingBid,
            currentBid: bid,
            attributes: attr,
            mode: 2,
        });

        return res.status(200).json({ status: true, message: get_message(1067), bid: newBid });
    } catch (error) {
        console.error("Place Bid Error:", error);
        return res.status(500).json({ status: false, message: "Internal server error" });
    }
};
