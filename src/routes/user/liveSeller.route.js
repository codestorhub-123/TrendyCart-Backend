const express = require('express');
const route = express.Router();
const controller = require('../../controllers/liveSeller.controller');

//get selected products
/**
 * @swagger
 * /user/liveSeller/getSelectedProducts:
 *   get:
 *     summary: Get selected products for the user (Live Seller)
 *     tags: [LiveSeller]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: liveSellingHistoryId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the live selling history
 *     responses:
 *       200:
 *         description: Success
 */
route.get('/getSelectedProducts', controller.getSelectedProducts);

/**
 * @swagger
 * /user/liveSeller/:
 *   post:
 *     summary: Seller goes live
 *     tags: [LiveSeller]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sellerId
 *               - liveType
 *             properties:
 *               sellerId:
 *                 type: string
 *                 description: The ID of the seller
 *               liveType:
 *                 type: integer
 *                 description: Type of live session (e.g., 1 for Normal, 2 for Auction)
 *               agoraUID:
 *                 type: integer
 *                 description: Optional Agora UID
 *               productIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Optional array of product IDs to select for the live session
 *     responses:
 *       200:
 *         description: Success
 */
route.post('/', controller.sellerGoLive);

/**
 * @swagger
 * /user/liveSeller/liveSellerList:
 *   get:
 *     summary: Get list of live sellers
 *     tags: [LiveSeller]
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Optional User ID to exclude
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
 *           default: 20
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Success
 */
route.get('/liveSellerList', controller.liveSellerList);

/**
 * @swagger
 * /user/liveSeller/retrieveProductList:
 *   get:
 *     summary: Get product list for live seller
 *     tags: [LiveSeller]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sellerId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the seller
 *     responses:
 *       200:
 *         description: Success
 */
route.get('/retrieveProductList', controller.retrieveProductList);

/**
 * @swagger
 * /user/liveSeller/setSellerLiveWithProducts:
 *   post:
 *     summary: Set seller live with products
 *     tags: [LiveSeller]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sellerId
 *               - productIds
 *             properties:
 *               sellerId:
 *                 type: string
 *                 description: The ID of the seller
 *               productIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of product IDs to select
 *     responses:
 *       200:
 *         description: Success
 */
route.post('/setSellerLiveWithProducts', controller.setSellerLiveWithProducts);

/**
 * @swagger
 * /user/liveSeller/setSellerOfflineAndResetProducts:
 *   patch:
 *     summary: Stop live and reset products
 *     tags: [LiveSeller]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sellerId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the seller to set offline
 *     responses:
 *       200:
 *         description: Success
 */
route.patch('/setSellerOfflineAndResetProducts', controller.setSellerOfflineAndResetProducts);

/**
 * @swagger
 * /user/liveSeller/retrieveLiveAnalytics:
 *   patch:
 *     summary: Get live analytics
 *     tags: [LiveSeller]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: liveHistoryId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the live history
 *     responses:
 *       200:
 *         description: Success
 */
route.patch('/retrieveLiveAnalytics', controller.retrieveLiveAnalytics);

module.exports = route;
