const express = require('express');
const route = express.Router();
const controller = require('../../controllers/review.controller');

/**
 * @swagger
 * tags:
 *   name: Review
 *   description: The Review managing API
 */

/**
 * @swagger
 * /user/review/create:
 *   post:
 *     summary: create review by user
 *     tags: [Review]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - productId
 *               - review
 *             properties:
 *               userId:
 *                 type: string
 *               productId:
 *                 type: string
 *               review:
 *                 type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Review created successfully
 */
route.post('/create', controller.create);

/**
 * @swagger
 * /user/review/getreview:
 *   get:
 *     summary: Get reviews for a product
 *     tags: [Review]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Success
 */
route.get('/getreview', controller.getReviews);

module.exports = route;
