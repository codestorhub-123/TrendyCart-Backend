const express = require('express');
const route = express.Router();
const controller = require('../../controllers/sellerRequest.controller');

/**
 * @swagger
 * tags:
 *   name: Admin Seller Request
 *   description: Admin management of seller requests
 */

/**
 * @swagger
 * /admin/sellerRequest/:
 *   get:
 *     summary: Get all seller requests
 *     tags: [Admin Seller Request]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start
 *         schema:
 *           type: integer
 *         description: Start index for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items to return
 *     responses:
 *       200:
 *         description: Success
 */
route.get('/', controller.getAll);

/**
 * @swagger
 * /admin/sellerRequest/update:
 *   patch:
 *     summary: Update a seller request
 *     tags: [Admin Seller Request]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sellerRequestId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               businessName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success
 */
route.patch('/update', controller.updateRequest);

/**
 * @swagger
 * /admin/sellerRequest/acceptOrNot:
 *   patch:
 *     summary: Accept or decline a seller request
 *     tags: [Admin Seller Request]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sellerRequestId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: action
 *         required: true
 *         schema:
 *           type: string
 *           enum: [accept, decline]
 *         description: Action to perform (accept or decline)
 *     responses:
 *       200:
 *         description: Success
 */
route.patch('/acceptOrNot', controller.acceptOrNot);

module.exports = route;
