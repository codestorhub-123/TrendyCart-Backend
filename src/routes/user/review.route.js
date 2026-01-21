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

module.exports = route;
