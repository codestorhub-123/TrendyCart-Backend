const express = require('express');
const route = express.Router();
const controller = require('../../controllers/seller.controller');

//multer
const multer = require("multer");
const storage = require("../../../utils/multer");
const upload = multer({ storage });

/**
 * @swagger
 * /user/seller/login:
 *   post:
 *     summary: Seller login
 *     tags: [Seller]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: seller@example.com
 *               password:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token: { type: string }
 *                 seller: { type: object }
 */
route.post('/login', controller.login);

/**
 * @swagger
 * /user/seller/getProfile:
 *   get:
 *     summary: Get logged-in seller profile
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Success }
 */
route.get('/getProfile', controller.getProfile);

/**
 * @swagger
 * /user/seller/fetchSellerProfile:
 *   get:
 *     summary: Get public seller profile
 *     tags: [Seller]
 *     parameters:
 *       - in: query
 *         name: sellerId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the seller to fetch
 *     responses:
 *       200: { description: Success }
 */
route.get('/fetchSellerProfile', controller.fetchSellerProfile);

/**
 * @swagger
 * /user/seller/update:
 *   patch:
 *     summary: Update seller profile
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *               firstName:
 *                 type: string
 *                 example: ""
 *               lastName:
 *                 type: string
 *                 example: ""
 *               businessName:
 *                 type: string
 *                 example: ""
 *               businessTag:
 *                 type: string
 *                 example: ""
 *               mobileNumber:
 *                 type: string
 *                 example: ""
 *               gender:
 *                 type: string
 *                 example: ""
 *               email:
 *                 type: string
 *                 example: ""
 *               dob:
 *                 type: string
 *                 example: ""
 *               address:
 *                 type: string
 *                 example: ""
 *               city:
 *                 type: string
 *                 example: ""
 *               state:
 *                 type: string
 *                 example: ""
 *               country:
 *                 type: string
 *                 example: ""
 *               pinCode:
 *                 type: string
 *                 example: ""
 *               landMark:
 *                 type: string
 *                 example: ""
 *               bankName:
 *                 type: string
 *                 example: ""
 *               accountNumber:
 *                 type: string
 *                 example: ""
 *               IFSCCode:
 *                 type: string
 *                 example: ""
 *               branchName:
 *                 type: string
 *                 example: ""
 *               bankBusinessName:
 *                 type: string
 *                 example: ""
 *     responses:
 *       200: { description: Success }
 */
route.patch('/update', upload.fields([{ name: 'image', maxCount: 1 }]), controller.update);

/**
 * @swagger
 * /user/seller/updatePassword:
 *   patch:
 *     summary: Update seller password
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200: { description: Success }
 */
route.patch('/updatePassword', controller.updatePassword);

/**
 * @swagger
 * /user/seller/setPassword:
 *   post:
 *     summary: Set seller password
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Success }
 */
route.post('/setPassword', controller.setPassword);

/**
 * @swagger
 * /user/seller/dashboard:
 *   get:
 *     summary: Get dashboard statistics for seller
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
route.get('/dashboard', controller.getDashboard);

module.exports = route;
