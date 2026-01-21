const User = require("../models/user.model");
const Product = require("../models/product.model");
const Review = require("../models/review.model");
const Notification = require("../models/notification.model");
// const admin = require("../../utils/firebase");
const moment = require("moment");
const { get_message } = require("../../utils/message");

exports.create = async (req, res) => {
    try {
        if (!req.body.userId || !req.body.productId || !req.body.review) {
            return res.status(400).json({ status: false, message: get_message(1074) });
        }

        const [user, product, reviewExist] = await Promise.all([
            User.findById(req.body.userId),
            Product.findOne({ _id: req.body.productId }).populate("seller", "isBlock fcmToken"),
            Review.findOne({ userId: req.body.userId, productId: req.body.productId }),
        ]);

        if (!user) {
            return res.status(404).json({ status: false, message: get_message(1019) });
        }

        if (!product) {
            return res.status(404).json({ status: false, message: get_message(1059) });
        }

        if (reviewExist) {
            return res.status(200).json({
                status: false,
                message: get_message(1144),
            });
        }

        const review = new Review();

        review.userId = user._id;
        review.productId = product._id;
        review.review = req.body.review;
        review.date = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });

        product.review += 1;

        await Promise.all([review.save(), product.save()]);

        res.status(200).json({
            status: true,
            message: "Review given by the user for products!",
            review,
        });

        // if (!product?.seller?.isBlock && product?.seller?.fcmToken !== null) {
        //     const payload = {
        //         token: product.seller.fcmToken,
        //         notification: {
        //             title: `Product Review`,
        //             message: `Feedback Received from ${user.firstName} for Your Order!`,
        //         },
        //     };

        //     const adminPromise = await admin;
        //     adminPromise
        //         .messaging()
        //         .send(payload)
        //         .then(async (response) => {
        //             console.log("Successfully sent with response: ", response);

        //             const notification = new Notification();
        //             notification.userId = user._id;
        //             notification.image = user.image;
        //             notification.sellerId = product.seller;
        //             notification.title = payload.notification.title;
        //             notification.message = payload.notification.message;
        //             notification.notificationType = 3;
        //             notification.date = moment(new Date());
        //             await notification.save();
        //         })
        //         .catch((error) => {
        //             console.log("Error sending message:      ", error);
        //         });
        // }
    } catch (error) {
        console.log(error);
        return res.status(200).json({ status: false, error: error.message || "Internal Server Error" });
    }
};

exports.getgetReviews = async (req, res) => {
    try {
        const productId = req.query.productId;
        const page = req.query.page ? parseInt(req.query.page) : 1;
        const limit = req.query.limit ? parseInt(req.query.limit) : 20;

        if (!productId) {
            return res.status(400).json({ status: false, message: get_message(1074) });
        }

        const [reviews, total] = await Promise.all([
            Review.find({ productId })
                .populate("userId", "firstName lastName image email")
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            Review.countDocuments({ productId }),
        ]);

        return res.status(200).json({
            status: true,
            message: "Retrived Reviews Successfully",
            total: total,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            review: reviews,
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
    }
};

exports.delete = async (req, res) => {
    try {
        const reviewId = req.query.reviewId;
        if (!reviewId) {
            return res.status(400).json({ status: false, message: get_message(1145) });
        }

        const review = await Review.findByIdAndDelete(reviewId);
        if (!review) {
            return res.status(404).json({ status: false, message: get_message(1146) });
        }

        if (review.productId) {
            await Product.updateOne(
                { _id: review.productId, review: { $gt: 0 } },
                { $inc: { review: -1 } }
            );
        }

        return res.status(200).json({ status: true, message: "Review deleted successfully by Admin!" });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
    }
};
