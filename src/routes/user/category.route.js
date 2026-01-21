const express = require('express');
const route = express.Router();
const controller = require('../../controllers/category.controller');

/**
 * @swagger
 * /user/category :
 *   get:
 *     summary: Get all categories with subcategories
 *     tags: [Category]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Success }
 */
route.get('/', controller.getCategory);

module.exports = route;
