const express = require('express');
const route = express.Router();
const controller = require('../../controllers/promoCodeCheck.controller');

/**
 * @swagger
 * /user/promoCodeCheck/checkPromoCode:
 *   post:
 *     summary: Check and validate promo code for user
 *     tags: [PromoCodeCheck]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - promocodeId
 *               - userId
 *             properties:
 *               promocodeId:
 *                 type: string
 *                 description: The ID of the promo code to check
 *               userId:
 *                 type: string
 *                 description: The ID of the user
 *     responses:
 *       200:
 *         description: Promo code validation result
 *         content:
 *           application/json:
 *             examples:
 *               valid:
 *                 summary: Valid promo code
 *                 value:
 *                   status: true
 *                   message: "you are able to use that promoCode!"
 *               invalid:
 *                 summary: Invalid promo code / User not found
 *                 value:
 *                   status: false
 *                   message: "promoCode does not found."
 *               alreadyUsed:
 *                 summary: Promo code already used
 *                 value:
 *                   status: false
 *                   message: "you are not able to use that promoCode because that promoCode already used by this user!"
 */
route.post('/checkPromoCode', controller.checkPromoCode);

module.exports = route;
