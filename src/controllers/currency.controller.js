const Currency = require("../models/currency.model");
const { get_message } = require("../../utils/message");

exports.fetchCurrencies = async (req, res) => {
    try {
        const currency = await Currency.find().sort({ createdAt: -1 });

        return res.status(200).json({
            status: true,
            message: get_message(1091),
            data: currency,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
    }
};

exports.getDefaultCurrency = async (req, res) => {
    try {
        const currency = await Currency.findOne({ isDefault: true });

        return res.status(200).json({
            status: true,
            message: get_message(1091),
            data: currency,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
    }
};
exports.storeCurrency = async (req, res) => {
    try {
        const { name, symbol, countryCode, currencyCode } = req.body;

        if (!name || !symbol || !currencyCode) {
            return res.status(400).json({ status: false, message: get_message(1092) });
        }

        const currency = new Currency();
        currency.name = name;
        currency.symbol = symbol;
        currency.countryCode = countryCode || "";
        currency.currencyCode = currencyCode;

        await currency.save();

        return res.status(200).json({
            status: true,
            message: get_message(1093),
            data: currency,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
    }
};

exports.updateCurrency = async (req, res) => {
    try {
        const { currencyId } = req.query;
        if (!currencyId) {
            return res.status(400).json({ status: false, message: get_message(1094) });
        }

        const currency = await Currency.findByIdAndUpdate(currencyId, { $set: req.body }, { new: true });

        if (!currency) {
            return res.status(404).json({ status: false, message: get_message(1095) });
        }

        return res.status(200).json({
            status: true,
            message: get_message(1096),
            data: currency,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
    }
};

exports.deleteCurrency = async (req, res) => {
    try {
        const { currencyId } = req.query;
        if (!currencyId) {
            return res.status(400).json({ status: false, message: get_message(1094) });
        }

        const currency = await Currency.findById(currencyId);
        if (!currency) {
            return res.status(404).json({ status: false, message: get_message(1095) });
        }

        if (currency.isDefault) {
            return res.status(400).json({ status: false, message: get_message(1097) });
        }

        await currency.deleteOne();

        return res.status(200).json({
            status: true,
            message: get_message(1098),
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
    }
};

exports.setDefaultCurrency = async (req, res) => {
    try {
        const { currencyId } = req.query;
        if (!currencyId) {
            return res.status(400).json({ status: false, message: get_message(1094) });
        }

        const currency = await Currency.findById(currencyId);
        if (!currency) {
            return res.status(404).json({ status: false, message: get_message(1095) });
        }

        // Unset previous default
        await Currency.updateMany({ isDefault: true }, { $set: { isDefault: false } });

        // Set new default
        currency.isDefault = true;
        await currency.save();

        return res.status(200).json({
            status: true,
            message: get_message(1099),
            data: currency,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
    }
};
