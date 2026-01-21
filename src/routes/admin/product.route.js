const express = require('express');
const route = express.Router();
const productController = require('../../controllers/product.controller');
const multer = require("multer");
const storage = require("../../../utils/multer");
const upload = multer({ storage: storage });

/**
 * @swagger
 * tags:
 *   name: Admin Product
 *   description: Admin product management endpoints
 */



/**
 * @swagger
 * /admin/product/createProductByAdmin:
 *   post:
 *     summary: Create a new product directly by admin
 *     tags: [Admin Product]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               productName: { type: string }
 *               description: { type: string }
 *               price: { type: number }
 *               category: { type: string }
 *               subCategory: { type: string }
 *               shippingCharges: { type: number }
 *               productCode: { type: string }
 *               productSaleType: { type: number }
 *               quantity: { type: number }
 *               sellerId: { type: string }
 *               attributes: { type: string, description: "JSON string of attributes array. Example: [{\"name\": \"Color\", \"values\": [\"white\", \"red\"], \"image\": \"url\"}]" }
 *               mainImage: { type: string, format: binary }
 *               images: { type: array, items: { type: string, format: binary } }
 *     responses:
 *       200:
 *         description: Success
 */
route.post('/createProductByAdmin', upload.fields([{ name: 'mainImage', maxCount: 1 }, { name: 'images', maxCount: 10 }]), productController.createProductByAdmin);

/**
 * @swagger
 * /admin/product/update:
 *   patch:
 *     summary: Update a product by admin
 *     tags: [Admin Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: productId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               productName: { type: string }
 *               description: { type: string }
 *               price: { type: number }
 *               category: { type: string }
 *               subCategory: { type: string }
 *               shippingCharges: { type: number }
 *               productCode: { type: string }
 *               productSaleType: { type: number }
 *               quantity: { type: number }
 *               attributes: { type: string, description: "JSON string of attributes array. Example: [{\"name\": \"Color\", \"values\": [\"white\", \"red\"], \"image\": \"url\"}]" }
 *               mainImage: { type: string, format: binary }
 *               images: { type: array, items: { type: string, format: binary } }
 *     responses:
 *       200:
 *         description: Success
 */
route.patch('/update', upload.fields([{ name: 'mainImage', maxCount: 1 }, { name: 'images', maxCount: 10 }]), productController.update);

/**
 * @swagger
 * /admin/product/getRealProducts:
 *   get:
 *     summary: Get list of real products
 *     tags: [Admin Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start
 *         required: false
 *         schema: { type: integer, default: 1 }
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         required: false
 *         schema: { type: integer, default: 10 }
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Success
 */
route.get('/getRealProducts', productController.getRealProducts);

/**
 * @swagger
 * /admin/product/getFakeProducts:
 *   get:
 *     summary: Get list of fake products
 *     tags: [Admin Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start
 *         required: false
 *         schema: { type: integer, default: 1 }
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         required: false
 *         schema: { type: integer, default: 10 }
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Success
 */
route.get('/getFakeProducts', productController.getFakeProducts);

/**
 * @swagger
 * /admin/product/productDetailsForAdmin:
 *   get:
 *     summary: Get detailed product information for admin
 *     tags: [Admin Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: productId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Success
 */
route.get('/productDetailsForAdmin', productController.productDetailsForAdmin);

/**
 * @swagger
 * /admin/product/getSellerWise:
 *   get:
 *     summary: Get products grouped/filtered by seller
 *     tags: [Admin Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sellerId
 *         schema: { type: string }
 *       - in: query
 *         name: start
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Success
 */
route.get('/getSellerWise', productController.getSellerWise);

/**
 * @swagger
 * /admin/product/topSellingProducts:
 *   get:
 *     summary: Get top-selling products for dashboard
 *     tags: [Admin Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Success
 */
route.get('/topSellingProducts', productController.topSellingProducts);

/**
 * @swagger
 * /admin/product/popularProducts:
 *   get:
 *     summary: Get most popular products for dashboard
 *     tags: [Admin Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Success
 */
route.get('/popularProducts', productController.popularProducts);

/**
 * @swagger
 * /admin/product/isOutOfStock:
 *   patch:
 *     summary: Toggle Out of Stock status
 *     tags: [Admin Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: productId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Success
 */
route.patch('/isOutOfStock', productController.isOutOfStock);

/**
 * @swagger
 * /admin/product/isNewCollection:
 *   patch:
 *     summary: Toggle New Collection status
 *     tags: [Admin Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: productId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Success
 */
route.patch('/isNewCollection', productController.isNewCollection);

/**
 * @swagger
 * /admin/product/selectOrNot:
 *   patch:
 *     summary: Toggle selection status
 *     tags: [Admin Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: productId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Success
 */
route.patch('/selectOrNot', productController.selectOrNot);



/**
 * @swagger
 * /admin/product/delete:
 *   delete:
 *     summary: Delete product by admin
 *     tags: [Admin Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: productId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Success
 */
route.delete('/delete', productController.delete);

module.exports = route;

