const express = require('express');
const route = express.Router();
const controller = require('../../controllers/faq.controller');

/**
 * @swagger
 * /user/FAQ/:
 *   get:
 *     summary: Get all FAQs
 *     tags: [FAQ]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
route.get('/', controller.getFAQs);

module.exports = route;
