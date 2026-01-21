const express = require("express");
const route = express.Router();
const controller = require("../../controllers/reportReason.controller");

/**
 * @swagger
 * /admin/reportReason/createReportreason:
 *   post:
 *     summary: Create a new report reason
 *     tags: [Admin Report Reason]
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
 * /admin/reportReason/updateReportreason:
 *   patch:
 *     summary: Update an existing report reason
 *     tags: [Admin Report Reason]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: reportReasonId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success
 * */
route.patch("/updateReportreason", controller.updateReportReason);

/**
 * @swagger
 * /admin/reportReason/deleteReportreason:
 *   delete:
 *     summary: Delete a report reason
 *     tags: [Admin Report Reason]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: reportReasonId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 * */
route.delete("/deleteReportreason", controller.deleteReportReason);

/**
 * @swagger
 * /admin/reportReason/getReportreason:
 *   get:
 *     summary: Get all report reasons
 *     tags: [Admin Report Reason]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Success
 * */
route.get("/getReportreason", controller.getReportreason);

module.exports = route;
