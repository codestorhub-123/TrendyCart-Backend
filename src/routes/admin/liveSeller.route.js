const express = require('express');
const route = express.Router();
const controller = require('../../controllers/liveSeller.controller');

/**
 * @swagger
 * /admin/liveSeller/liveSellerList:
 *   get:
 *     summary: Get list of live sellers for admin
 *     tags: [Admin LiveSeller]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Success
 */
route.get('/liveSellerList', controller.liveSellerList);

/**
 * @swagger
 * /admin/liveSeller/retrieveLiveAnalytics:
 *   patch:
 *     summary: Get live analytics for admin
 *     tags: [Admin LiveSeller]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: liveHistoryId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the live history
 *     responses:
 *       200:
 *         description: Success
 */
route.patch('/retrieveLiveAnalytics', controller.retrieveLiveAnalytics);

module.exports = route;
