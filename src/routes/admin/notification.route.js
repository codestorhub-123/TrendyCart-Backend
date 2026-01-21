const express = require("express");
const route = express.Router();
const notificationController = require("../../controllers/notification.controller");
const multer = require("multer");
const storage = require("../../../utils/multer");
const upload = multer({ storage: storage });

/**
 * @swagger
 * tags:
 *   name: Admin Notification
 *   description: Admin notification management
 */

/**
 * @swagger
 * /admin/notification/send:
 *   post:
 *     summary: Send notification to all users/sellers/both
 *     tags: [Admin Notification]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - message
 *               - type
 *             properties:
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary

 *               type:
 *                 type: integer
 *                 description: 1:Users, 2:Sellers, 3:Both
 *     responses:
 *       200:
 *         description: Success
 */
route.post("/send", upload.single("image"), notificationController.send);

/**
 * @swagger
 * /admin/notification/particularSeller:
 *   post:
 *     summary: Send notification to a specific seller
 *     tags: [Admin Notification]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - sellerId
 *               - title
 *               - message
 *             properties:
 *               sellerId:
 *                 type: string
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Success
 */
route.post("/particularSeller", upload.single("image"), notificationController.particularSeller);

module.exports = route;
