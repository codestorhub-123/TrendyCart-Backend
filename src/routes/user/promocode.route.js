const express = require("express");
const route = express.Router();
const controller = require("../../controllers/promocode.controller");

/**
 * @swagger
 * tags:
 *   name: User Promo Code
 *   description: The User Promo Code managing API
 */

/**
 * @swagger
 * /user/promoCode/getAll:
 *   get:
 *     summary: Get all promo codes
 *     tags: [User Promo Code]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
route.get("/getAll", controller.getAll);

module.exports = route;
