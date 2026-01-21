const express = require("express");
const route = express.Router();
const controller = require("../../controllers/reportReel.controller");

/**
 * @swagger
 * /admin/reportoReel/reportsOfReel:
 *   get:
 *     summary: Get list of reported reels
 *     tags: [Admin Report Reel]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [All, Pending, Solved]
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
route.get("/reportsOfReel", controller.reportsOfReel);

/**
 * @swagger
 * /admin/reportoReel/resolveReport:
 *   patch:
 *     summary: Mark a report as resolved
 *     tags: [Admin Report Reel]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: reportId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 * */
route.patch("/resolveReport", controller.resolveReport);

/**
 * @swagger
 * /admin/reportoReel/deleteReport:
 *   delete:
 *     summary: Delete a report
 *     tags: [Admin Report Reel]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: reportId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 * */
route.delete("/deleteReport", controller.deleteReport);

module.exports = route;
