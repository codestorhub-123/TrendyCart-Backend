const express = require('express');
const route = express.Router();
const controller = require('../../controllers/reel.controller');
const multer = require("multer");
const storage = require("../../../utils/multer");
const upload = multer({ storage });

/**
 * @swagger
 * tags:
 *   name: Reel
 *   description: The Reel managing API
 */

/**
 * @swagger
 * /user/reel/getReelsForUser:
 *   get:
 *     summary: get all reels for user
 *     tags: [Reel]
 *     parameters:
 *       - in: query
 *         name: reelId
 *         required: false
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
 *           example: 20
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Reels fetched successfully
 */
route.get('/getReelsForUser', controller.getReelsForUser);

/**
 * @swagger
 * /user/reel/likeOrDislikeOfReel:
 *   post:
 *     summary: like or dislike reel
 *     tags: [Reel]
 *     parameters:
 *       - in: query
 *         name: reelId
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Reel like/dislike status updated
 */
route.post('/likeOrDislikeOfReel', controller.likeOrDislikeOfReel);

/**
 * @swagger
 * /user/reel/uploadReel:
 *   post:
 *     summary: upload reel by the seller
 *     tags: [Reel]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
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
route.post("/uploadReel", upload.fields([{ name: "video" }, { name: "thumbnail" }]), controller.uploadReel);

/**
 * @swagger
 * /user/reel/reelsOfSeller:
 *   get:
 *     summary: get particular seller's reel by the seller
 *     tags: [Reel]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sellerId
 *         required: false
 *         schema:
 *           type: string
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
route.get("/reelsOfSeller", controller.reelsOfSeller);

/**
 * @swagger
 * /user/reel/deleteReel:
 *   delete:
 *     summary: delete reel (seller)
 *     tags: [Reel]
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

/**
 * @swagger
 * /user/reel/detailsOfReel:
 *   get:
 *     summary: get details of a specific reel
 *     tags: [Reel]
 *    
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

module.exports = route;
