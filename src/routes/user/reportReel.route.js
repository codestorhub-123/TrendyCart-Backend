const express = require('express');
const route = express.Router();
const controller = require('../../controllers/reportReel.controller');

/**
 * @swagger
 * tags:
 *   name: ReportReel
 *   description: The ReportReel managing API
 */

/**
 * @swagger
 * /user/reportoReel/reportReel:
 *   post:
 *     summary: report to particular reel by the user
 *     tags: [ReportReel]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - reelId
 *               - description
 *             properties:
 *               userId:
 *                 type: string
 *               reelId:
 *                 type: string
 *               description:
 *                 type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Report submitted successfully
 */
route.post('/reportReel', controller.reportReel);

module.exports = route;
