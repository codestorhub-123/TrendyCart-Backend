const express = require('express');
const route = express.Router();
const controller = require('../../controllers/withdrawRequest.controller');

/**
 * @swagger
 * /user/withdrawRequest/initiateCashOut:
 *   post:
 *     summary: Initiate cash withdrawal
 *     tags: [Withdraw Request]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - paymentGateway
 *               - paymentDetails
 *             properties:
 *               sellerId:
 *                 type: string
 *                 description: Optional. If not provided, inferred from logged-in user.
 *               amount:
 *                 type: number
 *               paymentGateway:
 *                 type: string
 *               paymentDetails:
 *                 type: array
 *     responses:
 *       200:
 *         description: Success
 * */
route.post('/initiateCashOut', controller.initiateCashOut);

/**
 * @swagger
 * /user/withdrawRequest/getWithdrawalRequestsBySeller:
 *   get:
 *     summary: Get seller's withdrawal history
 *     tags: [Withdraw Request]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 * */
route.get('/getWithdrawalRequestsBySeller', controller.getWithdrawalRequestsBySeller);

module.exports = route;
