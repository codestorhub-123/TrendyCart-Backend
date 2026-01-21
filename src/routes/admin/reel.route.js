const express = require("express");
const route = express.Router();
const controller = require("../../controllers/reel.controller");
const multer = require("multer");
const storage = require("../../../utils/multer");
const upload = multer({ storage });

/**
 * @swagger
 * /admin/reel/uploadReelByAdmin:
 *   post:
 *     summary: Upload a fake/admin reel
 *     tags: [Admin Reel]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - sellerId
 *               - productIds
 *             properties:
 *               sellerId:
 *                 type: string
 *               productIds:
 *                 type: string
 *                 description: array of product IDs or JSON string
 *               video:
 *                 type: string
 *                 format: binary
 *               thumbnail:
 *                 type: string
 *                 format: binary
 *               description:
 *                 type: string
 *               duration:
 *                 type: integer
 *               videoType:
 *                 type: integer
 *                 description: 1=File, 2=Link (Send link in video field if type 2)
 *               thumbnailType:
 *                 type: integer
 *                 description: 1=File, 2=Link (Send link in thumbnail field if type 2)
 *     responses:
 *       200:
 *         description: Success
 * */
route.post(
    "/uploadReelByAdmin",
    upload.fields([{ name: "video" }, { name: "thumbnail" }]),
    controller.uploadReelByAdmin
);

/**
 * @swagger
 * /admin/reel/updateReelByAdmin:
 *   patch:
 *     summary: Update a fake/admin reel
 *     tags: [Admin Reel]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sellerId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: reelId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *               video:
 *                 type: string
 *                 format: binary
 *               thumbnail:
 *                 type: string
 *                 format: binary
 *               description:
 *                 type: string
 *               duration:
 *                 type: integer
 *               videoType:
 *                 type: integer
 *               thumbnailType:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Success
 * */
route.patch(
    "/updateReelByAdmin",
    upload.fields([{ name: "video" }, { name: "thumbnail" }]),
    controller.updateReelByAdmin
);

/**
 * @swagger
 * /admin/reel/getReels:
 *   get:
 *     summary: Get list of fake/admin reels
 *     tags: [Admin Reel]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Success
 * */
route.get("/getReels", controller.getReels);

/**
 * @swagger
 * /admin/reel/getRealReels:
 *   get:
 *     summary: Get list of real (seller) reels
 *     tags: [Admin Reel]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Success
 * */
route.get("/getRealReels", controller.getRealReels);

/**
 * @swagger
 * /admin/reel/detailsOfReel:
 *   get:
 *     summary: Get details of a specific reel
 *     tags: [Admin Reel]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: reelId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 * */
route.get("/detailsOfReel", controller.detailsOfReel);

/**
 * @swagger
 * /admin/reel/likeHistoryOfReel:
 *   get:
 *     summary: Get like history for a reel
 *     tags: [Admin Reel]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: reelId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 * */
route.get("/likeHistoryOfReel", controller.likeHistoryOfReel);

/**
 * @swagger
 * /admin/reel/deleteReel:
 *   delete:
 *     summary: Delete a reel
 *     tags: [Admin Reel]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: reelId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 * */
route.delete("/deleteReel", controller.deleteReel);

module.exports = route;
