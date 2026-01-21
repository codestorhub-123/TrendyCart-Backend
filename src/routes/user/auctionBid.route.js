const express = require('express');
const route = express.Router();
const controller = require('../../controllers/auctionBid.controller');

//get user auction bids
/**
 * @swagger
 * /user/auctionBid/getUserAuctionBids:
 *   get:
 *     summary: Get auction bids for a user
 *     tags: [AuctionBid]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Success
 */
route.get('/getUserAuctionBids', controller.getUserAuctionBids);

//place manual bid
/**
 * @swagger
 * /user/auctionBid/placeManualBid:
 *   post:
 *     summary: Place a manual auction bid
 *     tags: [AuctionBid]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - productId
 *               - bidAmount
 *             properties:
 *               userId:
 *                 type: string
 *               productId:
 *                 type: string
 *               bidAmount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Success
 */
route.post('/placeManualBid', controller.placeManualBid);

//get bids received by a seller
/**
 * @swagger
 * /user/auctionBid/getSellerAuctionBids:
 *   get:
 *     summary: Get bids received by a seller
 *     tags: [AuctionBid]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
route.get('/getSellerAuctionBids', controller.getSellerAuctionBids);

//get bids for a specific product
/**
 * @swagger
 * /user/auctionBid/getProductWiseUserBids:
 *   get:
 *     summary: Get bids for a specific product
 *     tags: [AuctionBid]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
route.get('/getProductWiseUserBids', controller.getProductWiseUserBids);

module.exports = route;
