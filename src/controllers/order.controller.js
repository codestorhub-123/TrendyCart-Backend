const mongoose = require("mongoose");
const Order = require("../models/order.model");
const User = require("../models/user.model");
const Cart = require("../models/cart.model");
const Address = require("../models/address.model");
const Seller = require("../models/seller.model");
const PromoCode = require("../models/promocode.model");
const PromoCodeCheck = require("../models/promoCodeCheck.model");
const Notification = require("../models/notification.model");
const admin = require("../../utils/firebase");
const moment = require("moment");
const Product = require("../models/product.model");
const SellerWallet = require("../models/sellerWallet.model");
const { get_message } = require("../../utils/message");

const STATUS = {
    PENDING: "Pending",
    CONFIRMED: "Confirmed",
    OUT: "Out For Delivery",
    DELIVERED: "Delivered",
    CANCELLED: "Cancelled",
};

const STATUS_FLOW = {
    Pending: ["Confirmed", "Cancelled"],
    Confirmed: ["Out For Delivery", "Cancelled"],
    "Out For Delivery": ["Delivered"],
};

const ORDER_POPULATE = [
    { path: "items.productId", select: "productName mainImage _id" },
    { path: "items.sellerId", select: "firstName lastName businessName" },
    { path: "userId", select: "firstName lastName uniqueId" },
];

// Helper for Notifications
const sendStatusNotification = async (user, title, body, order, sellerId, productId) => {
    if (!user || user.isBlock || !user.fcmToken) return;
    try {
        await admin.messaging().send({
            token: user.fcmToken,
            notification: { title, body },
        });
        await Notification.create({
            userId: order.userId,
            image: user.image,
            sellerId,
            productId,
            message: title,
            notificationType: 2,
            date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
        });
    } catch (err) {
        console.error("Notification error:", err.message);
    }
};

// ==========================================
// User APIs
// ==========================================

exports.create = async (req, res) => {
    try {
        if (!global.settingJSON) {
            return res.status(500).json({ status: false, message: get_message(1110) });
        }

        let userId;
        if (req.user && (req.user._id || req.user.id)) {
            userId = req.user._id || req.user.id;
        } else if (req.query.userId) {
            userId = req.query.userId;
        } else if (req.body.userId) {
            userId = req.body.userId;
        } else {
            return res.status(401).json({ status: false, message: get_message(1111) });
        }

        const { finalTotal, paymentGateway, items, shippingAddress, promoCode } = req.body;

        if (finalTotal === undefined || finalTotal === null) {
            return res.status(400).json({ error: get_message(1112) });
        }

        const paymentDetailsInfo = paymentGateway ? paymentGateway.trim() : "";
        const paymentStatus = paymentDetailsInfo && paymentDetailsInfo.toLowerCase() !== "cod" ? 2 : 1;

        const userObjectId = new mongoose.Types.ObjectId(userId);
        const finalTotalByUser = Math.floor(finalTotal);

        const [user, dataFromCart, orderAddress] = await Promise.all([
            User.findById(userObjectId),
            Cart.findOne({ userId: userObjectId }),
            Address.findOne({ userId: userObjectId, isSelect: true }),
        ]);

        if (!user) {
            return res.status(404).json({ status: false, message: get_message(1019) });
        }

        if (user.isBlock) {
            return res.status(403).json({ status: false, message: get_message(1017) });
        }

        let orderItems = [];
        let subTotalFromItems = 0;
        let shippingFromItems = 0;

        if (items && items.length > 0) {
            orderItems = items;
            subTotalFromItems = items.reduce((sum, item) => sum + (item.purchasedTimeProductPrice || 0) * (item.productQuantity || 0), 0);
            shippingFromItems = items.reduce((sum, item) => sum + (item.purchasedTimeShippingCharges || 0), 0);
        } else if (dataFromCart && dataFromCart.items.length > 0) {
            orderItems = dataFromCart.items;
            subTotalFromItems = dataFromCart.subTotal;
            shippingFromItems = dataFromCart.totalShippingCharges;
        } else {
            return res.status(400).json({ status: false, message: get_message(1113) });
        }

        const workingCartData =
            items && items.length > 0
                ? {
                    items: items,
                    subTotal: subTotalFromItems,
                    totalShippingCharges: shippingFromItems || req.body.totalShippingCharges || 0,
                    userId: userObjectId,
                }
                : dataFromCart;

        const itemsBySeller = workingCartData.items.reduce((acc, item) => {
            if (!acc[item.sellerId]) acc[item.sellerId] = [];
            acc[item.sellerId].push(item);
            return acc;
        }, {});

        const orders = [];
        const orderId = "INV#" + Math.floor(10000 + Math.random() * 90000);
        let totalCartValue = workingCartData.subTotal;

        let promoCodeData = null;
        let totalDiscount = 0;
        let discountedTotal = 0;
        let discountDistribution = {};
        let sellerPercentageDistribution = {};

        if (req?.body?.promoCode?.trim()) {
            promoCodeData = await PromoCode.findOne({ promoCode: req.body.promoCode }).lean();
            if (!promoCodeData) {
                return res.status(400).json({ status: false, message: get_message(1114) });
            }

            const promoCodeCheck = await PromoCodeCheck.findOne({
                promoCodeId: promoCodeData._id,
                userId: userObjectId,
            });

            if (promoCodeCheck) {
                return res.status(409).json({ status: false, message: get_message(1115) });
            }

            if (promoCodeData.discountType === 1) {
                totalDiscount = Math.floor((workingCartData.subTotal * promoCodeData.discountAmount) / 100);
            } else if (promoCodeData.discountType === 2) {
                totalDiscount = promoCodeData.discountAmount;
            }

            discountedTotal = workingCartData.subTotal - totalDiscount;
            const calculatedTotal = discountedTotal + workingCartData.totalShippingCharges;
            const preDiscountTotal = workingCartData.subTotal + workingCartData.totalShippingCharges;

            if (finalTotalByUser !== calculatedTotal && finalTotalByUser !== preDiscountTotal) {
                return res.status(200).json({
                    status: false,
                    message: get_message(1116),
                    expected: calculatedTotal,
                    received: finalTotalByUser,
                });
            }

            Object.entries(itemsBySeller).forEach(([sellerId, items]) => {
                const sellerSubTotal = items.reduce((acc, item) => acc + item.purchasedTimeProductPrice * item.productQuantity, 0);
                sellerPercentageDistribution[sellerId] = ((sellerSubTotal / totalCartValue) * 100).toFixed(2);
                discountDistribution[sellerId] = parseFloat(((sellerSubTotal / totalCartValue) * totalDiscount).toFixed(2));
            });

            const distributedTotal = Object.values(discountDistribution).reduce((acc, value) => acc + value, 0);
            const difference = totalDiscount - distributedTotal;
            if (difference !== 0) {
                const [maxSellerId] = Object.entries(discountDistribution).reduce((max, entry) => (entry[1] > max[1] ? entry : max));
                discountDistribution[maxSellerId] += difference;
            }
        } else {
            discountedTotal = workingCartData.subTotal;
            const calculatedTotal = discountedTotal + workingCartData.totalShippingCharges;
            if (finalTotalByUser !== calculatedTotal) {
                return res.status(200).json({
                    status: false,
                    message: get_message(1116),
                });
            }
        }

        const globalTotalShipping = req.body.totalShippingCharges || 0;
        let shippingDistributed = false;

        for (const [sellerId, items] of Object.entries(itemsBySeller)) {
            const seller = await Seller.findById(sellerId);
            const purchasedTimeadminCommissionCharges = global.settingJSON?.adminCommissionCharges || 0;
            const purchasedTimecancelOrderCharges = global.settingJSON?.cancelOrderCharges || 0;

            let sellerShippingCharges = items.reduce((acc, item) => acc + (item.purchasedTimeShippingCharges || 0), 0);

            // If items don't have shipping but body has totalShippingCharges, give it to the first item of first seller
            if (sellerShippingCharges === 0 && globalTotalShipping > 0 && !shippingDistributed) {
                sellerShippingCharges = globalTotalShipping;
                shippingDistributed = true; // Only distribute once
            }

            const sellerSubTotal = items.reduce((acc, item) => acc + item.purchasedTimeProductPrice * item.productQuantity, 0);
            const sellerDiscount = discountDistribution[sellerId] || 0;
            const sellerDiscountRate = sellerPercentageDistribution[sellerId] || 0;
            const sellerFinalTotal = sellerSubTotal - sellerDiscount + sellerShippingCharges;

            let quantityTotal = 0;

            const updatedItems = items.map((item, index) => {
                const itemValue = item.purchasedTimeProductPrice * item.productQuantity;
                const itemDiscount = parseFloat(((itemValue / sellerSubTotal) * sellerDiscount).toFixed(2));
                const adminCommission = (item.purchasedTimeProductPrice * purchasedTimeadminCommissionCharges) / 100;
                const commissionPerProductQuantity = adminCommission * item.productQuantity;
                quantityTotal += parseInt(item?.productQuantity);

                // If we are distributing the global shipping, put it on the first item
                let itemShipping = item.purchasedTimeShippingCharges || 0;
                if (index === 0 && sellerShippingCharges > 0 && items.reduce((acc, i) => acc + (i.purchasedTimeShippingCharges || 0), 0) === 0) {
                    itemShipping = sellerShippingCharges;
                }

                return {
                    ...item,
                    itemDiscount: itemDiscount,
                    commissionPerProductQuantity: commissionPerProductQuantity,
                    purchasedTimeShippingCharges: itemShipping,
                    status: "Pending",
                    date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
                };
            });

            const orderData = {
                userId: userObjectId,
                sellerId,
                items: updatedItems,
                totalItems: items.length,
                subTotal: sellerSubTotal,
                discountRate: sellerDiscountRate,
                discount: sellerDiscount,
                totalShippingCharges: sellerShippingCharges,
                finalTotal: sellerFinalTotal,
                totalQuantity: quantityTotal,
                orderId,
                paymentStatus,
                paymentGateway,
                promoCode: req.body.promoCode
                    ? {
                        promoCode: promoCodeData?.promoCode,
                        discountType: promoCodeData?.discountType,
                        discountAmount: promoCodeData?.discountAmount,
                        conditions: promoCodeData?.conditions,
                    }
                    : null,
                shippingAddress: shippingAddress
                    ? {
                        name: shippingAddress.name,
                        country: shippingAddress.country,
                        state: shippingAddress.state,
                        city: shippingAddress.city,
                        zipCode: shippingAddress.zipCode,
                        address: shippingAddress.address,
                    }
                    : orderAddress
                        ? {
                            name: orderAddress.name,
                            country: orderAddress.country,
                            state: orderAddress.state,
                            city: orderAddress.city,
                            zipCode: orderAddress.zipCode,
                            address: orderAddress.address,
                        }
                        : null,
                purchasedTimeadminCommissionCharges,
                purchasedTimecancelOrderCharges,
                date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
            };

            const order = new Order(orderData);
            orders.push(order);
            await order.save();
        }

        if (!items || items.length === 0) {
            await Cart.findOneAndUpdate(
                { userId },
                {
                    $set: {
                        items: [],
                        totalShippingCharges: 0,
                        subTotal: 0,
                        total: 0,
                        finalTotal: 0,
                        totalItems: 0,
                    },
                }
            );
        }

        res.status(200).json({
            status: true,
            message: "Orders created successfully.",
            orderId: orderId,
            orders: orders.map((o) => ({
                _id: o._id,
                sellerId: o.sellerId,
                finalTotal: o.finalTotal,
            })),
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
    }
};

exports.cancelOrderByUser = async (req, res) => {
    try {
        if (!req.query.userId || !req.query.orderId || !req.query.status || !req.query.itemId) {
            return res.status(400).json({ status: false, message: get_message(1074) });
        }

        const [user, findOrder] = await Promise.all([User.findById(req.query.userId), Order.findOne({ orderId: req.query.orderId })]);

        if (!user) {
            return res.status(404).json({ status: false, message: get_message(1019) });
        }

        if (user.isBlock) {
            return res.status(403).json({ status: false, message: get_message(1017) });
        }

        if (!findOrder) return res.status(404).json({ status: false, message: get_message(1117) });

        if (findOrder.userId.toString() !== user._id.toString()) return res.status(403).json({ status: false, message: get_message(1118) });

        const itemToUpdate = findOrder.items.find((item) => item._id.toString() === req.query.itemId.toString());
        if (!itemToUpdate) {
            return res.status(404).json({ status: false, message: get_message(1119) });
        }

        if (req.query.status === "Cancelled") {
            if (itemToUpdate.status === "Out Of Delivery") {
                return res.status(400).json({ status: false, message: get_message(1120) });
            }

            if (itemToUpdate.status === "Delivered") {
                return res.status(200).json({ status: false, message: "This order is already Delivered , you can't update it to Cancelled" });
            }

            if (itemToUpdate.status === "Cancelled") {
                return res.status(200).json({ status: false, message: "You can't cancel this order, This order is already cancelled" });
            }

            const purchasedTimeProductPrice = parseInt(itemToUpdate?.purchasedTimeProductPrice);
            const productQuantity = parseInt(itemToUpdate?.productQuantity);
            const purchasedTimeShippingCharges = parseInt(itemToUpdate?.purchasedTimeShippingCharges);

            const cancelOrderCharges = (purchasedTimeProductPrice * findOrder?.purchasedTimecancelOrderCharges) / 100;
            const chargesPerProductQuantity = cancelOrderCharges * productQuantity;
            const refundAmount = purchasedTimeProductPrice * productQuantity + purchasedTimeShippingCharges - chargesPerProductQuantity;

            if (refundAmount < chargesPerProductQuantity) {
                return res.status(400).json({ status: false, message: get_message(1120) });
            }

            const [updatedOrder, userUpdate] = await Promise.all([
                Order.findOneAndUpdate(
                    { _id: findOrder._id, "items._id": itemToUpdate._id },
                    {
                        $set: {
                            "items.$.status": "Cancelled",
                        },
                    },
                    { new: true }
                ),
                User.updateOne(
                    { _id: user._id, amount: { $gt: 0 } },
                    {
                        $inc: {
                            amount: Math.round(Math.abs(refundAmount)),
                        },
                    }
                ),
            ]);

            const data = await Order.findOne({ _id: updatedOrder._id })
                .populate({ path: "items.productId", select: "productName mainImage _id" })
                .populate({ path: "items.sellerId", select: "firstName lastName businessName" });

            res.status(200).json({
                status: true,
                message: "Order item status has been updated to Cancelled",
                data: data,
            });
        } else {
            return res.status(400).json({ status: false, message: get_message(1121) });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
    }
};

exports.orderDetailsForUser = async (req, res) => {
    try {
        const queryStatus = req.query.status;
        const status = queryStatus ? decodeURIComponent(queryStatus) : null;
        let userId;

        if (req.query.userId) {
            userId = req.query.userId;
        } else if (req.user && (req.user._id || req.user.id)) {
            userId = req.user._id || req.user.id;
        }

        let userObjectId;
        if (userId) {
            try {
                userObjectId = typeof userId === "string" ? new mongoose.Types.ObjectId(userId) : userId;
            } catch (e) {
                return res.status(400).json({ status: false, message: get_message(1074) });
            }
        }

        if (!userId || !status) {
            return res.status(400).json({ status: false, message: get_message(1074) });
        }

        const user = await User.findById(userId).select("_id isBlock");
        if (!user) {
            return res.status(404).json({ status: false, message: get_message(1019) });
        }

        if (user.isBlock) {
            return res.status(403).json({ status: false, message: get_message(1017) });
        }

        const allowedStatuses = [
            "Pending",
            "Confirmed",
            "Out For Delivery",
            "Delivered",
            "Cancelled",
            "Manual Auction Pending Payment",
            "Manual Auction Cancelled",
            "Auction Pending Payment",
            "Auction Cancelled",
        ];

        const matchStatus =
            status === "All"
                ? { "items.status": { $in: allowedStatuses } }
                : allowedStatuses.includes(status)
                    ? { "items.status": status }
                    : null;

        if (!matchStatus) {
            return res.status(400).json({ status: false, message: get_message(1121) });
        }

        const now = new Date();

        const orders = await Order.aggregate([
            {
                $match: {
                    userId: userObjectId,
                    ...matchStatus,
                },
            },
            {
                $project: {
                    userId: 1,
                    orderId: 1,
                    finalTotal: 1,
                    paymentStatus: 1,
                    paymentGateway: 1,
                    promoCode: 1,
                    shippingAddress: 1,
                    createdAt: { $dateToString: { format: "%d/%m/%Y", date: "$createdAt", timezone: "Asia/Kolkata" } }, // Format date
                    manualAuctionPaymentReminderDuration: 1,
                    liveAuctionPaymentReminderDuration: 1,
                    items: {
                        $filter: {
                            input: "$items",
                            as: "item",
                            cond: status === "All" ? { $in: ["$$item.status", allowedStatuses] } : { $eq: ["$$item.status", status] },
                        },
                    },
                },
            },
            {
                $addFields: {
                    items: {
                        $map: {
                            input: "$items",
                            as: "item",
                            in: {
                                $mergeObjects: [
                                    "$$item",
                                    {
                                        paymentTimeRemaining: {
                                            $switch: {
                                                branches: [
                                                    {
                                                        case: { $eq: ["$$item.status", "Manual Auction Pending Payment"] },
                                                        then: {
                                                            $max: [
                                                                0,
                                                                {
                                                                    $subtract: [
                                                                        { $multiply: ["$manualAuctionPaymentReminderDuration", 60] },
                                                                        { $floor: { $divide: [{ $subtract: [now, "$createdAt"] }, 1000] } },
                                                                    ],
                                                                },
                                                            ],
                                                        },
                                                    },
                                                    {
                                                        case: { $eq: ["$$item.status", "Auction Pending Payment"] },
                                                        then: {
                                                            $max: [
                                                                0,
                                                                {
                                                                    $subtract: [
                                                                        { $multiply: ["$liveAuctionPaymentReminderDuration", 60] },
                                                                        { $floor: { $divide: [{ $subtract: [now, "$createdAt"] }, 1000] } },
                                                                    ],
                                                                },
                                                            ],
                                                        },
                                                    },
                                                ],
                                                default: "$$REMOVE",
                                            },
                                        },
                                        date: { $dateToString: { format: "%d/%m/%Y", date: "$$item.createdAt", timezone: "Asia/Kolkata" } }
                                    },
                                ],
                            },
                        },
                    },
                },
            },
            { $unwind: "$items" },
            {
                $addFields: {
                    "items.productId": {
                        $cond: {
                            if: { $eq: [{ $type: "$items.productId" }, "string"] },
                            then: { $toObjectId: "$items.productId" },
                            else: "$items.productId",
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: "products",
                    localField: "items.productId",
                    foreignField: "_id",
                    as: "productData",
                },
            },
            {
                $addFields: {
                    "items.productId": {
                        $arrayElemAt: [
                            {
                                $map: {
                                    input: "$productData",
                                    as: "prod",
                                    in: {
                                        _id: "$$prod._id",
                                        productName: "$$prod.productName",
                                        mainImage: "$$prod.mainImage",
                                    },
                                },
                            },
                            0,
                        ],
                    },
                },
            },
            { $project: { productData: 0 } },
            {
                $group: {
                    _id: "$_id",
                    userId: { $first: "$userId" },
                    orderId: { $first: "$orderId" },
                    finalTotal: { $first: "$finalTotal" },
                    paymentStatus: { $first: "$paymentStatus" },
                    paymentGateway: { $first: "$paymentGateway" },
                    promoCode: { $first: "$promoCode" },
                    shippingAddress: { $first: "$shippingAddress" },
                    createdAt: { $first: "$createdAt" },
                    manualAuctionPaymentReminderDuration: { $first: "$manualAuctionPaymentReminderDuration" },
                    liveAuctionPaymentReminderDuration: { $first: "$liveAuctionPaymentReminderDuration" },
                    items: { $push: "$items" },
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "userData",
                },
            },
            {
                $addFields: {
                    userId: {
                        $arrayElemAt: [
                            {
                                $map: {
                                    input: "$userData",
                                    as: "u",
                                    in: {
                                        _id: "$$u._id",
                                        firstName: "$$u.firstName",
                                        lastName: "$$u.lastName",
                                        mobileNumber: "$$u.mobileNumber",
                                    },
                                },
                            },
                            0,
                        ],
                    },
                },
            },
            { $project: { userData: 0 } },
            { $sort: { createdAt: -1 } },
        ]);

        return res.status(200).json({
            status: true,
            message: `Retrieved Order History for User with status ${status}`,
            orderData: orders,
        });
    } catch (error) {
        console.error("Aggregation Error:", error);
        return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
    }
};

exports.modifyOrderItemStatus = async (req, res) => {
    try {
        if (!req.query.orderId || !req.query.itemId) {
            return res.status(400).json({ status: false, message: get_message(1074) });
        }

        let activeOrder;
        if (mongoose.isValidObjectId(req.query.orderId)) {
            activeOrder = await Order.findById(req.query.orderId);
            if (!activeOrder) {
                activeOrder = await Order.findOne({ orderId: req.query.orderId });
            }
        } else {
            activeOrder = await Order.findOne({ orderId: req.query.orderId });
        }

        if (!activeOrder) {
            return res.status(404).json({ status: false, message: get_message(1117) });
        }

        const item = activeOrder.items.find((item) => item._id.toString() === req.query.itemId);
        if (!item) {
            return res.status(404).json({ status: false, message: get_message(1119) });
        }

        const allowedCurrentStatuses = ["Manual Auction Pending Payment", "Auction Pending Payment", "Pending"];

        if (allowedCurrentStatuses.includes(item.status)) {
            const itemIndex = activeOrder.items.findIndex((i) => i._id.toString() === req.query.itemId);
            activeOrder.items[itemIndex].status = "Confirmed";
            await activeOrder.save();

            return res.status(200).json({ status: true, message: "Order item status updated to Confirmed" });
        } else {
            return res.status(200).json({
                status: false,
                message: `Item status '${item.status}' not eligible for update. Must be one of: ${allowedCurrentStatuses.join(", ")}`,
            });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: false, message: "Internal Server Error" });
    }
};

exports.ordersOfUser = async (req, res) => {
    try {
        const { userId, status, page = 1, limit = 10 } = req.query;
        if (!userId || !status) {
            return res.status(400).json({ status: false, message: get_message(1074) });
        }

        const user = await User.findById(userId).lean();
        if (!user) {
            return res.status(404).json({ status: false, message: get_message(1019) });
        }

        if (user.isBlock) {
            return res.status(403).json({ status: false, message: get_message(1017) });
        }

        const validStatuses = ["Pending", "Confirmed", "Out For Delivery", "Delivered", "Cancelled"];
        let statusQuery = {};

        if (validStatuses.includes(status)) {
            statusQuery = { "items.status": status };
        } else if (status === "All") {
            statusQuery = { "items.status": { $in: validStatuses } };
        } else {
            return res.status(400).json({ status: false, message: get_message(1121) });
        }

        const [totalOrder, orderData] = await Promise.all([
            Order.countDocuments({ userId: user._id, ...statusQuery }),
            Order.find({ userId: user._id, ...statusQuery })
                .populate({ path: "items.productId", select: "productName mainImage _id" })
                .sort({ createdAt: -1 })
                .skip((parseInt(page) - 1) * parseInt(limit))
                .limit(parseInt(limit))
                .lean(),
        ]);

        orderData.forEach((order) => {
            order.createdAt = moment(order.createdAt).format("DD/MM/YYYY");
            order.updatedAt = moment(order.updatedAt).format("DD/MM/YYYY");
            if (order.items) {
                order.items.forEach(item => {
                    if (item.date) item.date = moment(item.date).format("DD/MM/YYYY");
                });
            }
        });

        if (status !== "All") {
            orderData.forEach((order) => {
                order.items = order?.items.filter((item) => item?.status === status);
            });
        }

        return res.status(200).json({
            status: true,
            message: `Retrieve OrderHistory for User with status ${status}`,
            totalOrder: totalOrder,
            totalPages: Math.ceil(totalOrder / limit),
            currentPage: parseInt(page),
            orderData: orderData,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
    }
};

// ==========================================
// Seller APIs
// ==========================================

exports.ordersOfSeller = async (req, res) => {
    try {
        const VALID_STATUSES = [
            "Pending",
            "Confirmed",
            "Out For Delivery",
            "Delivered",
            "Cancelled",
            "Manual Auction Pending Payment",
            "Manual Auction Cancelled",
            "Auction Pending Payment",
            "Auction Cancelled",
        ];

        const { sellerId, status, page = 1, limit = 10 } = req.query;

        if (!sellerId || !status || !mongoose.Types.ObjectId.isValid(sellerId)) {
            return res.status(400).json({ status: false, message: get_message(1074) });
        }

        const seller = await Seller.findById(sellerId).select("_id");
        if (!seller) {
            return res.status(404).json({ status: false, message: get_message(1013) });
        }

        let matchStatusQuery = {};
        if (status === "All") {
            matchStatusQuery["items.status"] = { $in: VALID_STATUSES };
        } else if (VALID_STATUSES.includes(status)) {
            matchStatusQuery["items.status"] = status;
        } else {
            return res.status(400).json({ status: false, message: get_message(1121) });
        }

        const baseMatch = { "items.sellerId": seller._id, ...matchStatusQuery };
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const limitVal = parseInt(limit);

        const [orders, countResult] = await Promise.all([
            Order.aggregate([
                { $unwind: "$items" },
                { $match: baseMatch },
                { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "user" } },
                { $unwind: "$user" },
                { $sort: { createdAt: -1 } },
                { $skip: skip },
                { $limit: limitVal },
                {
                    $project: {
                        _id: 1,
                        items: 1,
                        shippingAddress: 1,
                        orderId: 1,
                        paymentGateway: 1,
                        paymentStatus: 1,
                        userFirstName: "$user.firstName",
                        userLastName: "$user.lastName",
                    },
                },
            ]),
            Order.aggregate([{ $unwind: "$items" }, { $match: baseMatch }, { $count: "total" }]),
        ]);

        const orderWithProducts = await Order.populate(orders, {
            path: "items.productId",
            select: "productName mainImage _id",
        });

        orderWithProducts.forEach(order => {
            order.createdAt = moment(order.createdAt).format("DD/MM/YYYY");
            order.updatedAt = moment(order.updatedAt).format("DD/MM/YYYY");
            if (order.items) {
                order.items.forEach(item => {
                    if (item.date) item.date = moment(item.date).format("DD/MM/YYYY");
                });
            }
        });

        return res.status(200).json({
            status: true,
            message: `Order history for seller with status ${status}`,
            total: countResult[0]?.total || 0,
            totalPages: Math.ceil((countResult[0]?.total || 0) / limit),
            currentPage: parseInt(page),
            orders: orderWithProducts,
        });
    } catch (error) {
        console.error("Error in ordersOfSeller:", error);
        return res.status(500).json({ status: false, message: "Internal Server Error" });
    }
};

exports.orderCountForSeller = async (req, res) => {
    try {
        const { sellerId, startDate, endDate } = req.query;

        if (!sellerId || !mongoose.Types.ObjectId.isValid(sellerId)) {
            return res.status(200).json({ status: false, message: "Oops ! Invalid sellerId." });
        }

        const seller = await Seller.findById(sellerId).select("_id");
        if (!seller) {
            return res.status(200).json({ status: false, message: "Seller not found!" });
        }

        let matchQuery = {
            "items.sellerId": seller._id,
        };

        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            matchQuery.createdAt = { $gte: start, $lte: end };
        }

        const counts = await Order.aggregate([
            { $unwind: "$items" },
            { $match: matchQuery },
            { $group: { _id: "$items.status", count: { $sum: 1 } } },
        ]);

        const result = {
            Pending: 0,
            Confirmed: 0,
            "Out For Delivery": 0,
            Delivered: 0,
            Cancelled: 0,
            "Manual Auction Pending Payment": 0,
            "Manual Auction Cancelled": 0,
            "Auction Pending Payment": 0,
            "Auction Cancelled": 0,
            totalOrders: 0,
        };

        counts.forEach((c) => {
            if (result.hasOwnProperty(c._id)) {
                result[c._id] = c.count;
            }
            result.totalOrders += c.count;
        });

        return res.status(200).json({
            status: true,
            message: "Order counts retrieved successfully!",
            ...result,
        });
    } catch (error) {
        console.error("orderCountForSeller error:", error);
        return res.status(500).json({ status: false, message: "Internal Server Error" });
    }
};

exports.orderDetailsForSeller = async (req, res) => {
    try {
        const { sellerId, status, startDate, endDate, page = 1, limit = 10 } = req.query;

        if (!sellerId || !status || !mongoose.Types.ObjectId.isValid(sellerId)) {
            return res.status(200).json({ status: false, message: "Oops ! Invalid sellerId or status." });
        }

        const seller = await Seller.findById(sellerId).select("_id");
        if (!seller) {
            return res.status(200).json({ status: false, message: "Seller not found!" });
        }

        let matchQuery = {
            "items.sellerId": seller._id,
        };

        if (startDate && endDate) {
            const sDate = new Date(startDate);
            const eDate = new Date(endDate);
            eDate.setHours(23, 59, 59, 999);
            matchQuery.createdAt = { $gte: sDate, $lte: eDate };
        }

        if (status !== "All") {
            matchQuery["items.status"] = status;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const limitVal = parseInt(limit);

        const [orders, countResult] = await Promise.all([
            Order.aggregate([
                { $unwind: "$items" },
                { $match: matchQuery },
                { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "user" } },
                { $unwind: "$user" },
                { $sort: { createdAt: -1 } },
                { $skip: skip },
                { $limit: limitVal },
                {
                    $project: {
                        _id: 1,
                        items: 1,
                        shippingAddress: 1,
                        orderId: 1,
                        paymentGateway: 1,
                        paymentStatus: 1,
                        userFirstName: "$user.firstName",
                        userLastName: "$user.lastName",
                        userMobileNumber: "$user.mobileNumber",
                        userId: "$user._id",
                        userId: "$user._id",
                        createdAt: { $dateToString: { format: "%d/%m/%Y", date: "$createdAt", timezone: "Asia/Kolkata" } }, // Format date
                    },
                },
            ]),
            Order.aggregate([{ $unwind: "$items" }, { $match: matchQuery }, { $count: "total" }]),
        ]);

        const orderWithProducts = await Order.populate(orders, {
            path: "items.productId",
            select: "productName mainImage _id",
        });

        // Since the aggregation pipeline already formats 'createdAt' and 'items.date', 
        // we likely do NOT need to re-format them with moment here. 
        // If 'updatedAt' needs formatting and isn't handled in aggregation, handle it carefully.
        // Assuming 'updatedAt' is a Date object from Mongoose, moment(order.updatedAt) is fine.
        // But if it's already a string or undefined, we should check.

        /* 
           Simpler approach: 
           The aggregation returns 'createdAt' as a string "DD/MM/YYYY". 
           Passing that back into moment("10/02/2026") triggers the warning because it's not ISO.
           And since it is ALREADY formatted, we don't need to format it again.
        */

        // orderWithProducts.forEach(order => {
        //     // order.createdAt is already "DD/MM/YYYY" from $dateToString
        //     // order.items.date is already "DD/MM/YYYY" from $dateToString
        // });

        return res.status(200).json({
            status: true,
            message: `Order history for seller with status ${status}`,
            total: countResult[0]?.total || 0,
            totalPages: Math.ceil((countResult[0]?.total || 0) / limit),
            currentPage: parseInt(page),
            orders: orderWithProducts,
        });
    } catch (error) {
        console.error("orderDetailsForSeller error:", error);
        return res.status(500).json({ status: false, message: "Internal Server Error" });
    }
};

// ==========================================
// Admin APIs
// ==========================================

exports.getOrders = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const status = req.query.status;

        const query = {};
        if (status && status !== "All") {
            query["items.status"] = status;
        }

        const [orders, totalOrders] = await Promise.all([
            Order.find(query)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .populate("userId", "firstName lastName uniqueId")
                .populate("items.sellerId", "businessName")
                .populate("items.productId", "productName mainImage")
                .lean(),
            Order.countDocuments(query),
        ]);

        const formattedOrders = orders.map((order) => {
            let items = order.items;
            if (status && status !== "All") {
                items = items.filter((item) => item.status === status);
            }

            const totalQuantity = items.reduce((sum, item) => sum + (item.productQuantity || 0), 0);
            const totalItems = items.length;

            return {
                ...order,
                userId: order.userId || {},
                shippingAddress: order.shippingAddress || {},
                promoCode: order.promoCode || {},
                items: items.map((item) => ({
                    ...item,
                    productId: item.productId || {},
                    sellerId: item.sellerId || {},
                })),
                totalQuantity,
                totalItems,
            };
        });

        return res.status(200).json({
            status: true,
            message: "All orders retrieved successfully.",
            total: totalOrders,
            totalPages: Math.ceil(totalOrders / limit),
            currentPage: page,
            data: formattedOrders,
        });
    } catch (error) {
        console.error("getOrders error:", error);
        return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
    }
};

exports.orderDetails = async (req, res) => {
    try {
        const { orderId } = req.query;
        if (!orderId) {
            return res.status(200).json({ status: false, message: "Oops ! Invalid details." });
        }

        let order;
        if (mongoose.isValidObjectId(orderId)) {
            order = await Order.findById(orderId)
                .populate("items.productId", "productName mainImage _id")
                .populate("items.sellerId", "firstName lastName businessName profileImage")
                .populate("userId", "firstName lastName email profileImage mobileNumber")
                .lean();
        }

        const formatHelper = (d) => {
            if (!d) return "";
            if (moment(d).isValid()) return moment(d).format("DD-MM-YYYY");
            const m = moment(d, ["M/D/YYYY, h:mm:ss A", "D/M/YYYY, h:mm:ss A", "MM/DD/YYYY", "DD/MM/YYYY"]);
            return m.isValid() ? m.format("DD-MM-YYYY") : d;
        };

        if (order) {
            order.createdAt = formatHelper(order.createdAt);
            order.updatedAt = formatHelper(order.updatedAt);
            if (order.items) {
                order.items.forEach(item => {
                    item.date = formatHelper(item.date);
                });
            }
        }

        if (!order) {
            order = await Order.findOne({ orderId: orderId })
                .populate("items.productId", "productName mainImage _id")
                .populate("items.sellerId", "firstName lastName businessName profileImage")
                .populate("userId", "firstName lastName email profileImage mobileNumber")
                .lean();
        }

        if (order) {
            order.createdAt = formatHelper(order.createdAt);
            order.updatedAt = formatHelper(order.updatedAt);
            if (order.items) {
                order.items.forEach(item => {
                    item.date = formatHelper(item.date);
                });
            }
        }

        if (!order) {
            return res.status(200).json({ status: false, message: "Order not found." });
        }

        return res.status(200).json({
            status: true,
            message: "Retrieve order details for admin.",
            order: order,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: false, message: "Internal Server Error" });
    }
};

exports.recentOrders = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const orders = await Order.find()
            .sort({ createdAt: -1 })
            .limit(limit)
            .select("userId items createdAt orderId paymentGateway finalTotal")
            .populate("userId", "firstName lastName profileImage")
            .populate("items.productId", "productName mainImage _id")
            .populate("items.sellerId", "businessName")
            .lean();

        orders.forEach(order => {
            order.createdAt = moment(order.createdAt).format("DD/MM/YYYY");
            order.updatedAt = moment(order.updatedAt).format("DD/MM/YYYY");
        });

        return res.status(200).json({
            status: true,
            message: "Retrieve recent orders!",
            orders,
        });
    } catch (error) {
        console.error("recentOrders error:", error);
        return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
    }
};

exports.updateOrder = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { orderId, itemId, status, deliveredServiceName, trackingId, trackingLink } = req.body;

        if (!orderId || !itemId || !status) {
            return res.status(200).json({ status: false, message: "orderId, itemId and status are required" });
        }

        let order;
        if (mongoose.isValidObjectId(orderId)) {
            order = await Order.findById(orderId).session(session);
        }
        if (!order) {
            order = await Order.findOne({ orderId: orderId }).session(session);
        }

        if (!order) {
            await session.abortTransaction();
            session.endSession();
            return res.status(200).json({ status: false, message: "Order not found" });
        }

        const item = order.items.find((i) => i._id.toString() === itemId);
        if (!item) {
            await session.abortTransaction();
            session.endSession();
            return res.status(200).json({ status: false, message: "Item not found in order" });
        }

        const currentStatus = item.status;

        if (!STATUS_FLOW[currentStatus] || !STATUS_FLOW[currentStatus].includes(status)) {
            await session.abortTransaction();
            session.endSession();
            return res.status(200).json({
                status: false,
                message: `Cannot update order from ${currentStatus} to ${status}`,
            });
        }

        if (status === STATUS.OUT) {
            if (!deliveredServiceName || !trackingId || !trackingLink) {
                await session.abortTransaction();
                session.endSession();
                return res.status(200).json({
                    status: false,
                    message: "deliveredServiceName, trackingId and trackingLink are required",
                });
            }
        }

        if (deliveredServiceName) item.deliveredServiceName = deliveredServiceName;
        if (trackingId) item.trackingId = trackingId;
        if (trackingLink) item.trackingLink = trackingLink;

        if (status === STATUS.DELIVERED) {
            const sellerEarning = item.purchasedTimeProductPrice * item.productQuantity - item.commissionPerProductQuantity;

            await Promise.all([
                Product.updateOne({ _id: item.productId }, { $inc: { sold: item.productQuantity } }, { session }),
                Seller.updateOne(
                    { _id: item.sellerId },
                    {
                        $inc: {
                            netPayout: sellerEarning + item.purchasedTimeShippingCharges,
                        },
                    },
                    { session }
                ),
                SellerWallet.create(
                    [
                        {
                            orderId: order._id,
                            productId: item.productId,
                            itemId: item._id,
                            sellerId: item.sellerId,
                            amount: sellerEarning + item.purchasedTimeShippingCharges,
                            commissionPerProductQuantity: item.commissionPerProductQuantity,
                            shippingCharges: item.purchasedTimeShippingCharges,
                            transactionType: 1,
                            date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
                        },
                    ],
                    { session }
                ),
            ]);
        }

        if (status === STATUS.CANCELLED) {
            const price = Number(item.purchasedTimeProductPrice);
            const qty = Number(item.productQuantity);
            const shipping = Number(item.purchasedTimeShippingCharges);

            const cancelCharge = (price * order.purchasedTimecancelOrderCharges) / 100;
            const totalCancelCharge = cancelCharge * qty;
            const refundAmount = price * qty + shipping - totalCancelCharge;

            if (refundAmount <= 0) {
                await session.abortTransaction();
                session.endSession();
                return res.status(200).json({
                    status: false,
                    message: "Refund amount must be greater than zero",
                });
            }

            await User.updateOne({ _id: order.userId }, { $inc: { amount: Math.round(refundAmount) } }, { session });
        }

        item.status = status;
        await order.save({ session });

        await session.commitTransaction();
        session.endSession();

        const updatedOrder = await Order.findById(order._id).populate(ORDER_POPULATE).lean();

        if (updatedOrder) {
            updatedOrder.createdAt = moment(updatedOrder.createdAt).format("DD/MM/YYYY");
            updatedOrder.updatedAt = moment(updatedOrder.updatedAt).format("DD/MM/YYYY");
            if (updatedOrder.items) {
                updatedOrder.items.forEach(item => {
                    if (item.date) item.date = moment(item.date).format("DD/MM/YYYY");
                });
            }
        }

        const user = await User.findById(order.userId).lean();

        await sendStatusNotification(user, `Order ${status}`, `Your order item is now ${status}`, order, item.sellerId, item.productId);

        return res.status(200).json({
            status: true,
            message: `Order item updated to ${status}`,
            data: updatedOrder,
        });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("updateOrder error:", error);
        return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
    }
};