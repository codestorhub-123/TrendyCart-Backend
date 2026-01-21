const express = require('express');
const route = express.Router();
const controller = require('../../controllers/rating.controller');

/**
 * @swagger
 * tags:
 *   name: Rating
 *   description: Product rating management
 */

/**
 * @swagger
 * /user/rating/addRating:
 *   post:
 *     summary: Add rating and review to a product
 *     tags: [Rating]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - rating
 *             properties:
 *               productId:
 *                 type: string
 *                 example: "6957b97c120b0f910fb6783b"
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 4.5
 *               review:
 *                 type: string
 *                 example: "Great product! Highly recommended."
 *     responses:
 *       200:
 *         description: Rating added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Rating added successfully"
 *                 rating:
 *                   type: object
 *                   example:
 *                     userId: "695f3a95a55c171dfc255dbf"
 *                     productId: "6957b97c120b0f910fb6783b"
 *                     rating: 4.5
 *                     review: "Great product! Highly recommended."
 */
route.post('/addRating', controller.addRating);


/**
 * @swagger
 * /user/rating/:
 *   get:
 *     summary: get allProduct avgRating
 *     tags: [Rating]
 *     responses:
 *       200:
 *         description: Ratings fetched successfully
 *     security:
 *       - bearerAuth: []
 */
route.get('/', controller.getRating);

module.exports = route;
