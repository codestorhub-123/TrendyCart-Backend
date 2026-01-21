const User = require("../models/user.model");
const Reel = require("../models/reel.model");
const ReportoReel = require("../models/reportoReel.model");
const LikeHistoryOfReel = require("../models/likeHistoryOfReel.model");
const fs = require("fs");
const admin = require("../../utils/firebase");
const { get_message } = require("../../utils/message");

exports.reportReel = async (req, res) => {
    try {
        if (!req.body.userId || !req.body.reelId || !req.body.description) {
            return res.status(400).json({ status: false, message: get_message(1074) });
        }

        const [user, reel] = await Promise.all([User.findById(req?.body?.userId), Reel.findOne({ _id: req?.body?.reelId })]);

        if (!user) {
            return res.status(404).json({ status: false, message: get_message(1019) });
        }

        if (!reel) {
            return res.status(404).json({ satus: false, message: get_message(1141) });
        }

        res.status(200).json({ status: true, message: "Report to particular reel by the user." });

        const reportoReel = new ReportoReel();
        reportoReel.userId = user?._id;
        reportoReel.reelId = reel?._id;
        reportoReel.status = 1;
        reportoReel.description = req?.body?.description;
        reportoReel.reportDate = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
        await reportoReel.save();

        // if (!user.isBlock && user.fcmToken && user.fcmToken !== null) {
        //     const payload = {
        //         token: user.fcmToken,
        //         notification: {
        //             title: "✅ Report Received!",
        //             body: "📬 We’ve logged your report and our support team is on it. You’ll hear back from us shortly. Thanks for helping us improve! 🙌",
        //         },
        //         data: {
        //             type: "REPORT_SUBMITTED",
        //         },
        //     };
        // }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
    }
};

exports.reportsOfReel = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.max(1, parseInt(req.query.limit) || 10);
        let status = req.query.status; // Get raw status

        if (status === "Pending") {
            status = 1;
        } else if (status === "Solved") {
            status = 2;
        } else {
            status = parseInt(status);
        }

        const filter = {};
        if (status === 1 || status === 2) {
            filter.status = status;
        }

        const [totalReportOfReels, reportOfReels] = await Promise.all([
            ReportoReel.countDocuments(filter),
            ReportoReel.find(filter)
                .populate("reelId", "video videoType thumbnail thumbnailType")
                .populate("userId", "firstName lastName image uniqueId")
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
        ]);

        return res.status(200).json({
            status: true,
            message: reportOfReels.length > 0 ? "Reports of the reels retrieved successfully." : "No reports of reels found.",
            totalReportOfReels,
            totalPages: Math.ceil(totalReportOfReels / limit),
            currentPage: page,
            reportOfReels,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
    }
};

exports.resolveReport = async (req, res) => {
    try {
        const { reportId } = req.query;
        if (!reportId) {
            return res.status(400).json({ status: false, message: get_message(1149) });
        }

        const report = await ReportoReel.findOneAndUpdate(
            { _id: reportId, status: { $ne: 2 } },
            { $set: { status: 2 } },
            { new: true }
        );

        if (!report) {
            const existing = await ReportoReel.findById(reportId);
            if (!existing) {
                return res.status(404).json({ status: false, message: get_message(1150) });
            }
            return res.status(400).json({ status: false, message: get_message(1151) });
        }


        const user = await User.findById(report.userId).select("_id isBlock fcmToken").lean();

        if (user && !user.isBlock && user.fcmToken) {
            const payload = {
                token: user.fcmToken,
                notification: {
                    title: "✅ Issue Resolved Successfully",
                    body: "📩 Thank you for your report. The issue in the short video has been reviewed and resolved. We appreciate your continued support. 🤝",
                },
                data: {
                    type: "REPORT_SOLVED",
                },
            };

            try {
                const firebaseAdmin = await admin;
                if (firebaseAdmin) {
                    firebaseAdmin.messaging().send(payload).catch(console.error);
                }
            } catch (err) {
                console.error("Firebase admin error:", err);
            }
        }

        return res.status(200).send({
            status: true,
            message: "Report has been solved by the admin.",
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
    }
};

exports.deleteReport = async (req, res) => {
    try {
        const { reportId } = req.query;

        if (!reportId) {
            return res.status(400).json({
                status: false,
                message: get_message(1149),
            });
        }

        const report = await ReportoReel.findById(reportId);

        if (!report) {
            return res.status(200).json({
                status: false,
                message: get_message(1150),
            });
        }

        await report.deleteOne();

        return res.status(200).json({
            status: true,
            message: "Report has been deleted.",
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: false,
            message: error.message || "Internal Server Error",
        });
    }
};
