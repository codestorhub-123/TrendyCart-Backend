const Category = require("../models/category.model");
const Product = require("../models/product.model");
const SubCategory = require("../models/subCategory.model");
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
const mongoose = require("mongoose");
const fs = require("fs");
const { deleteFile } = require("../../utils/deleteFile");
const { get_message } = require("../../utils/message");
const getApiBase = require("../../utils/getApiBase");

const config = { baseURL: getApiBase() };

exports.create = async (req, res) => {
  try {
    if (!req.body.name.trim()) {
      if (req.file) deleteFile(req.file);
      return res.status(400).json({ status: false, message: get_message(1074) });
    }

    const category = new Category();

    category.name = req.body.name.trim();
    category.image = "/storage/" + req.file.filename;
    await category.save();

    return res.status(200).json({ status: true, message: get_message(1088), category: category });
  } catch (error) {
    if (req.file) deleteFile(req.file);
    console.log(error);
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server error",
    });
  }
};

exports.update = async (req, res) => {
  try {
    if (!req.query.categoryId || req.query.categoryId === "undefined" || !mongoose.Types.ObjectId.isValid(req.query.categoryId)) {
      if (req.file) deleteFile(req.file);
      return res.status(400).json({ status: false, message: get_message(1086) });
    }

    const category = await Category.findById(req.query.categoryId).populate("subCategory", "name image");
    if (!category) {
      if (req.file) deleteFile(req.file);
      return res.status(404).json({ status: false, message: get_message(1087) });
    }

    if (req?.file) {
      const image = category?.image?.split("storage");
      if (image) {
        if (fs.existsSync("storage" + image[1])) {
          fs.unlinkSync("storage" + image[1]);
        }
      }

      category.image = "/storage/" + req.file.filename;
    }

    category.name = req.body.name.trim() ? req.body.name.trim() : category.name.trim();
    await category.save();

    return res.status(200).json({ status: true, message: get_message(1089), category: category });
  } catch (error) {
    if (req.file) deleteFile(req.file);
    console.log(error);
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server Error",
    });
  }
};

exports.delete = async (req, res) => {
  try {
    if (!req.query.categoryId || req.query.categoryId === "undefined" || !mongoose.Types.ObjectId.isValid(req.query.categoryId)) {
      return res.status(400).json({ status: false, message: get_message(1086) });
    }

    const categoryId = new mongoose.Types.ObjectId(req.query.categoryId);

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ status: false, message: get_message(1087) });
    }

    res.status(200).json({ status: true, message: "Success" });

    const [products, subcategories, deleteToProdRequest] = await Promise.all([
      Product.find({ category: categoryId }),
      SubCategory.find({ category: categoryId }),
      ProductRequest.deleteMany({ category: categoryId }),
    ]);

    if (subcategories.length > 0) {
      await subcategories.map(async (subcategory) => {
        const subcategoryImage = subcategory?.image.split("storage");
        if (subcategoryImage) {
          if (fs.existsSync("storage" + subcategoryImage[1])) {
            fs.unlinkSync("storage" + subcategoryImage[1]);
          }
        }

        await SubCategory.findByIdAndDelete(subcategory._id);
      });
    }

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
          if (product?.images?.length > 0) {
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

        const [cart, order, favorite, review, rating, productRequest, reels] = await Promise.all([
          Cart.deleteMany({ "items.productId": product?._id }),
          Order.deleteMany({ "items.productId": product?._id }),
          Favorite.deleteMany({ productId: product?._id }),
          Review.deleteMany({ productId: product?._id }),
          Rating.deleteMany({ productId: product?._id }),
          ProductRequest.find({ productCode: product?.productCode }),
          Reel.find({ productId: product?._id }),
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
            await reel?.deleteOne();
          });
        }

        await product.deleteOne();
      });
    }

    if (category?.image) {
      const image = category?.image?.split("storage");
      if (image) {
        if (fs.existsSync("storage" + image[1])) {
          fs.unlinkSync("storage" + image[1]);
        }
      }
    }

    await category.deleteOne();
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server Error",
    });
  }
};

exports.getCategory = async (req, res) => {
  try {
    const category = await Category.aggregate([
      {
        $lookup: {
          from: "subcategories",
          localField: "_id",
          foreignField: "category",
          as: "subcategories",
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "category",
          as: "products",
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          image: 1,
          categoryProduct: { $size: "$products" },
          totalSubcategory: { $size: "$subcategories" },
          createdAt: 1,
        },
      },
      { $sort: { createdAt: -1 } },
    ]);

    return res.status(200).json({
      status: true,
      message: get_message(1090),
      category,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server error" });
  }
};
