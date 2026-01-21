const express = require("express");
const route = express.Router();
const controller = require("../../controllers/promocode.controller");

/**
 * @swagger
 * /admin/promoCode/create:
 *   post:
 *     summary: Create a new promo code
 *     tags: [Admin Promo Code]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - promoCode
 *               - discountType
 *               - discountAmount
 *             properties:
 *               promoCode:
 *                 type: string
 *               discountType:
 *                 type: integer
 *                 description: 0 for flat, 1 for percentage
 *               discountAmount:
 *                 type: number
 *               minOrderValue:
 *                 type: number
 *               conditions:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Success
 */
route.post("/create", controller.create);

/**
 * @swagger
 * /admin/promoCode/update:
 *   post:
 *     summary: Update an existing promo code
 *     tags: [Admin Promo Code]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: promoCodeId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               promoCode:
 *                 type: string
 *               discountType:
 *                 type: integer
 *               discountAmount:
 *                 type: number
 *               minOrderValue:
 *                 type: number
 *               conditions:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Success
 */
route.post("/update", controller.update);

/**
 * @swagger
 * /admin/promoCode/delete:
 *   delete:
 *     summary: Delete a promo code
 *     tags: [Admin Promo Code]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: promoCodeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
route.delete("/delete", controller.delete);

/**
 * @swagger
 * /admin/promoCode/getAll:
 *   get:
 *     summary: Get all promo codes
 *     tags: [Admin Promo Code]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
route.get("/getAll", controller.getAll);

module.exports = route;
