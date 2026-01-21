const express = require('express');
const route = express.Router();
const withdrawController = require('../../controllers/withdraw.controller');

/**
 * @swagger
 * tags:
 *   name: Withdraw
 *   description: Withdrawal management for users
 */

/**
 * @swagger
 * /user/withdraw/withdrawalList:
 *   get:
 *     summary: Get active withdrawal methods
 *     tags: [Withdraw]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 * */
route.get('/withdrawalList', withdrawController.withdrawalList);

module.exports = route;
