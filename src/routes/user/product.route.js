const express = require('express');
const route = express.Router();
const controller = require('../../controllers/product.controller');
const { user_auth } = require('../../../middleware/authorization/authorization');

/**
 * @swagger
 * tags:
 *   name: Product
 *   description: The Product managing API
 */

/**
 * @swagger
 * /user/product/fetchCatSubcatAttrData:
 *   get:
 *     summary: get category, subcategory, attributes
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Data fetched successfully
 */
route.get('/fetchCatSubcatAttrData', controller.fetchCatSubcatAttrData);

/**
 * @swagger
 * /user/product/categorywiseAllProducts:
 *   get:
 *     summary: get category wise all products for user (gallery page)
 *     tags: [Product]
 *     parameters:
 *       - in: query
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: start
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 10
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Products fetched successfully
 */
route.get('/categorywiseAllProducts', controller.categorywiseAllProducts);

/**
 * @swagger
 * /user/product/detail:
 *   get:
 *     summary: get product details for user
 *     tags: [Product]
 *     parameters:
 *       - in: query
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Product fetched successfully
 */
route.get('/detail', controller.detail);

/**
 * @swagger
 * /user/product/search:
 *   post:
 *     summary: search products for user
 *     tags: [Product]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               search:
 *                 type: string
 *               start:
 *                 type: integer
 *                 example: 1
 *               limit:
 *                 type: integer
 *                 example: 10
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Search results fetched successfully
 */
route.post('/search', controller.search);

/**
 * @swagger
 * /user/product/searchProduct:
 *   get:
 *     summary: previous search products for user
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Popular products fetched successfully
 */
route.get('/searchProduct', controller.searchProduct);
/**
 * @swagger
 * /user/product/filterWiseProduct:
 *   post:
 *     summary: Get all products with filters (category, subCategory, price)
 *     tags: [Product]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               category:
 *                 oneOf:
 *                   - type: string
 *                   - type: array
 *                     items:
 *                       type: string
 *                 description: Category ID or array of category IDs
 *               subCategory:
 *                 oneOf:
 *                   - type: string
 *                   - type: array
 *                     items:
 *                       type: string
 *                 description: SubCategory ID or array of subCategory IDs
 *               minPrice:
 *                 type: number
 *                 example: 500
 *               maxPrice:
 *                 type: number
 *                 example: 3000
 *               start:
 *                 type: integer
 *                 example: 1
 *               limit:
 *                 type: integer
 *                 example: 10
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Filtered products fetched successfully
 */
route.post('/filterWiseProduct', controller.filterWiseProduct);


/**
 * @swagger
 * /user/product/geAllNewCollection:
 *   get:
 *     summary: get all new collection for user (home page)
 *     tags: [Product]
 *     parameters:
 *       - in: query
 *         name: start
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 10
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: New collection fetched successfully
 */
route.get('/geAllNewCollection', controller.geAllNewCollection);

/**
 * @swagger
 * /user/product/justForYouProducts:
 *   get:
 *     summary: get just for you products for user(home page)
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recommended products fetched successfully
 */
route.get('/justForYouProducts', controller.justForYouProducts);

/**
 * @swagger
 * /user/product/getAuctionProducts:
 *   get:
 *     summary: get auction products for user (home page)
 *     tags: [Product]
 *     parameters:
 *       - in: query
 *         name: start
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 10
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Auction products fetched successfully
 */
route.get('/getAuctionProducts', controller.getAuctionProducts);

/**
 * @swagger
 * /user/product/featuredProducts:
 *   get:
 *     summary: get most popular products for user (home page)
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Featured products fetched successfully
 */
route.get('/featuredProducts', controller.featuredProducts);

/**
 * @swagger
 * /user/product/getRelatedProductsByCategory:
 *   get:
 *     summary: get related products for user
 *     tags: [Product]
 *     parameters:
 *       - in: query
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: productId
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Related products fetched successfully
 */
route.get('/getRelatedProductsByCategory', controller.getRelatedProductsByCategory);

/**
 * @swagger
 * /user/product/create:
 *   post:
 *     summary: Add product by seller
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - productName
 *               - description
 *               - price
 *               - category
 *               - subCategory
 *               - sellerId
 *               - shippingCharges
 *               - productCode
 *               - productSaleType
 *               - mainImage
 *             properties:
 *               productName:
 *                 type: string
 *                 example: "Classic Leather Watch"
 *               description:
 *                 type: string
 *                 example: "A premium leather watch with water resistance."
 *               price:
 *                 type: number
 *                 example: 1200
 *               category:
 *                 type: string
 *                 example: "6960ca451392e78fe814e837"
 *               subCategory:
 *                 type: string
 *                 example: "6960ca451392e78fe814e838"
 *               sellerId:
 *                 type: string
 *                 example: "6960ca451392e78fe814e839"
 *               shippingCharges:
 *                 type: number
 *                 example: 50
 *               productCode:
 *                 type: string
 *                 example: "WATCH-001"
 *               attributes:
 *                 type: string
 *                 description: "JSON string of attributes array"
 *                 example: '[{"name": "Color", "values": ["white", "red"], "image": "https://example.com/images/color.png"}]'
 *               productSaleType:
 *                 type: integer
 *                 description: "1 for Buy Now, 2 for Auction, 3 for Not for Sale"
 *                 enum: [1, 2, 3]
 *                 example: 1
 *               mainImage:
 *                 type: string
 *                 format: binary
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               processingTime:
 *                 type: string
 *                 example: "2-3 days"
 *               recipientAddress:
 *                 type: string
 *                 example: "123 Street, City, Country"
 *               isImmediatePaymentRequired:
 *                 type: string
 *                 enum: ["true", "false"]
 *                 example: "false"
 *               allowOffer:
 *                 type: string
 *                 enum: ["true", "false"]
 *                 example: "false"
 *               minimumOfferPrice:
 *                 type: number
 *                 example: 1000
 *               enableAuction:
 *                 type: string
 *                 enum: ["true", "false"]
 *                 example: "false"
 *               auctionStartingPrice:
 *                 type: number
 *                 example: 500
 *               enableReservePrice:
 *                 type: string
 *                 enum: ["true", "false"]
 *                 example: "false"
 *               reservePrice:
 *                 type: number
 *                 example: 800
 *               auctionDuration:
 *                 type: number
 *                 example: 7
 *               quantity:
 *                 type: number
 *                 example: 50
 *               scheduleTime:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-02-01T10:00:00Z"
 *     responses:
 *       200:
 *         description: Success
 */
const multer = require("multer");
const storage = require("../../../utils/multer");
const upload = multer({ storage: storage });

route.post('/create', upload.fields([{ name: 'mainImage', maxCount: 1 }, { name: 'images', maxCount: 10 }]), controller.create);

/**
 * @swagger
 * /user/product/detailforSeller:
 *   get:
 *     summary: Get product details for seller
 *     tags: [Product]
 *     parameters:
 *       - in: query
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: sellerId
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
route.get('/detailforSeller', controller.detailforSeller);

/**
 * @swagger
 * /user/product/allProductForSeller:
 *   get:
 *     summary: Get all products for seller
 *     tags: [Product]
 *     parameters:
 *       - in: query
 *         name: sellerId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: saleType
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
route.get('/allProductForSeller', controller.allProductForSeller);

/**
 * @swagger
 * /user/product/delete:
 *   delete:
 *     summary: Delete product by seller
 *     tags: [Product]
 *     parameters:
 *       - in: query
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
route.delete('/delete', controller.delete);

/**
 * @swagger
 * /user/product/selectedProducts:
 *   get:
 *     summary: Get selected products for live
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sellerId
 *         required: false
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
route.get('/selectedProducts', controller.selectedProducts);

/**
 * @swagger
 * /user/product/selectOrNot:
 *   patch:
 *     summary: Toggle product selection
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success
 */
route.patch('/selectOrNot', controller.selectOrNot);

module.exports = route;
