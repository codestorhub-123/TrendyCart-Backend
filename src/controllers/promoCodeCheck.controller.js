const PromoCode = require("../models/promocode.model");
const User = require("../models/user.model");
const PromoCodeCheck = require("../models/promoCodeCheck.model");

exports.checkPromoCode = async (req, res) => {
    try {
        if (!req.body.promocodeId || !req.body.userId) {
            return res.status(200).json({ status: false, message: "Oops ! Invalid details." });
        }

        const [promoCode, user, promoCodeCheck] = await Promise.all([
            PromoCode.findOne({ _id: req.body.promocodeId }),
            User.findOne({ _id: req.body.userId, isBlock: false }),
            PromoCodeCheck.findOne({ promoCodeId: req.body.promocodeId, userId: req.body.userId }),
        ]);

        if (!promoCode) {
            return res.status(200).json({ status: false, message: "promoCode does not found." });
        }

        if (!user) {
            return res.status(200).json({ status: false, message: "user does not found." });
        }

        if (promoCodeCheck) {
            return res.status(200).json({
                status: false,
                message: "you are not able to use that promoCode because that promoCode already used by this user!",
            });
        } else {
            return res.status(200).json({
                status: true,
                message: "you are able to use that promoCode!",
            });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
    }
};
