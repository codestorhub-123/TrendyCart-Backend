const { db } = require('../models/index.model.js');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const RESPONSE = require('../../utils/response.js');
const { get_message } = require('../../utils/message.js');

// fs
const fs = require("fs");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");

// Import models
const User = require("../models/user.model");
const Seller = require("../models/seller.model");
const Address = require("../models/address.model");
const Cart = require("../models/cart.model");
const Favorite = require("../models/favorite.model");
const Follower = require("../models/follower.model");
const LikeHistoryOfReel = require("../models/likeHistoryOfReel.model");
const Notification = require("../models/notification.model");
const Order = require("../models/order.model");
const PromoCodeCheck = require("../models/promoCodeCheck.model");
const Rating = require("../models/rating.model");
const ReportReel = require("../models/reportoReel.model");
const Review = require("../models/review.model");
const SellerRequest = require("../models/sellerRequest.model");
const Reel = require("../models/reel.model");
const LiveSeller = require("../models/liveSeller.model");
const LiveSellingHistory = require("../models/liveSellingHistory.model");
const SellerWallet = require("../models/sellerWallet.model");
const Product = require("../models/product.model");
const ProductRequest = require("../models/productRequest.model");
const AuctionBid = require("../models/auctionBid.model");
const WithdrawRequest = require("../models/withdrawRequest.model");

// Admin Signup
exports.adminSignup = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return RESPONSE.error(res, 400, 1029);
        }
        const existingAdmin = await db.Admin.findOne({ email }).lean();
        if (existingAdmin) {
            return RESPONSE.error(res, 409, 1030);
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const admin = await db.Admin.create({ username, email, password: hashedPassword });

        // Generate JWT token on signup
        const token = jwt.sign({ id: admin._id, email: admin.email, role: 'admin' }, process.env.JWT_SECRET, {
            expiresIn: '7d'
        });

        return RESPONSE.success(res, 201, 1004, { admin, token });
    } catch (err) {
        return RESPONSE.error(res, 500, 9999, err.message);
    }
};

// Admin Login
exports.adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return RESPONSE.error(res, 400, 1018); // or 1029 depending on context
        }
        const admin = await db.Admin.findOne({ email }).lean();
        if (!admin) {
            return RESPONSE.error(res, 401, 1031);
        }
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return RESPONSE.error(res, 401, 1031);
        }
        const token = jwt.sign({ id: admin._id, email: admin.email, role: 'admin' }, process.env.JWT_SECRET, {
            expiresIn: '7d'
        });
        return RESPONSE.success(res, 200, 1006, { admin, token });
    } catch (err) {
        return RESPONSE.error(res, 500, 9999, err.message);
    }
};

//user block or unbolck for admin
exports.blockUnblock = async (req, res) => {
    try {
        if (!req.query.userId) {
            return res.status(400).json({ status: false, massage: get_message(1032) });
        }

        const user = await User.findById(req.query.userId);
        if (!user) {
            return res.status(404).json({ status: false, message: get_message(1019) });
        }

        user.isBlock = !user.isBlock;
        await user.save();

        return res.status(200).json({
            status: true,
            message: "Success",
            user,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: false,
            error: error.message || "Internal Server Error!!",
        });
    }
};

//get all users for admin
exports.getAllUsers = async (req, res) => {
    try {
        const page = req.query.page ? parseInt(req.query.page) : 1;
        const limit = req.query.limit ? parseInt(req.query.limit) : 10;

        const users = await User.aggregate([
            {
                $lookup: {
                    from: "orders",
                    localField: "_id",
                    foreignField: "userId",
                    as: "orders",
                },
            },
            {
                $project: {
                    _id: 1,
                    firstName: 1,
                    lastName: 1,
                    email: 1,
                    dob: 1,
                    gender: 1,
                    location: 1,
                    mobileNumber: 1,
                    image: 1,
                    password: 1,
                    uniqueId: 1,
                    followers: 1,
                    following: 1,
                    isSeller: 1,
                    isBlock: 1,
                    date: 1,
                    loginType: 1,
                    identity: 1,
                    fcmToken: 1,
                    orderCount: { $size: "$orders" },
                },
            },
            {
                $sort: { createdAt: -1 },
            },
            {
                $facet: {
                    totalUsers: [{ $count: "count" }],
                    users: [
                        { $skip: (page - 1) * limit }, //how many records you want to skip
                        { $limit: limit },
                    ],
                },
            },
        ]);

        const totalUsers = users[0].totalUsers[0]?.count || 0;
        const usersData = users[0].users;

        return res.status(200).json({
            status: true,
            message: get_message(1033),
            totalUsers: totalUsers,
            totalPages: Math.ceil(totalUsers / limit),
            currentPage: page,
            users: usersData,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: false,
            error: error.message || "Internal Server error",
        });
    }
};

//delete user account
exports.deleteUserAccount = async (req, res) => {
    try {
        if (!req.query.userId) {
            return res.status(400).json({ status: false, message: get_message(1018) });
        }

        const userId = new mongoose.Types.ObjectId(req.query.userId);

        const [user, userIsSeller] = await Promise.all([User.findById(userId).lean(), Seller.findOne({ userId: userId }).lean()]);

        if (!user) {
            return res.status(404).json({ status: false, message: get_message(1019) });
        }

        res.status(200).json({ status: true, message: get_message(1034) });

        if (user) {
            if (user?.image) {
                const image = user?.image?.split("storage");
                if (image) {
                    const imagePath = "storage" + image[1];
                    if (fs.existsSync(imagePath)) {
                        const imageName = imagePath.split("/").pop();
                        if (imageName !== "erashopUser.png") {
                            fs.unlinkSync(imagePath);
                        }
                    }
                }
            }

            await Promise.all([
                Address.deleteMany({ userId: user?._id }),
                Cart.deleteMany({ userId: user?._id }),
                Favorite.deleteMany({ userId: user?._id }),
                Follower.deleteMany({ userId: user?._id }),
                LikeHistoryOfReel.deleteMany({ userId: user?._id }),
                Notification.deleteMany({ userId: user?._id }),
                Order.deleteMany({ userId: user?._id }),
                PromoCodeCheck.deleteMany({ userId: user?._id }),
                Rating.deleteMany({ userId: user?._id }),
                ReportReel.deleteMany({ userId: user?._id }),
                Review.deleteMany({ userId: user?._id }),
                SellerRequest.deleteMany({ userId: user?._id }),
                AuctionBid.deleteMany({ userId: user?._id }),
            ]);
        }

        if (userIsSeller) {
            if (userIsSeller?.image) {
                const image = userIsSeller?.image.split("storage");
                if (image) {
                    const imagePath = "storage" + image[1];
                    if (fs.existsSync(imagePath)) {
                        const imageName = imagePath.split("/").pop();
                        if (imageName !== "erashopUser.png") {
                            fs.unlinkSync(imagePath);
                        }
                    }
                }
            }

            const [products, reelsToDelete] = await Promise.all([Product.find({ seller: userIsSeller?._id }), Reel.find({ sellerId: userIsSeller?._id })]);

            if (products.length > 0) {
                await Promise.all(products.map(async (product) => {
                    if (product?.mainImage) {
                        const image = product?.mainImage?.split("storage");
                        if (image) {
                            if (fs.existsSync("storage" + image[1])) {
                                fs.unlinkSync("storage" + image[1]);
                            }
                        }
                    }

                    if (product.images) {
                        if (product?.images?.length > 0) {
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
                        Cart.deleteMany({ "items.productId": product?._id }),
                        Order.deleteMany({ "items.productId": product?._id }),
                        Favorite.deleteMany({ productId: product?._id }),
                        Review.deleteMany({ productId: product?._id }),
                        Rating.deleteMany({ productId: product?._id }),
                        ProductRequest.find({ productCode: product?.productCode }),
                        Reel.find({ productId: product?._id }),
                        AuctionBid.deleteMany({ productId: product?._id }),
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
                            await reel.deleteOne();
                        });
                    }

                    await product.deleteOne();
                }));
            }

            if (reelsToDelete.length > 0) {
                await reelsToDelete.map(async (reel) => {
                    if (reel?.thumbnail) {
                        const thumbnail = reel?.thumbnail?.split("storage");
                        if (thumbnail) {
                            if (fs.existsSync("storage" + thumbnail[1])) {
                                fs.unlinkSync("storage" + thumbnail[1]);
                            }
                        }
                    }

                    if (reel?.video) {
                        const video = reel?.video?.split("storage");
                        if (video) {
                            if (fs.existsSync("storage" + video[1])) {
                                fs.unlinkSync("storage" + video[1]);
                            }
                        }
                    }

                    await Promise.all([LikeHistoryOfReel.deleteMany({ reelId: reel?._id }), ReportReel.deleteMany({ reelId: reel?._id })]);
                    await reel.deleteOne();
                });
            }

            await Seller.deleteOne({ userId: user?._id });
        }

        await User.deleteOne({ _id: user?._id });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: false,
            error: error.message || "Internal Server error!!",
        });
    }
};
// get Profile
exports.getProfile = async (req, res) => {
    try {
        const admin = await db.Admin.findById(req.admin.id).select("-password -token");
        if (!admin) {
            return res.status(404).json({ status: false, message: get_message(1035) });
        }
        return res.status(200).json({ status: true, message: "Success", admin });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
    }
};

// update Profile
exports.updateProfile = async (req, res) => {
    try {
        const admin = await db.Admin.findById(req.admin.id);
        if (!admin) {
            return res.status(404).json({ status: false, message: get_message(1035) });
        }

        admin.username = req.body.username ? req.body.username : admin.username;
        admin.email = req.body.email ? req.body.email : admin.email;
        await admin.save();

        return res.status(200).json({ status: true, message: get_message(1036), admin });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
    }
};

// update Image
exports.updateImage = async (req, res) => {
    try {
        const admin = await db.Admin.findById(req.admin.id);
        if (!admin) {
            return res.status(404).json({ status: false, message: get_message(1035) });
        }

        if (!req.file) {
            return res.status(400).json({ status: false, message: "No image file uploaded." });
        }

        if (admin.image) {
            const imageParts = admin.image.split("storage");
            if (imageParts.length > 1) {
                const imagePath = imageParts.pop(); // Get the last part after 'storage'
                if (fs.existsSync(`storage${imagePath}`)) {
                    fs.unlinkSync(`storage${imagePath}`);
                }
            }
        }

        const getApiBase = require("../../utils/getApiBase.js");
        admin.image = getApiBase() + req.file.path.replace(/\\/g, "/");
        await admin.save();

        return res.status(200).json({ status: true, message: get_message(1037), admin });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
    }
};

// forgot Password
exports.forgotPassword = async (req, res) => {
    try {
        if (!req.body.email) {
            return res.status(400).json({ status: false, message: get_message(1038) });
        }

        const admin = await db.Admin.findOne({ email: req.body.email });
        if (!admin) {
            return res.status(404).json({ status: false, message: get_message(1035) });
        }

        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.error("Missing SMTP_USER or SMTP_PASS in environment variables.");
            return res.status(500).json({ status: false, message: "Server configuration error: Email credentials missing." });
        }

        var transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },

        });
        console.log("SMTP_USER:", process.env.SMTP_USER);
        console.log("SMTP_PASS exists:", !!process.env.SMTP_PASS);

        const randomString = Math.random().toString(36).substring(2, 12);
        console.log("Generated Temporary Password:", randomString); // Debug log
        const password = await bcrypt.hash(randomString, 10);

        admin.password = password;
        await admin.save();

        var mailOptions = {
            from: process.env.SMTP_USER,
            to: req.body.email,
            subject: "TrendyCart Admin - Forgot Password",
            html: `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f4;
                    margin: 0;
                    padding: 0;
                }
                .container {
                    max-width: 600px;
                    margin: 20px auto;
                    background-color: #ffffff;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                }
                .header {
                    background-color: #007bff;
                    padding: 10px;
                    text-align: center;
                    color: #ffffff;
                    border-top-left-radius: 8px;
                    border-top-right-radius: 8px;
                }
                .content {
                    padding: 20px;
                    text-align: center;
                }
                .content p {
                    font-size: 16px;
                    line-height: 1.5;
                }
                .footer {
                    margin-top: 20px;
                    text-align: center;
                    font-size: 12px;
                    color: #888;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Password Reset</h1>
                </div>
                <div class="content">
                    <p>Hello,</p>
                    <p>You have requested to reset your password. Here is your temporary password:</p>
                    <p style="font-size: 24px; font-weight: bold; color: #007bff;">${randomString}</p>
                    <p>Please use this password to log in and change it immediately.</p>
                </div>
                <div class="footer">
                    <p>If you didn't request a password reset, please ignore this email.</p>
                </div>
            </div>
        </body>
        </html>`,
        };

        console.log("Password Reset Email details:", {
            to: mailOptions.to,
            from: mailOptions.from,
            subject: mailOptions.subject,
            // html: mailOptions.html // Commented out to avoid cluttering logs, uncomment if needed
        });

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
                return res.status(500).json({ status: false, message: get_message(1040) });
            } else {
                console.log("Email sent to " + req.body.email + ": " + info.response);
                return res.status(200).json({ status: true, message: get_message(1041) });
            }
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
    }
};

// update Password
exports.updatePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(200).json({
                status: false,
                message: get_message(1042),
            });
        }

        // Fetch only password field (faster query)
        const admin = await db.Admin.findById(req.admin.id).select("password");

        if (!admin) {
            return res.status(200).json({
                status: false,
                message: get_message(1035),
            });
        }

        const isMatch = await bcrypt.compare(oldPassword, admin.password);

        if (!isMatch) {
            return res.status(200).json({
                status: false,
                message: get_message(1043),
            });
        }

        // Hash + update
        admin.password = await bcrypt.hash(newPassword, 10);
        await admin.save();

        return res.status(200).json({
            status: true,
            message: get_message(1044),
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: false,
            error: error.message || "Internal Server Error",
        });
    }
};


// set Password
exports.setPassword = async (req, res) => {
    try {
        if (!req.body.password || !req.body.confirmPassword || !req.query.email) {
            return res.status(400).json({ status: false, message: get_message(1045) });
        }

        if (req.body.password !== req.body.confirmPassword) {
            return res.status(400).json({ status: false, message: get_message(1046) });
        }

        const admin = await db.Admin.findOne({ email: req.query.email });
        if (!admin) {
            return res.status(404).json({ status: false, message: get_message(1035) });
        }

        admin.password = await bcrypt.hash(req.body.password, 10);
        await admin.save();

        return res.status(200).json({ status: true, message: "Password updated successfully" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
    }
};

// get top customers
exports.getTopCustomers = async (req, res) => {
    try {
        const topCustomers = await Order.aggregate([
            {
                $group: {
                    _id: "$userId",
                    totalSpent: { $sum: "$finalTotal" },
                    orderCount: { $sum: 1 },
                },
            },
            {
                $sort: { totalSpent: -1 },
            },
            {
                $limit: 10,
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "user",
                },
            },
            {
                $unwind: "$user",
            },
            {
                $project: {
                    _id: 1,
                    totalSpent: 1,
                    orderCount: 1,
                    "user.firstName": 1,
                    "user.lastName": 1,
                    "user.image": 1,
                    "user.email": 1,
                },
            },
        ]);

        return res.status(200).json({ status: true, message: "Success", topCustomers });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
    }
};
