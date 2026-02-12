const mongoose = require("mongoose");
const WithdrawRequest = require("../models/withdrawRequest.model");
const Seller = require("../models/seller.model");
const SellerWallet = require("../models/sellerWallet.model");
const admin = require("../../utils/firebase");
const { get_message } = require("../../utils/message");

const WithDrawRequest = WithdrawRequest; // Alias to match user's code variable usage

// Helper for unique ID
const generateHistoryUniqueId = () => {
    return Math.floor(Math.random() * 1000000000 + 1).toString();
};

// Initiate cash out request
exports.initiateCashOut = async (req, res) => {
    try {
        const { sellerId, paymentGateway, paymentDetails, amount } = req.body;

        if (!paymentGateway || !amount) {
            return res.status(400).json({ status: false, message: get_message(1074) });
        }

        let sellerObjectId;
        if (sellerId) {
            sellerObjectId = new mongoose.Types.ObjectId(sellerId);
        }

        // Step 1: Find Seller first to get ID if not provided
        let seller;
        if (sellerObjectId) {
            seller = await Seller.findOne({ _id: sellerObjectId }).select("_id netPayout isBlock fcmToken").lean();
        } else if (req.user && req.user.id) {
            seller = await Seller.findOne({ userId: req.user.id }).select("_id netPayout isBlock fcmToken").lean();
            if (seller) sellerObjectId = seller._id;
        }

        if (!seller) {
            return res.status(404).json({ status: false, message: get_message(1013) });
        }

        const withdrawalAmount = Number(amount);

        // Step 2: Check other constraints after we have sellerObjectId
        const [pendingRequest, declinedRequest] = await Promise.all([
            WithDrawRequest.findOne({ sellerId: sellerObjectId, status: 1 }).select("_id").lean(),
            WithDrawRequest.findOne({ sellerId: sellerObjectId, status: 3 }).select("_id").lean(),
        ]);

        if (seller.isBlock) {
            return res.status(403).json({ status: false, message: get_message(1017) });
        }

        // Access global settingJSON
        const settings = global.settingJSON;
        if (!settings || !settings.minPayout) {
            // If settings missing or minPayout not set, maybe skip or handle?
            // Keeping existing error but checking if actually empty object
            if (!settings) return res.status(404).json({ status: false, message: get_message(1171) });
        }

        if (withdrawalAmount > seller.netPayout) {
            return res.status(400).json({ status: false, message: get_message(1172) });
        }

        if (withdrawalAmount < settings.minPayout) {
            return res.status(400).json({ status: false, message: get_message(1173) });
        }

        if (pendingRequest) {
            return res.status(200).json({
                status: false,
                message: get_message(1174),
            });
        }

        if (declinedRequest) {
            await WithDrawRequest.deleteOne({ _id: declinedRequest._id });
        }

        const trimmedPaymentGateway = paymentGateway.trim();
        const formattedDetails = paymentDetails;
        const uniqueId = generateHistoryUniqueId();

        await Promise.all([
            WithDrawRequest.create({
                sellerId: sellerObjectId,
                amount: withdrawalAmount,
                paymentGateway: trimmedPaymentGateway,
                paymentDetails: formattedDetails,
                uniqueId: uniqueId,
                requestDate: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
            }),
        ]);

        res.status(200).json({
            status: true,
            message: "Your withdrawal request has been successfully submitted.",
        });

        if (seller.fcmToken !== null) {
            const payload = {
                token: seller.fcmToken,
                notification: {
                    title: "💰 Withdrawal Request Received! 🚀",
                    body: "Great news! Your withdrawal request has been submitted successfully. Our team is on it! ✅",
                },
                data: { type: "WITHDRAWREQUEST" },
            };

            if (admin) {
                admin
                    .messaging()
                    .send(payload)
                    .then((response) => console.log("Notification sent:", response))
                    .catch((error) => console.error("Error sending notification:", error));
            }
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: false, message: "Internal Server Error" });
    }
};

// Get withdrawal requests by seller
exports.getWithdrawalRequestsBySeller = async (req, res) => {
    try {
        let { startDate = "All", endDate = "All", sellerId } = req.query;

        if (!sellerId && req.user && req.user.id) {
            const seller = await Seller.findOne({ userId: req.user.id }).select("_id").lean();
            if (seller) sellerId = seller._id;
        }

        if (!sellerId) {
            return res.status(200).json({
                status: false,
                message: (req.user && req.user.id) ? get_message(1013) : get_message(1074),
            });
        }

        const page = req.query.page ? parseInt(req.query.page) : 1;
        const limit = req.query.limit ? parseInt(req.query.limit) : 20;

        let dateFilterQuery = {};
        if (startDate !== "All" && endDate !== "All") {
            const startDateObj = new Date(startDate);
            const endDateObj = new Date(endDate);
            endDateObj.setHours(23, 59, 59, 999);

            dateFilterQuery = {
                createdAt: {
                    $gte: startDateObj,
                    $lte: endDateObj,
                },
            };
        }

        const query = {
            ...dateFilterQuery,
            sellerId: sellerId,
        };

        const [total, withdrawalRequests] = await Promise.all([
            WithDrawRequest.countDocuments(query),
            WithDrawRequest.find(query)
                .skip((page - 1) * limit)
                .limit(limit)
                .sort({ createdAt: -1 })
                .lean(),
        ]);

        return res.status(200).json({
            status: true,
            message: "Seller withdrawal requests fetched successfully!",
            totalWithdrawalRequests: total,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            data: withdrawalRequests,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
    }
};

// List all withdrawal requests (Admin)
exports.listWithdrawalRequests = async (req, res) => {
    try {




        const page = req.query.page ? parseInt(req.query.page) : 1;
        const limit = req.query.limit ? parseInt(req.query.limit) : 20;

        let typeQuery = {};
        if (req.query.type && req.query.type !== "All") {
            typeQuery.status = parseInt(req.query.type);
        }

        let dateFilterQuery = {};
        if (req?.query?.startDate && req?.query?.startDate !== "All" && req?.query?.endDate !== "All") {
            const startDate = new Date(req?.query?.startDate);
            const endDate = new Date(req?.query?.endDate);
            endDate.setHours(23, 59, 59, 999);

            dateFilterQuery = {
                createdAt: {
                    $gte: startDate,
                    $lte: endDate,
                },
            };
        }

        const [total, request] = await Promise.all([
            WithDrawRequest.countDocuments({ ...dateFilterQuery, ...typeQuery }),
            WithDrawRequest.find({ ...dateFilterQuery, ...typeQuery })
                .populate("sellerId", "firstName lastName businessTag businessName uniqueId image")
                .skip((page - 1) * limit)
                .limit(limit)
                .sort({ createdAt: -1 })
                .lean(),
        ]);

        return res.status(200).json({
            status: true,
            message: "Withdrawal requests fetched successfully!",
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            data: request,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
    }
};

// Approve withdrawal request (Admin)
exports.approveWithdrawalRequest = async (req, res) => {
    try {
        console.log("APPROVE API HIT - Start");
        const requestId = req.body?.requestId || req.query?.requestId;

        if (!requestId) {
            return res.status(400).json({ status: false, message: get_message(1074) });
        }

        const request = await WithDrawRequest.findById(requestId);
        if (!request) {
            return res.status(404).json({ status: false, message: get_message(1175) });
        }

        const sellerAccount = await Seller.findById(request.sellerId).select("isBlock fcmToken netPayout"); // Use ID from request

        if (!sellerAccount) {
            return res.status(404).json({ status: false, message: get_message(1013) });
        }

        if (request.status === 2) {
            return res.status(400).json({ status: false, message: get_message(1176) });
        }

        if (request.status === 3) {
            return res.status(400).json({ status: false, message: get_message(1177) });
        }

        if (sellerAccount.isBlock) {
            return res.status(403).json({ status: false, message: get_message(1017) });
        }

        if (sellerAccount.netPayout < request.amount) {
            return res.status(400).json({ status: false, message: get_message(1178) });
        }

        // 2. Sequential Update to prevent partial failures
        // First, attempt to deduct from Seller (Atomic check & set)
        const sellerUpdate = await Seller.updateOne(
            { _id: sellerAccount._id, netPayout: { $gte: request.amount } },
            {
                $inc: {
                    netPayout: -request.amount,
                    amountWithdrawn: request.amount,
                },
            }
        );

        if (sellerUpdate.modifiedCount === 0) {
            // This happens if netPayout became insufficient in the split second between the read and now
            return res.status(400).json({ status: false, message: get_message(1178) });
        }

        // Only proceed if Seller was successfully updated
        try {
            await SellerWallet.create({
                transactionType: 2,
                sellerId: sellerAccount._id,
                amount: request.amount,
                date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
            });

            await WithDrawRequest.updateOne(
                { _id: request._id },
                {
                    $set: {
                        status: 2,
                        acceptOrDeclineDate: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
                    },
                }
            );

        } catch (txnError) {
            // CRITICAL: If Wallet/Request update fails, we should ideally rollback Seller update
            // manual rollback attempt:
            await Seller.updateOne(
                { _id: sellerAccount._id },
                {
                    $inc: {
                        netPayout: request.amount,
                        amountWithdrawn: -request.amount,
                    },
                }
            );
            throw txnError;
        }

        res.status(200).json({
            status: true,
            message: "Withdrawal request accepted and processed.",
        });

        if (sellerAccount.fcmToken !== null && admin) {
            const payload = {
                token: sellerAccount.fcmToken,
                notification: {
                    title: "🔔 Withdrawal Request Accepted! 🔔",
                    body: "Good news! Your withdrawal request has been accepted and is being processed. Thank you for using our service!",
                },
                data: {
                    type: "WITHDRAWREQUEST",
                },
            };

            try {
                await admin.messaging().send(payload);
                console.log("Notification sent successfully.");
            } catch (notificationError) {
                console.error("Error sending notification:", notificationError);
            }
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: false, message: "Internal Server Error" });
    }
};

// Reject withdrawal request (Admin)
exports.rejectWithdrawalRequest = async (req, res) => {
    try {
        const { requestId, reason } = req.body || {};

        if (!requestId || !reason) {
            return res.status(400).json({ status: false, message: get_message(1179) });
        }

        const trimmedReason = reason.trim();

        const request = await WithDrawRequest.findById(requestId); // Check request first
        if (!request) {
            return res.status(404).json({ status: false, message: get_message(1175) });
        }

        const sellerAccount = await Seller.findById(request.sellerId).select("isBlock fcmToken"); // Get seller from request

        if (request.status === 2) {
            return res.status(400).json({ status: false, message: get_message(1176) });
        }

        if (request.status === 3) {
            return res.status(400).json({ status: false, message: get_message(1177) });
        }

        if (!sellerAccount) {
            return res.status(404).json({ status: false, message: get_message(1013) });
        }

        if (sellerAccount.isBlock) {
            return res.status(403).json({ status: false, message: get_message(1017) });
        }

        await Promise.all([
            WithDrawRequest.updateOne(
                { _id: request._id },
                {
                    $set: {
                        status: 3,
                        reason: trimmedReason,
                        acceptOrDeclineDate: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
                    },
                }
            ),
        ]);

        res.status(200).json({ status: true, message: "Withdrawal Request has been declined by the admin." });

        if (sellerAccount.fcmToken !== null && admin) {
            const payload = {
                token: sellerAccount.fcmToken,
                notification: {
                    title: "🔔 Withdrawal Request Declined! 🔔",
                    body: "We're sorry, but your withdrawal request has been declined. Please contact support for more information.",
                },
                data: {
                    type: "WITHDRAWREQUEST",
                },
            };

            try {
                await admin.messaging().send(payload);
                console.log("Notification sent successfully.");
            } catch (notificationError) {
                console.error("Error sending notification:", notificationError);
            }
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: false, message: "Internal Server Error" });
    }
};
