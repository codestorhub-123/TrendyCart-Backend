const express = require('express');
const route = express.Router();
const controller = require('../../controllers/notification.controller');

/**
 * @swagger
 * /user/notification/list:
 *   get:
 *     summary: Get notification list for user
 *     tags: [Notification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
route.get('/list', controller.list);

module.exports = route;
