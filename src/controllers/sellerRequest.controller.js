const SellerRequest = require("../models/sellerRequest.model");
const Request = SellerRequest; // Alias for code compatibility
const Seller = require("../models/seller.model");
const User = require("../models/user.model");
const SellerWallet = require("../models/sellerWallet.model");
const { deleteFile, deleteFiles } = require("../../utils/deleteFile");
const { get_message } = require("../../utils/message");
const fs = require("fs");
// const admin = require("firebase-admin");

// Get all seller requests
exports.getAll = async (req, res) => {
    try {
        const start = parseInt(req.query.start) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (start - 1) * limit;

        const [requests, totalRequests] = await Promise.all([
            Request.find({ isAccepted: false }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            Request.countDocuments({ isAccepted: false })
        ]);

        return res.status(200).json({
            status: true,
            message: "Seller requests retrieved successfully",
            totalRequests,
            requests
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: false,
            message: error.message || "Internal Server Error",
        });
    }
};

// Update seller request
exports.updateRequest = async (req, res) => {
    try {
        const requestId = req.query.sellerRequestId || req.query.requestId;
        const request = await Request.findById(requestId);
        if (!request) {
            if (req.file) deleteFile(req.file);
            return res.status(404).json({ status: false, message: get_message(1152) });
        }

        if (req.file) {
            const image = request.image.split("storage");

            if (image) {
                if (fs.existsSync("storage" + image[1])) {
                    fs.unlinkSync("storage" + image[1]);
                }

                request.image = "/storage/" + req.file.filename;
            }
        }

        if (req.body.firstName !== undefined) request.firstName = req.body.firstName;
        if (req.body.lastName !== undefined) request.lastName = req.body.lastName;
        if (req.body.gender !== undefined) request.gender = req.body.gender;
        if (req.body.countryCode !== undefined) request.countryCode = req.body.countryCode;
        if (req.body.mobileNumber !== undefined) request.mobileNumber = req.body.mobileNumber;
        if (req.body.businessName !== undefined) request.businessName = req.body.businessName;
        if (req.body.businessTag !== undefined) request.businessTag = req.body.businessTag;

        //Update the seller's address fields add
        if (req.body.address !== undefined) request.address.address = req.body.address;
        if (req.body.landMark !== undefined) request.address.landMark = req.body.landMark;
        if (req.body.city !== undefined) request.address.city = req.body.city;
        if (req.body.pinCode !== undefined) request.address.pinCode = parseInt(req.body.pinCode);
        if (req.body.state !== undefined) request.address.state = req.body.state;
        if (req.body.country !== undefined) request.address.country = req.body.country;

        //Update the seller's bankDetails fields
        if (req.body.bankBusinessName !== undefined) request.bankDetails.bankBusinessName = req.body.bankBusinessName;
        if (req.body.bankName !== undefined) request.bankDetails.bankName = req.body.bankName;
        if (req.body.accountNumber !== undefined) request.bankDetails.accountNumber = parseInt(req.body.accountNumber);
        if (req.body.IFSCCode !== undefined) request.bankDetails.IFSCCode = req.body.IFSCCode;
        if (req.body.branchName !== undefined) request.bankDetails.branchName = req.body.branchName;

        await request.save();

        return res.status(200).json({
            status: true,
            message: "request updated by admin.",
            request: request,
        });
    } catch (error) {
        console.log(error);
        if (req.file) deleteFile(req.file);
        return res.status(500).json({
            status: false,
            message: error.message || "Internal Server Error",
        });
    }
};

// Accept or decline seller request
exports.acceptOrNot = async (req, res) => {
    try {
        const requestId = req.query.sellerRequestId || req.query.requestId;
        const request = await Request.findById(requestId);
        if (!request) {
            return res.status(404).json({ status: false, message: get_message(1152) });
        }

        if (request.isAccepted === true) {
            return res.status(400).json({ status: false, message: get_message(1153) });
        }

        if (req.query.action === 'decline') {
            await request.deleteOne();
            return res.status(200).json({ status: true, message: "Seller request declined successfully!" });
        }

        const seller = new Seller();
        let user = await User.findById(request.userId);

        // Fallback 1: search by email
        if (!user && request.email) {
            user = await User.findOne({ email: request.email.trim() });
        }

        // Fallback 2: search by mobileNumber
        if (!user && request.mobileNumber) {
            user = await User.findOne({ mobileNumber: request.mobileNumber.trim() });
        }

        // Final Fallback: Create user if not found at all
        if (!user) {
            console.log("Creating new user as fallback for seller request...");
            user = new User({
                firstName: request.firstName || "",
                lastName: request.lastName || "",
                email: request.email || "",
                mobileNumber: request.mobileNumber || "",
                password: request.password || null, // Assuming it's already encrypted if from a secure source, else plain
                gender: request.gender || "male",
                image: request.image || null,
                uniqueId: request.uniqueId || Math.floor(Math.random() * 100000000).toString(),
                loginType: request.email ? 3 : 5,
                date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
            });
            await user.save();
        }

        request.isAccepted = true;
        if (!request.userId) request.userId = user._id;

        user.isSeller = true;
        user.seller = seller?._id;

        seller.firstName = request.firstName;
        seller.lastName = request.lastName;
        seller.businessName = request.businessName;
        seller.businessTag = request.businessTag;
        seller.mobileNumber = request.mobileNumber;
        seller.image = request.image;
        seller.gender = request.gender;
        seller.email = request.email;
        seller.password = request.password;
        seller.fcmToken = request.fcmToken;
        seller.identity = user.identity || request.uniqueId;
        seller.uniqueId = user.uniqueId;
        seller.date = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });

        //seller's address fields
        seller.address.address = request.address.address;
        seller.address.landMark = request.address.landMark;
        seller.address.city = request.address.city;
        seller.address.pinCode = request.address.pinCode;
        seller.address.state = request.address.state;
        seller.address.country = request.address.country;

        //seller's bankDetails fields
        seller.bankDetails.bankBusinessName = request.bankDetails.bankBusinessName;
        seller.bankDetails.bankName = request.bankDetails.bankName;
        seller.bankDetails.accountNumber = request.bankDetails.accountNumber;
        seller.bankDetails.IFSCCode = request.bankDetails.IFSCCode;
        seller.bankDetails.branchName = request.bankDetails.branchName;

        seller.storeName = request?.storeName;
        seller.businessType = request?.businessType;
        seller.category = request?.category;
        seller.logo = request?.logo;
        seller.description = request?.description;
        seller.govId = request?.govId;
        seller.registrationCert = request?.registrationCert;
        seller.addressProof = request?.addressProof;

        seller.userId = user?._id;

        await Promise.all([request.save(), user.save(), seller.save()]);

        res.status(200).json({
            status: true,
            message: "Seller request accepted and become the seller!",
            request: request,
        });

        /*
        if (user.fcmToken !== null) {
            const requestPayload = {
                token: user.fcmToken,
                notification: {
                    title: "Seller Verification Completed ✔️",
                    body: "Your seller profile is now verified. Start listing your products and grow your business today! 🚀🎯",
                },
                data: {
                    type: "SELLER_VERIFICATION_APPROVED",
                },
            };

            try {
                // const adminPromise = await admin;
                // const response = await adminPromise.messaging().send(requestPayload);
                // console.log("Successfully sent notification: ", response);
            } catch (error) {
                console.error("Error sending notification: ", error);
            }
        }
        */
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
    }
};

// Create a new seller request
exports.createRequest = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ status: false, message: get_message(1147) });
        }

        const {
            firstName, lastName, businessName, businessTag, mobileNumber,
            gender, email, password, countryCode,
            address, landMark, city, pinCode, state, country,
            bankBusinessName, bankName, accountNumber, IFSCCode, branchName
        } = req.body;

        if (!firstName || !lastName || !businessName || !businessTag || !mobileNumber || !gender || !email || !password || !countryCode ||
            !address || !landMark || !city || !pinCode || !state || !country ||
            !bankBusinessName || !bankName || !accountNumber || !IFSCCode || !branchName) {
            if (req.file) deleteFile(req.file);
            return res.status(400).json({ status: false, message: get_message(1148) });
        }

        const request = new Request();
        request.userId = req.user.id;
        request.image = "/storage/" + req.file.filename;

        request.firstName = firstName;
        request.lastName = lastName;
        request.businessName = businessName;
        request.businessTag = businessTag;
        request.mobileNumber = mobileNumber;
        request.gender = gender;
        request.email = email;
        request.password = password;
        request.countryCode = countryCode;

        request.address.address = address;
        request.address.landMark = landMark;
        request.address.city = city;
        request.address.pinCode = parseInt(pinCode);
        request.address.state = state;
        request.address.country = country;

        request.bankDetails.bankBusinessName = bankBusinessName;
        request.bankDetails.bankName = bankName;
        request.bankDetails.accountNumber = parseInt(accountNumber);
        request.bankDetails.IFSCCode = IFSCCode;
        request.bankDetails.branchName = branchName;

        request.date = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });

        await request.save();

        return res.status(200).json({
            status: true,
            message: "Request sent successfully waiting for admin approval.",
            request: request,
        });

    } catch (error) {
        console.log(error);
        if (req.file) deleteFile(req.file);
        return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
    }
};

// Check if user has become a seller or the status of their request
exports.sellerBecomeOrNot = async (req, res) => {
    try {
        if (!req.body.userId) {
            return res.status(400).json({ status: false, message: get_message(1074) });
        }

        const user = await User.findById(req.body.userId);
        if (!user) {
            return res.status(404).json({ status: false, message: get_message(1019) });
        }

        const existRequest = await Request.findOne({ userId: user._id });

        if (existRequest?.isAccepted === false) {
            return res.status(200).json({
                status: true,
                message: get_message(1155),
            });
        }

        if (existRequest?.isAccepted === true) {
            const seller = await Seller.findOne({ uniqueId: existRequest.uniqueId });
            const isAccepted = await existRequest.isAccepted;

            if (!seller) {
                return res.status(200).json({
                    status: false,
                    message: get_message(1156),
                });
            }

            return res.status(200).json({
                status: false,
                message: get_message(1157),
                seller,
                isAccepted,
            });
        }

        return res.status(200).json({
            status: true,
            message: get_message(1158),
            isSeller: false,
            requestStatus: "No Request"
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: false,
            message: error.message || "Internal Server Error",
        });
    }
};
