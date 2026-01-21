const Withdraw = require("../models/withdraw.model");
const WithdrawRequest = require("../models/withdrawRequest.model");
const fs = require("fs");
const { deleteFile } = require("../../utils/deleteFile");
const { get_message } = require("../../utils/message");

const getApiBase = require("../../utils/getApiBase");

const config = { baseURL: getApiBase() };

// ==========================
// USER API IMPLEMENTATION (Restored & Fixed)
// ==========================

// Create withdrawal method
exports.create = async (req, res) => {
    try {
        if (!req.file || !req.body.name || !req.body.details) {
            if (req.file) deleteFile(req.file);
            return res.status(400).json({ status: false, message: get_message(1074) });
        }

        const withdraw = new Withdraw();

        withdraw.name = req.body.name;

        // Parse details: Try JSON, fallback to comma-split
        let detailsArr;
        try {
            detailsArr = JSON.parse(req.body.details);
        } catch (error) {
            detailsArr = req.body.details.split(",");
        }
        withdraw.details = detailsArr;

        withdraw.image = config.baseURL + req.file.path.replace(/\\/g, "/");
        await withdraw.save();

        return res.status(200).json({
            status: true,
            message: "withdraw method create successfully.",
            withdraw,
        });
    } catch (error) {
        if (req.file) deleteFile(req.file);
        console.log(error);
        return res.status(500).json({
            status: false,
            error: error.message || "Internal Server Error",
        });
    }
};

// Update withdrawal method
exports.update = async (req, res) => {
    try {
        if (!req.query.withdrawId || req.query.withdrawId === "undefined" || !require('mongoose').Types.ObjectId.isValid(req.query.withdrawId)) {
            if (req.file) deleteFile(req.file);
            return res.status(400).json({ status: false, message: get_message(1074) });
        }

        const withdraw = await Withdraw.findById(req.query.withdrawId);
        if (!withdraw) {
            if (req.file) deleteFile(req.file);
            return res.status(404).json({ status: false, message: get_message(1170) });
        }

        if (req.file) {
            const image = withdraw?.image?.split("storage");
            if (image) {
                if (fs.existsSync("storage" + image[1])) {
                    fs.unlinkSync("storage" + image[1]);
                }
            }

            withdraw.image = config.baseURL + req.file.path.replace(/\\/g, "/");
        }

        withdraw.name = req.body.name ? req.body.name : withdraw.name;
        // Parse details: Try JSON, fallback to comma-split
        if (req.body.details) {
            let detailsArr;
            try {
                detailsArr = JSON.parse(req.body.details);
            } catch (error) {
                detailsArr = req.body.details.split(",");
            }
            withdraw.details = detailsArr;
        }
        await withdraw.save();

        return res.status(200).json({
            status: true,
            message: "withdraw method update successfully.",
            withdraw,
        });
    } catch (error) {
        console.log(error);
        if (req.file) deleteFile(req.file);
        return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
    }
};

// Get withdrawal methods
exports.getWithdrawRequests = async (req, res) => {
    try {
        const withdraw = await Withdraw.find().sort({ createdAt: -1 });

        return res.status(200).json({ status: true, message: "data get successfully", withdraw });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
    }
};

// Delete withdrawal method
exports.delete = async (req, res) => {
    try {
        if (!req.query.withdrawId || req.query.withdrawId === "undefined" || !require('mongoose').Types.ObjectId.isValid(req.query.withdrawId)) {
            return res.status(400).json({ status: false, message: get_message(1074) });
        }

        const withdraw = await Withdraw.findById(req.query.withdrawId);
        if (!withdraw) {
            return res.status(404).json({ status: false, message: get_message(1170) });
        }

        const image = withdraw?.image?.split("storage");
        if (image) {
            if (fs.existsSync("storage" + image[1])) {
                fs.unlinkSync("storage" + image[1]);
            }
        }

        await withdraw.deleteOne();

        return res.status(200).json({ status: true, message: "data deleted successfully." });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: false,
            error: error.message || "Internal Server Error",
        });
    }
};

// ==========================
// ADMIN API IMPLEMENTATION (New)
// ==========================

exports.listWithdrawalRequests = async (req, res) => {
    // TODO: Implement logic
    return res.status(200).json({ status: true, message: "List of withdrawal requests" });
};

exports.approveWithdrawalRequest = async (req, res) => {
    // TODO: Implement logic
    return res.status(200).json({ status: true, message: "Withdrawal request approved" });
};

exports.rejectWithdrawalRequest = async (req, res) => {
    // TODO: Implement logic
    return res.status(200).json({ status: true, message: "Withdrawal request rejected" });
};

// Get active withdrawal list
exports.withdrawalList = async (req, res) => {
    try {
        const withdraw = await Withdraw.find({ isEnabled: true }).sort({ createdAt: -1 }).lean();

        return res.status(200).json({ status: true, message: "finally, get withdrawal list added by admin!", withdraw });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
    }
};

// Toggle enable/disable status
exports.handleSwitch = async (req, res) => {
    try {
        if (!req.query.withdrawId) return res.status(400).json({ status: false, message: get_message(1074) });

        const withdraw = await Withdraw.findById(req.query.withdrawId);
        if (!withdraw) {
            return res.status(404).json({ status: false, message: get_message(1170) });
        }

        withdraw.isEnabled = !withdraw.isEnabled;
        await withdraw.save();

        return res.status(200).json({ status: true, message: "Success", withdraw });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: false,
            error: error.message || "Internal Server Error!!",
        });
    }
};
