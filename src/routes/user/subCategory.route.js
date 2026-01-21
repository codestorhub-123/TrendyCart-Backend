const express = require('express');
const route = express.Router();
const controller = require('../../controllers/subCategory.controller');

/**
 * @swagger
 * /user/subCategory/fetchActiveSubCategories:
 *   get:
 *     summary: Get active subcategories
 *     tags: [SubCategory]
 *     security:
 *       - bearerAuth: []
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
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Subcategories fetched successfully."
 *                 subCategories:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       createdAt:
 *                         type: string
 */
route.get('/fetchActiveSubCategories', controller.fetchActiveSubCategories);

module.exports = route;
