const express = require("express");
const route = express.Router();
const controller = require("../../controllers/seller.controller");

//multer
const multer = require("multer");
const storage = require("../../../utils/multer");
const upload = multer({ storage });

/**
 * @swagger
 * tags:
 *   name: Admin Seller
 *   description: Admin seller management
 */

/**
 * @swagger
 * /admin/seller/getRealSeller:
 *   get:
 *     summary: Get list of all real sellers
 *     tags: [Admin Seller]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of real sellers
 *       500:
 *         description: Internal Server Error
 */
route.get("/getRealSeller", controller.getRealSeller);

/**
 * @swagger
 * /admin/seller/getProfileByAdmin:
 *   get:
 *     summary: Get a specific seller's profile
 *     tags: [Admin Seller]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sellerId
 *         required: true
 *         schema:
 *           type: string
 *         description: The seller ID
 *     responses:
 *       200:
 *         description: Seller profile details
 *       500:
 *         description: Internal Server Error
 */
route.get("/getProfileByAdmin", controller.getProfileByAdmin);

/**
 * @swagger
 * /admin/seller/update:
 *   patch:
 *     summary: Update a real seller's profile
 *     tags: [Admin Seller]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sellerId
 *         required: true
 *         schema:
 *           type: string
 *         description: The seller ID
 *     consumes:
 *       - multipart/form-data
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
 *               lastName:
 *                 type: string
 *               businessName:
 *                 type: string
 *               businessTag:
 *                 type: string
 *               mobileNumber:
 *                 type: string
 *               gender:
 *                 type: string
 *               email:
 *                 type: string
 *               countryCode:
 *                 type: string
 *               address:
 *                 type: string
 *               landMark:
 *                 type: string
 *               city:
 *                 type: string
 *               pinCode:
 *                 type: integer
 *               state:
 *                 type: string
 *               country:
 *                 type: string
 *               bankBusinessName:
 *                 type: string
 *               bankName:
 *                 type: string
 *               accountNumber:
 *                 type: integer
 *               IFSCCode:
 *                 type: string
 *               branchName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Seller profile updated successfully
 *       500:
 *         description: Internal Server Error
 */
route.patch("/update", upload.single("image"), controller.updateProfile);

/**
 * @swagger
 * /admin/seller/blockUnblock:
 *   patch:
 *     summary: Block or unblock a seller
 *     tags: [Admin Seller]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sellerId
 *         required: true
 *         schema:
 *           type: string
 *         description: The seller ID
 *     responses:
 *       200:
 *         description: Seller blocked/unblocked successfully
 *       500:
 *         description: Internal Server Error
 */
route.patch("/blockUnblock", controller.blockUnblock);

/**
 * @swagger
 * /admin/seller/topSellers:
 *   get:
 *     summary: Get top sellers for the dashboard
 *     tags: [Admin Seller]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Top sellers retrieved successfully
 *       500:
 *         description: Internal Server Error
 */
route.get("/topSellers", controller.topSellers);

/**
 * @swagger
 * /admin/seller/sellerWallet:
 *   get:
 *     summary: Get seller wallet information
 *     tags: [Admin Seller]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sellerId
 *         schema:
 *           type: string
 *         description: Optional seller ID to get specific wallet
 *     responses:
 *       200:
 *         description: Seller wallet details
 *       500:
 *         description: Internal Server Error
 */
route.get("/sellerWallet", controller.sellerWallet);

/**
 * @swagger
 * /admin/seller/createFakeSeller:
 *   post:
 *     summary: Create a fake seller account.
 *     tags: [Admin Seller]
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *               video:
 *                 type: string
 *                 format: binary
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               businessName:
 *                 type: string
 *               businessTag:
 *                 type: string
 *               mobileNumber:
 *                 type: string
 *               gender:
 *                 type: string
 *     responses:
 *       200:
 *         description: Fake seller created successfully.
 *       500:
 *         description: Internal Server Error.
 */
route.post("/createFakeSeller", upload.fields([{ name: "image", maxCount: 1 }, { name: "video", maxCount: 1 }]), controller.createFakeSeller);

/**
 * @swagger
 * /admin/seller/updateFakeSellerProfile:
 *   patch:
 *     summary: Update a fake seller's profile.
 *     tags: [Admin Seller]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sellerId
 *         required: true
 *         schema:
 *           type: string
 *         description: The fake seller ID.
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *               video:
 *                 type: string
 *                 format: binary
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               businessName:
 *                 type: string
 *               businessTag:
 *                 type: string
 *               mobileNumber:
 *                 type: string
 *               gender:
 *                 type: string
 *               isLive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Fake seller profile updated successfully.
 *       500:
 *         description: Internal Server Error.
 */
route.patch("/updateFakeSellerProfile", upload.fields([{ name: "image", maxCount: 1 }, { name: "video", maxCount: 1 }]), controller.updateFakeSellerProfile);

/**
 * @swagger
 * /admin/seller/liveOrNot:
 *   patch:
 *     summary: Toggle live status for a fake seller.
 *     tags: [Admin Seller]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sellerId
 *         required: true
 *         schema:
 *           type: string
 *         description: The fake seller ID.
 *     responses:
 *       200:
 *         description: Live status toggled successfully.
 *       500:
 *         description: Internal Server Error.
 */
route.patch("/liveOrNot", controller.liveOrNot);

/**
 * @swagger
 * /admin/seller/getFakeSeller:
 *   get:
 *     summary: Get list of all fake sellers.
 *     tags: [Admin Seller]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page.
 *     responses:
 *       200:
 *         description: List of fake sellers.
 *       500:
 *         description: Internal Server Error.
 */
route.get("/getFakeSeller", controller.getFakeSeller);

/**
 * @swagger
 * /admin/seller/fakeSellers:
 *   get:
 *     summary: Get simple list of fake sellers (for dropdowns).
 *     tags: [Admin Seller]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Simple list of fake sellers.
 *       500:
 *         description: Internal Server Error.
 */
route.get("/fakeSellers", controller.fakeSellers);

/**
 * @swagger
 * /admin/seller/deleteSeller:
 *   delete:
 *     summary: Delete a fake seller.
 *     tags: [Admin Seller]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sellerId
 *         required: true
 *         schema:
 *           type: string
 *         description: The fake seller ID.
 *     responses:
 *       200:
 *         description: Fake seller deleted successfully.
 *       500:
 *         description: Internal Server Error.
 */
route.delete("/deleteSeller", controller.deleteSeller);

module.exports = route;
