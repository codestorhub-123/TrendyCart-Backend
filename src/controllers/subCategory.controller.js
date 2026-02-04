const SubCategory = require("../models/subCategory.model");
const Category = require("../models/category.model");
const Product = require("../models/product.model");
const ProductRequest = require("../models/productRequest.model");
const Cart = require("../models/cart.model");
const Order = require("../models/order.model");
const Favorite = require("../models/favorite.model");
const Review = require("../models/review.model");
const Rating = require("../models/rating.model");
const Reel = require("../models/reel.model");
const AuctionBid = require("../models/auctionBid.model");
const SellerWallet = require("../models/sellerWallet.model");
const LikeHistoryOfReel = require("../models/likeHistoryOfReel.model");
const ReportReel = require("../models/reportoReel.model");
const fs = require("fs");
const path = require("path");
const { deleteFile } = require("../../utils/deleteFile");
const { get_message } = require("../../utils/message");
const getApiBase = require("../../utils/getApiBase");

const config = { baseURL: getApiBase() };


exports.fetchActiveSubCategories = async (req, res) => {
    try {
        const subCategories = await SubCategory.find().select("_id name image createdAt").sort({ createdAt: 1 }).lean();



        return res.status(200).json({
            status: true,
            message: "Subcategories fetched successfully.",
            subCategories,
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            error: error.message || "Something went wrong. Please try again.",
        });
    }
};

exports.create = async (req, res) => {
    try {
        if (!req.body.name || !req.file || !req.body.category) {
            if (req.file) deleteFile(req.file);
            return res.status(400).json({ status: false, message: get_message(1074) });
        }

        const category = await Category.findById(req.body.category);
        if (!category) {
            if (req.file) deleteFile(req.file);
            return res.status(404).json({ status: false, message: get_message(1067) });
        }

        const subCategory = new SubCategory();

        subCategory.name = req.body.name.trim();
        subCategory.image = "/storage/" + req.file.filename;
        subCategory.category = category._id;

        category.subCategory.push(subCategory);

        await Promise.all([subCategory.save(), category.save()]);

        const [sameSubcategoryProductCount, subCategoryData] = await Promise.all([
            Product.countDocuments({ subCategory: subCategory._id }),
            SubCategory.findById(subCategory._id).populate("category", "name"),
        ]);

        return res.status(200).json({
            status: true,
            message: "SubCategory has been created by the admin.",
            sameSubcategoryProductCount: sameSubcategoryProductCount,
            subCategory: subCategoryData,
        });
    } catch (error) {
        if (req.file) deleteFile(req.file);
        console.log(error);
        return res.status(500).json({ status: false, error: error.message || "Internal Server error" });
    }
};

exports.update = async (req, res) => {
    try {
        if (!req.query.subCategoryId || req.query.subCategoryId === "undefined" || !require('mongoose').Types.ObjectId.isValid(req.query.subCategoryId)) {
            if (req.file) deleteFile(req.file);
            return res.status(400).json({ status: false, message: get_message(1159) });
        }

        const subCategory = await SubCategory.findById(req.query.subCategoryId);
        if (!subCategory) {
            if (req.file) deleteFile(req.file);
            return res.status(404).json({ status: false, message: get_message(1128) });
        }

        if (req?.file) {
            const subcategoryImage = subCategory?.image.split("storage");
            if (subcategoryImage) {
                if (fs.existsSync("storage" + subcategoryImage[1])) {
                    fs.unlinkSync("storage" + subcategoryImage[1]);
                }
            }

            subCategory.image = "/storage/" + req.file.filename;
        }

        subCategory.name = req?.body?.name ? req?.body?.name.trim() : subCategory.name;

        await subCategory.save();
        const subCategoryData = await SubCategory.findById(subCategory._id).populate("category", "name");

        return res.status(200).json({
            status: true,
            message: "SubCategory has been updated by the admin.",
            subCategory: subCategoryData,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: false,
            error: error.message || "Internal Server Error",
        });
    }
};

exports.delete = async (req, res) => {
    try {
        if (!req.query.subCategoryId || req.query.subCategoryId === "undefined" || !require('mongoose').Types.ObjectId.isValid(req.query.subCategoryId)) {
            return res.status(400).json({ status: false, message: get_message(1159) });
        }

        const subCategory = await SubCategory.findById(req.query.subCategoryId);
        if (!subCategory) {
            return res.status(404).json({ status: false, message: get_message(1128) });
        }

        res.status(200).json({ status: true, message: "SubCategory has been deleted by the admin." });

        const categoryId = subCategory?.category;

        const [category, products, deleteToProdRequest] = await Promise.all([
            Category.findById(categoryId),
            Product.find({ subCategory: subCategory._id }),
            ProductRequest.deleteMany({ subCategory: subCategory._id }),
        ]);

        if (category) {
            category.subCategory.pull(subCategory._id);
            await category.save();
        }

        const subcategoryImage = subCategory?.image.split("storage");
        if (subcategoryImage) {
            if (fs.existsSync("storage" + subcategoryImage[1])) {
                fs.unlinkSync("storage" + subcategoryImage[1]);
            }
        }

        await subCategory.deleteOne();

        if (products.length > 0) {
            await products.forEach(async (product) => {
                if (product.mainImage) {
                    const image = product?.mainImage?.split("storage");
                    if (image) {
                        if (fs.existsSync("storage" + image[1])) {
                            fs.unlinkSync("storage" + image[1]);
                        }
                    }
                }

                if (product.images) {
                    if (product.images.length > 0) {
                        for (var i = 0; i < product.images.length; i++) {
                            const images = product?.images[i]?.split("storage");
                            if (images) {
                                if (fs.existsSync("storage" + images[1])) {
                                    fs.unlinkSync("storage" + images[1]);
                                }
                            }
                        }
                    }
                }

                const [cart, order, favorite, review, rating, productRequest, reels] = await Promise.all([
                    Cart.deleteMany({ "items.productId": product._id }),
                    Order.deleteMany({ "items.productId": product._id }),
                    Favorite.deleteMany({ productId: product._id }),
                    Review.deleteMany({ productId: product._id }),
                    Rating.deleteMany({ productId: product._id }),
                    ProductRequest.find({ productCode: product?.productCode }),
                    Reel.find({ productId: product._id }),
                    AuctionBid.deleteMany({ productId: product?._id }),
                    SellerWallet.deleteMany({ productId: product?._id }),
                ]);

                if (productRequest.length > 0) {
                    await productRequest.forEach(async (product) => {
                        if (product.mainImage) {
                            const image = product?.mainImage?.split("storage");
                            if (image) {
                                if (fs.existsSync("storage" + image[1])) {
                                    fs.unlinkSync("storage" + image[1]);
                                }
                            }
                        }

                        if (product.images) {
                            if (product.images.length > 0) {
                                for (var i = 0; i < product?.images?.length; i++) {
                                    const images = product?.images[i]?.split("storage");
                                    if (images) {
                                        if (fs.existsSync("storage" + images[1])) {
                                            fs.unlinkSync("storage" + images[1]);
                                        }
                                    }
                                }
                            }
                        }
                    });
                }

                if (reels.length > 0) {
                    await reels.forEach(async (reel) => {
                        if (reel.video) {
                            const video = reel?.video?.split("storage");
                            if (video) {
                                if (fs.existsSync("storage" + video[1])) {
                                    fs.unlinkSync("storage" + video[1]);
                                }
                            }
                        }

                        if (reel.thumbnail) {
                            const thumbnail = reel?.thumbnail?.split("storage");
                            if (thumbnail) {
                                if (fs.existsSync("storage" + thumbnail[1])) {
                                    fs.unlinkSync("storage" + thumbnail[1]);
                                }
                            }
                        }

                        await Promise.all([LikeHistoryOfReel.deleteMany({ reelId: reel?._id }), ReportReel.deleteMany({ reelId: reel?._id })]);
                        await reel.deleteOne();
                    });
                }

                await product.deleteOne();
            });
        }
    } catch (error) {
        return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
    }
};

exports.categoryWiseSubCategory = async (req, res) => {
    try {
        if (!req.query.categoryId) {
            return res.status(200).json({ status: false, message: get_message(1086) });
        }

        const subCategories = await SubCategory.find({ category: req.query.categoryId }).populate("category", "name");

        if (subCategories.length === 0) {
            return res.status(404).json({ status: false, message: get_message(1160) });
        }

        const data = [];
        for (const subCategory of subCategories) {
            const sameSubcategoryProductCount = await Product.countDocuments({ subCategory: subCategory._id });

            data.push({
                subCategoryId: subCategory._id,
                name: subCategory.name,
                image: subCategory.image,
                category: subCategory.category ? subCategory.category.name : "",
                categoryId: subCategory.category ? subCategory.category._id : null,
                sameSubcategoryProductCount,
            });
        }

        return res.status(200).json({
            status: true,
            message: "Retrived all subcategories successfully!",
            data: data,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
    }
};
