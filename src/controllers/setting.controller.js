const Setting = require("../models/setting.model");
const { get_message } = require("../../utils/message");

// GET SETTING
exports.getSetting = async (req, res) => {
    try {
        if (!global.settingJSON || Object.keys(global.settingJSON).length === 0) {
            return res.status(404).json({ status: false, message: get_message(1171) });
        }

        return res.status(200).json({ status: true, message: "Success", setting: global.settingJSON });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
    }
};

// UPDATE SETTING
exports.update = async (req, res) => {
    try {
        if (!req.query.settingId) return res.status(400).json({ status: false, message: get_message(1074) });

        const setting = await Setting.findById(req.query.settingId);
        if (!setting) {
            return res.status(404).json({ status: false, message: get_message(1167) });
        }

        setting.paymentGateway = req.body.paymentGateway ? req.body.paymentGateway : setting.paymentGateway;
        setting.privacyPolicyLink = req.body.privacyPolicyLink ? req.body.privacyPolicyLink : setting.privacyPolicyLink;
        setting.privacyPolicyText = req.body.privacyPolicyText ? req.body.privacyPolicyText : setting.privacyPolicyText;
        setting.termsAndConditionsLink = req.body.termsAndConditionsLink ? req.body.termsAndConditionsLink : setting.termsAndConditionsLink;
        setting.termsAndConditionsText = req.body.termsAndConditionsText ? req.body.termsAndConditionsText : setting.termsAndConditionsText;
        setting.zegoAppId = req.body.zegoAppId ? req.body.zegoAppId : setting.zegoAppId;
        setting.zegoAppSignIn = req.body.zegoAppSignIn ? req.body.zegoAppSignIn : setting.zegoAppSignIn;
        setting.stripePublishableKey = req.body.stripePublishableKey ? req.body.stripePublishableKey : setting.stripePublishableKey;
        setting.stripeSecretKey = req.body.stripeSecretKey ? req.body.stripeSecretKey : setting.stripeSecretKey;
        setting.razorPayId = req.body.razorPayId ? req.body.razorPayId : setting.razorPayId;
        setting.razorSecretKey = req.body.razorSecretKey ? req.body.razorSecretKey : setting.razorSecretKey;
        setting.resendApiKey = req.body.resendApiKey ? req.body.resendApiKey : setting.resendApiKey;
        setting.openaiApiKey = req.body.openaiApiKey ? req.body.openaiApiKey?.trim() : setting.openaiApiKey;
        setting.adminCommissionCharges = parseInt(req.body.adminCommissionCharges) ? parseInt(req.body.adminCommissionCharges) : setting.adminCommissionCharges;
        setting.cancelOrderCharges = parseInt(req.body.cancelOrderCharges) ? parseInt(req.body.cancelOrderCharges) : setting.cancelOrderCharges;

        setting.paymentReminderForLiveAuction = parseInt(req.body.paymentReminderForLiveAuction) ? parseInt(req.body.paymentReminderForLiveAuction) : setting.paymentReminderForLiveAuction;
        setting.paymentReminderForManualAuction = parseInt(req.body.paymentReminderForManualAuction) ? parseInt(req.body.paymentReminderForManualAuction) : setting.paymentReminderForManualAuction;
        setting.minPayout = parseInt(req.body.minPayout) ? parseInt(req.body.minPayout) : setting.minPayout;

        setting.withdrawCharges = parseInt(req.body.withdrawCharges) ? parseInt(req.body.withdrawCharges) : setting.withdrawCharges;
        setting.withdrawLimit = parseInt(req.body.withdrawLimit) ? parseInt(req.body.withdrawLimit) : setting.withdrawLimit;
        setting.flutterWaveId = req.body.flutterWaveId ? req.body.flutterWaveId : setting.flutterWaveId;
        setting.privateKey = req.body.privateKey ? JSON.parse(req.body.privateKey.trim()) : setting.privateKey;
        await setting.save();

        updateSettingFile(setting);

        return res.status(200).json({
            status: true,
            message: "Setting Updated Successfully!",
            setting,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: false, error: error.message || "Internal Server Error!!" });
    }
};

// HANDLE SWITCH (e.g., isFakeData)
exports.handleSwitch = async (req, res) => {
    try {
        if (!req.query.settingId || !req.query.type) return res.status(400).json({ status: false, message: get_message(1074) });

        const setting = await Setting.findById(req.query.settingId);
        if (!setting) {
            return res.status(404).json({ status: false, message: get_message(1167) });
        }

        if (req.query.type === "stripe") {
            setting.stripeSwitch = !setting.stripeSwitch;
        } else if (req.query.type === "razorPay") {
            setting.razorPaySwitch = !setting.razorPaySwitch;
        } else if (req.query.type === "flutterWave") {
            setting.flutterWaveSwitch = !setting.flutterWaveSwitch;
        } else if (req.query.type === "productRequest") {
            setting.isAddProductRequest = !setting.isAddProductRequest;
        } else if (req.query.type === "updateProductRequest") {
            setting.isUpdateProductRequest = !setting.isUpdateProductRequest;
        } else if (req.query.type === "isFakeData") {
            setting.isFakeData = !setting.isFakeData;
        } else if (req.query.type === "isCashOnDelivery") {
            setting.isCashOnDelivery = !setting.isCashOnDelivery;
        } else {
            return res.status(400).json({ status: false, message: get_message(1121) });
        }

        await setting.save();

        updateSettingFile(setting);

        return res.status(200).json({ status: true, message: "Success", setting });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: false,
            error: error.message || "Internal Server Error!!",
        });
    }
};

// HANDLE FIELD SWITCH (isActive / isRequired for documents)
exports.handleFieldSwitch = async (req, res) => {
    try {
        const { settingId, field, toggleType } = req.query;

        if (!settingId || !field || !toggleType) {
            return res.status(400).json({ status: false, message: get_message(1166) });
        }

        const setting = await Setting.findById(settingId);
        if (!setting) {
            return res.status(404).json({ status: false, message: get_message(1167) });
        }

        const validFields = ["addressProof", "govId", "registrationCert"];
        const validToggles = ["isActive", "isRequired"];

        if (!validFields.includes(field) || !validToggles.includes(toggleType)) {
            return res.status(400).json({ status: false, message: get_message(1168) });
        }

        setting[field][toggleType] = !setting[field][toggleType];

        await setting.save();
        updateSettingFile(setting);

        return res.status(200).json({ status: true, message: `${toggleType} toggled for ${field}`, setting });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: false,
            error: error.message || "Internal Server Error!",
        });
    }
}
