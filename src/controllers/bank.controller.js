const Bank = require("../models/bank.model");
const { deleteFile } = require("../../utils/deleteFile");
const mongoose = require("mongoose");
const { get_message } = require("../../utils/message");


exports.create = async (req, res) => {
    try {
        if (!req.body.name.trim()) {
            return res.status(400).json({ status: false, message: get_message(1020) });
        }

        const bank = new Bank();
        bank.name = req.body.name.trim();
        await bank.save();

        return res.status(200).json({ status: true, message: get_message(1068), bank: bank });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: false, error: error.message || "Internal Server error" });
    }
};

exports.update = async (req, res) => {
    try {
        if (!req.query.bankId) {
            return res.status(400).json({ status: false, message: get_message(1069) });
        }

        const bank = await Bank.findById(req.query.bankId);
        if (!bank) {
            return res.status(404).json({ status: false, message: get_message(1070) });
        }

        bank.name = req.body.name.trim() ? req.body.name.trim() : bank.name.trim();
        await bank.save();

        return res.status(200).json({ status: true, message: get_message(1071), bank: bank });
    } catch (error) {
        if (req.file) deleteFile(req.file);
        console.log(error);
        return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
    }
};

exports.getBanks = async (req, res) => {
    try {
        const bank = await Bank.find().sort({ createdAt: -1 }).lean();

        return res.status(200).json({ status: true, message: get_message(1072), bank: bank });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
    }
};

exports.delete = async (req, res) => {
    try {
        const { bankId } = req.query;

        if (!bankId) {
            return res.status(200).json({
                status: false,
                message: get_message(1069)
            });
        }

        // ✅ Prevent slow Mongo scan on invalid ObjectId
        if (!mongoose.Types.ObjectId.isValid(bankId)) {
            return res.status(200).json({
                status: false,
                message: get_message(1070)
            });
        }

        // ✅ SINGLE fast DB call
        const bank = await Bank.findByIdAndDelete(bankId).lean();

        if (!bank) {
            return res.status(200).json({
                status: false,
                message: get_message(1070)
            });
        }

        // ✅ SAME response as before
        return res.status(200).json({
            status: true,
            message: get_message(1073),
            bank: bank
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: false,
            error: error.message || "Internal Server Error"
        });
    }
};
