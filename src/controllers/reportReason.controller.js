const ReportReason = require("../models/reportReason.model");
const { get_message } = require("../../utils/message");

exports.getReportreason = async (req, res) => {
    try {
        const start = parseInt(req.query.start) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (start - 1) * limit;

        const [total, reportReason] = await Promise.all([
            ReportReason.countDocuments(),
            ReportReason.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        ]);

        return res.status(200).json({
            status: true,
            message: "Retrive reportReason Successfully",
            total,
            pages: Math.ceil(total / limit),
            currPage: start,
            data: reportReason,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: false, error: error.message || "Internal Server error" });
    }
};

// Create report reason
exports.createReportReason = async (req, res) => {
    try {
        if (!req.body.title) {
            return res.status(400).json({ status: false, message: get_message(1003) });
        }

        const reportReason = new ReportReason();
        reportReason.title = req.body.title.trim();
        await reportReason.save();

        return res.status(200).json({
            status: true,
            message: get_message(1006),
            data: reportReason,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: false, error: error.message || "Internal Server error" });
    }
};

// Update report reason
exports.updateReportReason = async (req, res) => {
    try {
        if (!req.query.reportReasonId) {
            return res.status(400).json({ status: false, message: get_message(1004) });
        }

        const reportReason = await ReportReason.findById(req.query.reportReasonId);
        if (!reportReason) {
            return res.status(404).json({ status: false, message: get_message(1005) });
        }

        reportReason.title = req.body.title ? req.body.title.trim() : reportReason.title;
        await reportReason.save();

        return res.status(200).json({
            status: true,
            message: get_message(1007),
            data: reportReason,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: false, error: error.message || "Internal Server error" });
    }
};

// Delete report reason
exports.deleteReportReason = async (req, res) => {
    try {
        if (!req.query.reportReasonId) {
            return res.status(400).json({ status: false, message: get_message(1004) });
        }

        const reportReason = await ReportReason.findById(req.query.reportReasonId);
        if (!reportReason) {
            return res.status(404).json({ status: false, message: get_message(1005) });
        }

        await reportReason.deleteOne();

        return res.status(200).json({
            status: true,
            message: get_message(1008),
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: false, error: error.message || "Internal Server error" });
    }
};
