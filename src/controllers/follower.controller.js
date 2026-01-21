const mongoose = require("mongoose");
const User = require("../models/user.model");
const Seller = require("../models/seller.model");
const Follower = require("../models/follower.model");
const admin = require("../../utils/firebase");
const { get_message } = require("../../utils/message");

exports.followUnfollow = async (req, res) => {
    try {
        if (!req.body.sellerId) {
            return res.status(400).json({ status: false, message: get_message(1074) });
        }

        const user = new mongoose.Types.ObjectId(req.user.id);
        const seller = new mongoose.Types.ObjectId(req.body.sellerId);

        const [userId, sellerId, follow] = await Promise.all([
            User.findById(user),
            Seller.findById(seller),
            Follower.findOne({
                userId: user,
                sellerId: seller,
            }),
        ]);

        if (!userId) {
            return res.status(404).json({ status: false, message: get_message(1019) });
        }

        if (userId.isBlock) {
            return res.status(403).json({ status: false, message: get_message(1017) });
        }

        if (!sellerId) {
            return res.status(404).json({ status: false, message: get_message(1013) });
        }

        if (follow) {
            res.status(200).json({
                status: true,
                message: "Unfollow successfully!",
                isFollow: false,
            });

            await Promise.all([
                Follower.deleteOne({ userId: userId._id, sellerId: sellerId._id }),
                User.updateOne({ _id: userId._id, following: { $gt: 0 } }, { $inc: { following: -1 } }),
                Seller.updateOne({ _id: sellerId._id, followers: { $gt: 0 } }, { $inc: { followers: -1 } }),
            ]);
        } else {
            res.status(200).send({
                status: true,
                message: "follow Successfully!",
                isFollow: true,
            });

            const follower = new Follower({
                userId: userId._id,
                sellerId: sellerId._id,
            });

            await Promise.all([follower.save(), userId.updateOne({ $inc: { following: 1 } }), sellerId.updateOne({ $inc: { followers: 1 } })]);

            //notification related
            if (!sellerId.isBlock && sellerId.fcmToken !== null && admin) {
                const payload = {
                    token: sellerId.fcmToken,
                    notification: {
                        title: `${userId.firstName} started following you!`,
                    },
                    data: {
                        data: userId._id.toString(),
                        type: "USER",
                    },
                };

                admin
                    .messaging()
                    .send(payload)
                    .then((response) => {
                        console.log("Successfully sent with response: ", response);
                    })
                    .catch((error) => {
                        console.log("Error sending message:      ", error);
                    });
            }
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
    }
};

exports.getSellerFollowers = async (req, res) => {
    try {
        if (!req.query.sellerId) {
            const messageText = "sellerId is required.";
            return res.status(400).json({ status: false, message: get_message(1011) });
        }

        const sellerId = new mongoose.Types.ObjectId(req.query.sellerId);

        const [seller, rawFollowerList] = await Promise.all([
            Seller.findOne({ _id: sellerId }).select("_id isBlock").lean(),
            Follower.find({ sellerId: sellerId }).populate("userId", "_id firstName lastName image").sort({ createdAt: -1 }),
        ]);

        const followerList = rawFollowerList.filter(item => item.userId !== null);

        if (!seller) {
            return res.status(404).json({ status: false, message: get_message(1013) });
        }

        if (seller.isBlock) {
            return res.status(403).json({ status: false, message: get_message(1107) });
        }

        return res.status(200).json({
            status: true,
            message: "Seller followers retrieved successfully.",
            followerList,
        });
    } catch (error) {
        console.error(error);
        const messageText = error.message || "Internal Server Error";
        return res.status(500).json({ status: false, message: messageText });
    }
};
