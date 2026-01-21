const express = require('express');
const route = express.Router();
const controller = require('../../controllers/reportReason.controller');

/**
 * @swagger
 * /user/reportReason/createReportreason:
 *   post:
 *     summary: Create a new report reason
 *     tags: [ReportReason]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success
 * */
route.post("/createReportreason", controller.createReportReason);

/**
 * @swagger
 * /user/reportReason/getReportreason:
 *   get:
 *     summary: Get all report reasons
 *     tags: [ReportReason]
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
 *                   example: "Retrive reportReason Successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "65b23..."
 *                       reason:
 *                         type: string
 *                         example: "Inappropriate content"
 *                       createdAt:
 *                         type: string
 *                       updatedAt:
 *                         type: string
 */
route.get('/getReportreason', controller.getReportreason);

module.exports = route;
