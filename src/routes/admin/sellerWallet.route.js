const express = require('express');
const route = express.Router();
const controller = require('../../controllers/sellerWallet.controller');

/**
 * @swagger
 * /admin/sellerWallet/fetchAdminEarnings:
 *   get:
 *     summary: Get total admin earnings and history
 *     tags: [Admin Seller Wallet]
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
 *       - in: query
 *         name: startDate
 *         description: DD-MM-YYYY
 *         schema:
 *           type: string
 *       - in: query
 *         name: endDate
 *         description: DD-MM-YYYY
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 * */
route.get('/fetchAdminEarnings', controller.fetchAdminEarnings);

/**
 * @swagger
 * /admin/sellerWallet/retrieveSellerTransactions:
 *   get:
 *     summary: Get wallet transactions for a specific seller
 *     tags: [Admin Seller Wallet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sellerId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         description: 1=Credit (Deposit), 2=Debit (Withdrawal)
 *         schema:
 *           type: integer
 *       - in: query
 *         name: start
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: startDate
 *         description: DD-MM-YYYY
 *         schema:
 *           type: string
 *       - in: query
 *         name: endDate
 *         description: DD-MM-YYYY
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 * */
route.get('/retrieveSellerTransactions', controller.retrieveSellerTransactions);

module.exports = route;
