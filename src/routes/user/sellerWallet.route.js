const express = require('express');
const route = express.Router();
const controller = require('../../controllers/sellerWallet.controller');

/**
 * @swagger
 * /user/sellerWallet/retrieveSellerWalletHistory:
 *   get:
 *     summary: Get seller wallet history
 *     tags: [Seller Wallet]
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 wallet:
 *                   type: object
 *                   properties:
 *                     balance:
 *                       type: number
 *                     totalCredit:
 *                       type: number
 *                     totalDebit:
 *                       type: number
 *                 transactions:
 *                   type: array
 */
route.get('/retrieveSellerWalletHistory', controller.retrieveSellerWalletHistory);

module.exports = route;
