const express = require("express");
const route = express.Router();
const controller = require("../../controllers/review.controller");

/**
 * @swagger
 * /admin/review/getreview:
 *   get:
 *     summary: Get reviews for a product (Admin)
 *     tags: [Admin Review]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
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
 */
route.get("/getreview", controller.getReviews);

/**
 * @swagger
 * /admin/review/delete:
 *   delete:
 *     summary: Delete a review (Admin)
 *     tags: [Admin Review]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
route.delete("/delete", controller.delete);

module.exports = route;
