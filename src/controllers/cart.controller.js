const mongoose = require("mongoose");
const Cart = require("../models/cart.model");
const Product = require("../models/product.model");
const User = require("../models/user.model");
const Seller = require("../models/seller.model");
const { get_message } = require("../../utils/message");

exports.addToCart = async (req, res) => {
    try {
        console.log("req.body: ", req.body);

        if (!req.body.userId || !req.body.productId || !req.body.productQuantity || !req.body.attributesArray) {
            return res.status(400).json({ status: false, message: get_message(1074) });
        }

        const userId = new mongoose.Types.ObjectId(req.body.userId);
        const productId = new mongoose.Types.ObjectId(req.body.productId);

        const [product, user, cart, userIsSeller] = await Promise.all([
            Product.findOne({ _id: productId, createStatus: "Approved" }).lean(),
            User.findById(userId).lean(),
            Cart.findOne({ userId: userId }),
            Seller.findOne({ userId: userId }).lean(),
        ]);

        if (!product) {
            return res.status(404).json({ status: false, message: get_message(1059) });
        }

        if (!user) {
            return res.status(404).json({ status: false, message: get_message(1019) });
        }

        if (user.isBlock) {
            return res.status(403).json({ status: false, message: get_message(1017) });
        }

        //Check if the user is the seller of the product
        if (userIsSeller && userIsSeller._id.toString() === product?.seller?._id?.toString()) {
            return res.status(400).json({ status: false, message: get_message(1075) });
        }

        if (cart) {
            const sellerId = product.seller._id.toString();
            const differentSellerProductsInCart = cart.items.some((item) => item.sellerId.toString() !== sellerId);
            console.log("different Seller's Products In Cart:   ", differentSellerProductsInCart);

            console.log("Cart already exists");

            let itemIndex = cart.items.findIndex((item) => item.productId.toString() === product._id.toString() && JSON.stringify(item.attributesArray) === JSON.stringify(req.body.attributesArray));

            if (itemIndex !== -1) {
                //If the same product with the same attributesArray already exists in the cart, update the productQuantity
                cart.items[itemIndex].productQuantity += parseInt(req.body.productQuantity);
            } else {
                //If the same product with a different attributesArray, or a new product is being added, push a new item to the items array
                cart.items.push({
                    productId: product._id,
                    sellerId: product.seller._id,
                    productCode: product.productCode,
                    productQuantity: parseInt(req.body.productQuantity),
                    purchasedTimeProductPrice: product.price,
                    purchasedTimeShippingCharges: product.shippingCharges,
                    attributesArray: req.body.attributesArray,
                });
            }

            const productIds = [];
            cart.totalShippingCharges = 0;
            cart.items.map((val) => {
                if (val?.productId) {
                    const product = productIds.includes(val.productId.toString());
                    if (!product) {
                        productIds.push(val.productId.toString());
                        cart.totalShippingCharges += val.purchasedTimeShippingCharges;
                    }
                }
            });

            cart.subTotal = 0;
            cart.items.map((item) => {
                if (item?.productId) {
                    cart.subTotal += item.purchasedTimeProductPrice * parseInt(item.productQuantity);
                }
            });

            cart.totalItems = cart.items.length;
            await cart.save();

            const data = await cart.populate({
                path: "items.productId",
                select: {
                    productName: 1,
                    mainImage: 1,
                    _id: 1,
                },
            });

            return res.status(200).json({
                status: true,
                message: get_message(1076),
                data: data,
            });
        } else {
            console.log("new cart created");

            const items = [
                {
                    productId: product._id,
                    sellerId: product.seller._id,
                    productQuantity: parseInt(req.body.productQuantity),
                    productCode: product.productCode,
                    purchasedTimeProductPrice: product.price,
                    purchasedTimeShippingCharges: product.shippingCharges,
                    attributesArray: req.body.attributesArray,
                },
            ];

            const subTotal = items[0].purchasedTimeProductPrice * parseInt(items[0].productQuantity);

            const newCart = new Cart();

            newCart.userId = user._id;
            newCart.items = items;
            newCart.totalShippingCharges = items[0].purchasedTimeShippingCharges;
            newCart.subTotal = subTotal;
            newCart.totalItems = items.length;
            await newCart.save();

            const data = await newCart.populate({
                path: "items.productId",
                select: {
                    productName: 1,
                    mainImage: 1,
                    _id: 1,
                },
            });

            return res.status(200).json({
                status: true,
                message: get_message(1076),
                data: data,
            });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: false, message: "Internal Server Error" });
    }
};
exports.removeProduct = async (req, res) => {
    try {
        if (!req.body.userId || !req.body.productId || !req.body.productQuantity || !req.body.attributesArray) {
            return res.status(400).json({ status: false, message: get_message(1074) });
        }

        const userId = new mongoose.Types.ObjectId(req.body.userId);
        const productId = new mongoose.Types.ObjectId(req.body.productId);

        const [product, user, cartByUser] = await Promise.all([
            Product.findOne({ _id: productId, createStatus: "Approved" }).lean(),
            User.findById(userId).lean(),
            Cart.findOne({ userId: userId })
        ]);

        if (!user) {
            return res.status(404).json({ status: false, message: get_message(1019) });
        }

        if (user.isBlock) {
            return res.status(403).json({ status: false, message: get_message(1017) });
        }

        if (!product) {
            return res.status(404).json({ status: false, message: get_message(1059) });
        }

        if (!cartByUser) {
            return res.status(404).json({ status: false, message: get_message(1077) });
        }

        let attributes;
        if (typeof req.body.attributesArray === "string") {
            console.log("attributesArray in body: ", typeof req.body.attributesArray);

            attributes = JSON.parse(req.body.attributesArray);
        } else if (typeof req.body.attributesArray === "object") {
            console.log("attributesArray in body: ", typeof req.body.attributesArray);

            attributes = req.body.attributesArray;
        } else {
            return res.status(200).json({
                status: false,
                message: get_message(1078),
            });
        }

        let result = null;

        if (cartByUser?.items?.length) {
            if (Array.isArray(attributes)) {
                const updateRecordIndex = cartByUser.items.findIndex((item) => item?.productId.toString() === product._id.toString() && JSON.stringify(item?.attributesArray) === JSON.stringify(attributes));
                console.log("updateRecordIndex: ", updateRecordIndex);

                if (updateRecordIndex !== -1) {
                    if (cartByUser.items[updateRecordIndex]?.productQuantity >= parseInt(req.body.productQuantity)) {
                        const updatedQuan = Number(cartByUser.items[updateRecordIndex].productQuantity) - Number(req?.body?.productQuantity);
                        cartByUser.items[updateRecordIndex].productQuantity = updatedQuan;

                        var purchasedTimeProductPrice;
                        purchasedTimeProductPrice = cartByUser.items[updateRecordIndex].purchasedTimeProductPrice;

                        const subTotal = cartByUser.subTotal - purchasedTimeProductPrice * parseInt(req.body.productQuantity);

                        result = await Cart.findOneAndUpdate(
                            { _id: cartByUser._id },
                            {
                                items: cartByUser.items,
                                subTotal,
                            },
                            { new: true }
                        );
                    } else {
                        return res.status(404).json({ status: false, message: get_message(1079) });
                    }

                    if (result && result.items.some((item) => item.productQuantity === 0)) {
                        const filteredItems = result.items.filter((item) => item.productQuantity !== 0);

                        const shippingCharges = [...new Set(filteredItems.map((item) => item.purchasedTimeShippingCharges))];

                        let updatedTotalShippingCharges = 0;
                        for (const value of shippingCharges) {
                            updatedTotalShippingCharges += value;
                        }

                        const subTotal = cartByUser.subTotal - purchasedTimeProductPrice * parseInt(req.body.productQuantity);

                        result = await Cart.findOneAndUpdate(
                            { _id: cartByUser._id },
                            {
                                $pull: {
                                    items: {
                                        productId: product._id,
                                        productQuantity: 0,
                                    },
                                },
                                $set: {
                                    subTotal,
                                    totalItems: result.totalItems - 1,
                                    totalShippingCharges: updatedTotalShippingCharges,
                                },
                            },
                            { new: true }
                        );
                    }

                    if (result.totalItems === 0 || result.items.length === 0) {
                        await Cart.findByIdAndDelete(result._id); //_id of the cart

                        return res.status(200).json({
                            status: true,
                            message: get_message(1081),
                            data: null,
                        });
                    }
                } else {
                    return res.status(404).json({ status: false, message: get_message(1080) });
                }
            } else {
                console.log("req.body.attributesArray is not an array.");
            }
        }

        const data = await Cart.populate(result, {
            path: "items.productId",
            select: {
                productName: 1,
                mainImage: 1,
                _id: 1,
            },
        });

        return res.status(200).json({
            status: true,
            message: get_message(1082),
            data: data,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: false, message: "Internal Server Error" });
    }
};

//get all products added to cart for user
exports.getCartProduct = async (req, res) => {
    try {
        if (!req.query.userId) {
            return res.status(400).json({ status: false, message: get_message(1074) });
        }

        const userId = new mongoose.Types.ObjectId(req.query.userId);

        const [user, cart] = await Promise.all([
            User.findById(userId).lean(),
            Cart.findOne({ userId: userId })
        ]);

        if (!user) {
            return res.status(404).json({ status: false, message: get_message(1019) });
        }

        if (user.isBlock) {
            return res.status(403).json({ status: false, message: get_message(1017) });
        }

        if (!cart) {
            return res.status(200).json({
                status: false,
                message: get_message(1077),
            });
        }

        const populatedCart = await cart.populate({
            path: "items.productId",
            select: {
                productName: 1,
                mainImage: 1,
                attributes: 1,
                productSaleType: 1,
                enableAuction: 1,
                auctionEndDate: 1,
                _id: 1,
            },
        });

        if (populatedCart.items.length === 0) {
            return res.status(200).json({
                status: true,
                message: get_message(1083),
            });
        }

        return res.status(200).json({
            status: true,
            message: get_message(1084),
            data: populatedCart,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: false, message: "Internal Server Error" });
    }
};

//delete the cart of particular user
exports.deleteCart = async (req, res) => {
    try {
        if (!req.query.userId) {
            return res.status(400).json({ status: false, message: get_message(1074) });
        }

        const userId = new mongoose.Types.ObjectId(req.query.userId);

        const [user, cartByUser] = await Promise.all([
            User.findById(userId).lean(),
            Cart.findOne({ userId: userId })
        ]);

        if (!user) {
            return res.status(404).json({ status: false, message: get_message(1019) });
        }

        if (user.isBlock) {
            return res.status(403).json({ status: false, message: get_message(1017) });
        }

        if (!cartByUser) {
            return res.status(404).json({ status: false, message: get_message(1077) });
        }

        await Cart.deleteOne({ _id: cartByUser._id });

        return res.status(200).json({ status: true, message: get_message(1085) });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
    }
};
