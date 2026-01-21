
const Seller = require("../models/seller.model");
const Product = require("../models/product.model");
const Category = require("../models/category.model");
const SubCategory = require("../models/subCategory.model");
const ProductRequest = require("../models/productRequest.model");
const { deleteFiles } = require("../../utils/deleteFile");
const fs = require("fs");
const admin = require("firebase-admin");
const mongoose = require("mongoose");
const moment = require("moment");
// const manualAuctionQueue = require("../../workers/manualAuctionWorker"); // TODO: Verify path or define queue
const { get_message } = require("../../utils/message");


exports.updateProductRequest = async (req, res) => {
    try {
        const { productId, sellerId, productCode } = req.query;

        if (!productId || !sellerId || !productCode) {
            if (req.files) deleteFiles(req.files);
            return res.status(400).json({ status: false, message: get_message(1074) });
        }

        /* ===================== FETCH SELLER + PRODUCT (PARALLEL) ===================== */
        const [seller, product] = await Promise.all([
            Seller.findById(sellerId).lean(),
            Product.findOne({
                _id: productId,
                productCode,
                seller: sellerId,
                createStatus: "Approved",
            }),
        ]);

        if (!seller || !product) {
            if (req.files) deleteFiles(req.files);
            return res.status(200).json({
                status: false,
                message: !seller ? get_message(1013) : get_message(1059),
            });
        }

        const isUpdateRequest = global.settingJSON.isUpdateProductRequest;

        /* ===================== CATEGORY / SUBCATEGORY (PARALLEL + SAFE) ===================== */
        let category = product.category;
        let subCategory = product.subCategory;

        const [foundCategory, foundSubCategory] = await Promise.all([
            req.body.category && mongoose.Types.ObjectId.isValid(req.body.category)
                ? Category.findById(req.body.category).lean()
                : null,
            req.body.subCategory && mongoose.Types.ObjectId.isValid(req.body.subCategory)
                ? SubCategory.findById(req.body.subCategory).lean()
                : null,
        ]);

        if (req.body.category && !foundCategory)
            return res.status(404).json({ status: false, message: get_message(1067) });

        if (req.body.subCategory && !foundSubCategory)
            return res.status(404).json({ status: false, message: get_message(1128) });

        if (foundCategory) category = foundCategory._id;
        if (foundSubCategory) subCategory = foundSubCategory._id;

        /* ===================== AUCTION FIELDS ===================== */
        const auctionFields = {
            enableAuction: req.body.enableAuction === "true",
            scheduleTime: req.body.scheduleTime || product.scheduleTime,
            auctionStartingPrice: req.body.auctionStartingPrice || product.auctionStartingPrice,
            enableReservePrice: req.body.enableReservePrice === "true",
            reservePrice: req.body.reservePrice || product.reservePrice,
            auctionDuration: req.body.auctionDuration || product.auctionDuration,
            auctionStartDate: req.body.auctionStartDate || product.auctionStartDate,
            auctionEndDate: req.body.auctionEndDate || product.auctionEndDate,
        };

        /* ===================== ATTRIBUTES VALIDATION (ONCE) ===================== */
        let attributes = product.attributes;

        if (req.body.attributes) {
            try {
                const parsed =
                    typeof req.body.attributes === "string"
                        ? JSON.parse(req.body.attributes)
                        : req.body.attributes;

                for (const attr of parsed) {
                    if (
                        !attr.name ||
                        !Array.isArray(attr.values) ||
                        !attr.values.length ||
                        !attr.image
                    ) {
                        return res.status(200).json({
                            status: false,
                            message: "Invalid attribute structure.",
                        });
                    }
                }
                attributes = parsed;
            } catch {
                return res.status(200).json({ status: false, message: "Invalid attributes JSON." });
            }
        }

        /* ===================== UPDATE REQUEST MODE ===================== */
        if (isUpdateRequest) {
            if (product.updateStatus === "Approved") {
                await Product.updateOne(
                    { _id: product._id },
                    { $set: { updateStatus: "Pending" } }
                );
            }

            const updateProductrequest = await ProductRequest.create({
                productName: req.body.productName || product.productName,
                description: req.body.description || product.description,
                productSaleType: Number(req.body.productSaleType) || product.productSaleType,
                price: req.body.price || product.price,
                minimumOfferPrice: req.body.minimumOfferPrice || product.minimumOfferPrice,
                processingTime: req.body.processingTime || product.processingTime,
                recipientAddress: req.body.recipientAddress || product.recipientAddress,
                isImmediatePaymentRequired:
                    req.body.isImmediatePaymentRequired === "true" ||
                    product.isImmediatePaymentRequired,
                shippingCharges: req.body.shippingCharges || product.shippingCharges,
                category,
                subCategory,
                seller: product.seller,
                productCode: product.productCode,
                updateStatus: "Pending",
                attributes,
                date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
                ...auctionFields,
                mainImage: req.files?.mainImage
                    ? process.env.BASE_URL + req.files.mainImage[0].path
                    : product.mainImage,
                images: req.files?.images
                    ? req.files.images.map(f => process.env.BASE_URL + f.path)
                    : product.images,
            });

            /* ===================== FIRE-AND-FORGET NOTIFICATION ===================== */
            setImmediate(async () => {
                try {
                    if (seller.fcmToken) {
                        const adminInstance = await admin;
                        await adminInstance.messaging().send({
                            token: seller.fcmToken,
                            notification: {
                                title: "📦 Product Request Submitted!",
                                body: "Your product update request is under review. ✅⏳",
                            },
                            data: { type: "PRODUCT_REQUEST_SUBMITTED" },
                        });
                    }
                } catch (err) {
                    console.error("FCM Error:", err.message);
                }
            });

            return res.status(200).json({
                status: true,
                message: "Product update request submitted.",
                updateProductrequest,
            });
        }

        /* ===================== DIRECT UPDATE MODE ===================== */
        Object.assign(product, {
            productName: req.body.productName || product.productName,
            description: req.body.description || product.description,
            price: Number(req.body.price) || product.price,
            productSaleType: Number(req.body.productSaleType) || product.productSaleType,
            processingTime: req.body.processingTime || product.processingTime,
            recipientAddress: req.body.recipientAddress || product.recipientAddress,
            minimumOfferPrice: req.body.minimumOfferPrice || product.minimumOfferPrice,
            shippingCharges: req.body.shippingCharges || product.shippingCharges,
            category,
            subCategory,
            attributes,
            updateStatus: "Approved",
            ...auctionFields,
        });

        if (req.files?.mainImage)
            product.mainImage = process.env.BASE_URL + req.files.mainImage[0].path;

        if (req.files?.images)
            product.images = req.files.images.map(f => process.env.BASE_URL + f.path);

        await product.save();

        return res.status(200).json({
            status: true,
            message: "Product updated directly.",
            product,
        });

    } catch (error) {
        if (req.files) deleteFiles(req.files);
        console.error("Error:", error);
        return res.status(500).json({
            status: false,
            message: error.message || "Internal Server Error",
        });
    }
};

exports.updateProductRequestStatusWise = async (req, res) => {
    try {
        if (!req.query.status) {
            return res.status(400).json({ status: true, message: get_message(1121) });
        }

        let statusQuery = {};
        if (req.query.status === "Pending") {
            statusQuery = { updateStatus: "Pending" };
        } else if (req.query.status === "Approved") {
            statusQuery = { updateStatus: "Approved" };
        } else if (req.query.status === "Rejected") {
            statusQuery = { updateStatus: "Rejected" };
        } else if (req.query.status === "All") {
            statusQuery = {
                updateStatus: {
                    $in: ["Pending", "Approved", "Rejected"],
                },
            };
        } else {
            return res.status(400).json({ status: false, message: get_message(1121) });
        }

        const productRequests = await ProductRequest.find(statusQuery);

        return res.status(200).json({
            status: true,
            message: `Retrive product's request to update the product with status ${req.query.status}`,
            productRequests,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
    }
};

exports.acceptUpdateRequest = async (req, res) => {
    try {
        if (!req.query.requestId) {
            return res.status(400).json({ status: false, message: get_message(1074) });
        }

        const updateRequest = await ProductRequest.findOne({ _id: req.query.requestId, updateStatus: "Pending" });
        if (!updateRequest) {
            return res.status(404).json({ status: false, message: get_message(1130) });
        }

        if (updateRequest.updateStatus === "Approved") {
            return res.status(200).json({
                status: false,
                message: get_message(1131),
            });
        }

        if (req.query.type === "Approved") {
            const product = await Product.findOne({
                productCode: updateRequest.productCode,
                createStatus: "Approved",
            });

            if (!product) {
                return res.status(404).json({ status: false, message: get_message(1059) });
            }

            if (product.mainImage) {
                const image = product?.mainImage?.split("storage");
                if (image) {
                    if (fs.existsSync("storage" + image[1])) {
                        fs.unlinkSync("storage" + image[1]);
                    }
                }
            }

            if (product.images.length > 0) {
                for (var i = 0; i < product.images.length; i++) {
                    const images = product.images[i].split("storage");

                    if (images) {
                        if (fs.existsSync("storage" + images[1])) {
                            fs.unlinkSync("storage" + images[1]);
                        }
                    }
                }
            }

            product.productName = updateRequest.productName;
            product.productCode = updateRequest.productCode;
            product.description = updateRequest.description;
            product.mainImage = updateRequest.mainImage;
            product.images = updateRequest.images;
            product.attributes = updateRequest.attributes;
            product.price = updateRequest.price;
            product.processingTime = updateRequest.processingTime;
            product.recipientAddress = updateRequest.recipientAddress;
            product.isImmediatePaymentRequired = updateRequest.isImmediatePaymentRequired;
            product.shippingCharges = updateRequest.shippingCharges;
            product.seller = updateRequest.seller;
            product.category = updateRequest.category;
            product.subCategory = updateRequest.subCategory;
            product.date = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
            product.updateStatus = "Approved";
            product.productSaleType = updateRequest.productSaleType;
            product.allowOffer = updateRequest.allowOffer;
            product.minimumOfferPrice = updateRequest.minimumOfferPrice;
            product.enableAuction = updateRequest.enableAuction;
            product.auctionStartingPrice = updateRequest.auctionStartingPrice;
            product.enableReservePrice = updateRequest.enableReservePrice;
            product.reservePrice = updateRequest.reservePrice;
            product.auctionDuration = updateRequest.auctionDuration;

            let scheduleISO = null;
            let auctionStartISO = null;
            let auctionEndISO = null;

            if (updateRequest.scheduleTime) {
                const m = moment(updateRequest.scheduleTime, moment.ISO_8601, true);
                if (!m.isValid()) {
                    if (req.files) deleteFiles(req.files);
                    return res.status(200).json({ status: false, message: "Invalid scheduleTime. Expect ISO 8601 date/time." });
                }
                scheduleISO = m.toISOString(); // normalized ISO string (UTC)
            }

            if (scheduleISO) {
                product.scheduleTime = scheduleISO;
            }

            if (product.enableAuction && product.auctionDuration > 0 && product.scheduleTime) {
                const auctionStart = moment(product.scheduleTime); // moment from ISO
                const auctionEnd = auctionStart.clone().add(product.auctionDuration, "days");

                auctionStartISO = auctionStart.toISOString();
                auctionEndISO = auctionEnd.toISOString();

                product.auctionStartDate = auctionStartISO;
                product.auctionEndDate = auctionEndISO;
            }

            updateRequest.updateStatus = "Approved";

            await Promise.all([product.save(), updateRequest.save()]);

            res.status(200).json({
                status: true,
                message: "Product request accepted by the admin for update that product.",
                updateRequest,
            });

            const seller = await Seller.findOne({ _id: product.seller }).select("fcmToken").lean();
            if (seller.fcmToken !== null) {
                const requestPayload = {
                    token: seller.fcmToken,
                    notification: {
                        title: "✅ Product Approved!",
                        body: "🎉 Your product has been approved and is now live in the store. Start selling! 🛍️🚀",
                    },
                    data: {
                        type: "PRODUCT_REQUEST_APPROVED",
                    },
                };

                try {
                    const adminPromise = await admin;
                    const response = await adminPromise.messaging().send(requestPayload);
                    console.log("Successfully sent approval notification: ", response);
                } catch (error) {
                    console.error("Error sending approval notification: ", error);
                }
            }

            if (product.productSaleType === 2 && product.enableAuction && product.auctionEndDate && product.createStatus === "Approved") {
                // await manualAuctionQueue.add(
                //     "closeManualAuction",
                //     { productId: product._id },
                //     {
                //         delay: new Date(product.auctionEndDate).getTime() - Date.now(),
                //     }
                // );
                console.log("Manual Auction Queue logic skipped - queue not defined");
            }
        } else if (req.query.type === "Rejected") {
            const product = await Product.findOne({
                productCode: updateRequest.productCode,
                createStatus: "Approved",
            });

            if (!product) {
                return res.status(404).json({ status: false, message: get_message(1059) });
            }

            product.updateStatus = "Rejected";

            updateRequest.updateStatus = "Rejected";

            await Promise.all([product.save(), updateRequest.save()]);

            res.status(200).json({
                status: true,
                message: "Product request rejected by admin for update that product.",
                updateRequest,
            });

            if (updateRequest?.mainImage) {
                const image = updateRequest?.mainImage?.split("storage");
                if (image) {
                    if (fs.existsSync("storage" + image[1])) {
                        fs.unlinkSync("storage" + image[1]);
                    }
                }
            }

            if (updateRequest.images.length > 0) {
                for (var i = 0; i < updateRequest.images.length; i++) {
                    const images = updateRequest.images[i].split("storage");

                    if (images) {
                        if (fs.existsSync("storage" + images[1])) {
                            fs.unlinkSync("storage" + images[1]);
                        }
                    }
                }
            }

            const seller = await Seller.findOne({ _id: product.seller }).select("fcmToken").lean();

            if (seller.fcmToken !== null) {
                const requestPayload = {
                    token: seller.fcmToken,
                    notification: {
                        title: "❌ Product Request Declined",
                        body: "We’re sorry! 😔 Your product request was not approved. Please review and try again. 📋🔄",
                    },
                    data: {
                        type: "PRODUCT_REQUEST_DECLINED",
                    },
                };

                try {
                    const adminPromise = await admin;
                    const response = await adminPromise.messaging().send(requestPayload);
                    console.log("Successfully sent decline notification: ", response);
                } catch (error) {
                    console.error("Error sending decline notification: ", error);
                }
            }
        } else {
            return res.status(400).json({ status: false, message: get_message(1121) });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: false,
            message: error.message || "Internal Server Error.!",
        });
    }
};

exports.createProductRequestStatusWise = async (req, res) => {
    try {
        if (!req.query.status) {
            return res.status(400).json({ status: true, message: get_message(1074) });
        }

        let statusQuery = {};
        if (req.query.status === "Pending") {
            statusQuery = { createStatus: "Pending" };
        } else if (req.query.status === "Approved") {
            statusQuery = { createStatus: "Approved" };
        } else if (req.query.status === "Rejected") {
            statusQuery = { createStatus: "Rejected" };
        } else if (req.query.status === "All") {
            statusQuery = {
                createStatus: {
                    $in: ["Pending", "Approved", "Rejected"],
                },
            };
        } else {
            return res.status(400).json({ status: false, message: get_message(1121) });
        }

        const products = await Product.find(statusQuery);

        return res.status(200).json({
            status: true,
            message: `Retrive products with status ${req.query.status}`,
            products,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
    }
};

exports.acceptCreateRequest = async (req, res) => {
    try {
        if (!req.query.productId) {
            return res.status(400).json({ status: false, message: get_message(1074) });
        }

        const product = await Product.findById(req.query.productId);
        if (!product) {
            return res.status(404).json({ status: false, message: get_message(1059) });
        }

        if (product.createStatus === "Approved") {
            return res.status(200).json({
                status: false,
                message: get_message(1131),
            });
        }

        if (req.query.type === "Approved") {
            product.createStatus = "Approved";
            await product.save();

            res.status(200).json({
                status: true,
                message: "Product request accepted by the admin.",
                product: product,
            });

            if (product.productSaleType === 2 && product.enableAuction && product.auctionEndDate && product.createStatus === "Approved") {
                // await manualAuctionQueue.add(
                //   "closeManualAuction",
                //   { productId: product._id },
                //   {
                //     delay: new Date(product.auctionEndDate).getTime() - Date.now(),
                //   }
                // );
                console.log("Manual Auction Queue logic skipped - queue not defined");
            }
        } else if (req.query.type === "Rejected") {
            product.createStatus = "Rejected";
            await product.save();

            //await Product.findByIdAndDelete(product._id);

            return res.status(200).json({
                status: true,
                message: "Product request rejected by the admin for create the product.",
                product: product,
            });
        } else {
            return res.status(200).json({ status: false, message: "type must be passed valid." });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
    }
};
