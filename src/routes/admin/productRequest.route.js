const express = require('express');
const route = express.Router();
const controller = require('../../controllers/productRequest.controller');

/**
 * @swagger
 * /admin/productRequest/updateProductRequestStatusWise:
 *   get:
 *     summary: Get product update requests filtered by status
 *     tags: [Admin Product Request]
 *     security:
 *       - bearerAuth: []
 *     description: Retrieve a list of product update requests, optionally filtered by status (Pending/Approved/Rejected/All).
 *     parameters:
 *       - in: query
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *           enum: [Pending, Approved, Rejected, All]
 *         description: Filter requests by status.
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
 *                   example: "Retrive product's request to update the product with status Pending"
 *                 productRequests:
 *                   type: array
 *                   items:
 *                     type: object
 */
route.get('/updateProductRequestStatusWise', controller.updateProductRequestStatusWise);

/**
 * @swagger
 * /admin/productRequest/acceptUpdateRequest:
 *   patch:
 *     summary: Accept or decline a product update request
 *     tags: [Admin Product Request]
 *     security:
 *       - bearerAuth: []
 *     description: Approve or decline a specific product update request.
 *     parameters:
 *       - in: query
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the product update request.
 *       - in: query
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [Approved, Rejected]
 *         description: Action to take on the request.
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
 *                   example: "Product request accepted by the admin for update that product."
 *                 updateRequest:
 *                   type: object
 */
route.patch('/acceptUpdateRequest', controller.acceptUpdateRequest);

/**
 * @swagger
 * /admin/productRequest/createProductRequestStatusWise:
 *   get:
 *     summary: Get product creation requests filtered by status
 *     tags: [Admin Product Request]
 *     security:
 *       - bearerAuth: []
 *     description: Retrieve a list of products (creation requests), optionally filtered by status (Pending/Approved/Rejected/All).
 *     parameters:
 *       - in: query
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *           enum: [Pending, Approved, Rejected, All]
 *         description: Filter creations by status.
 *     responses:
 *       200:
 *         description: Success
 */
route.get('/createProductRequestStatusWise', controller.createProductRequestStatusWise);

/**
 * @swagger
 * /admin/productRequest/acceptCreateRequest:
 *   patch:
 *     summary: Accept or decline a product creation request
 *     tags: [Admin Product Request]
 *     security:
 *       - bearerAuth: []
 *     description: Approve or decline a new product creation request.
 *     parameters:
 *       - in: query
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the product.
 *       - in: query
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [Approved, Rejected]
 *         description: Action to take on the request.
 *     responses:
 *       200:
 *         description: Success
 */
route.patch('/acceptCreateRequest', controller.acceptCreateRequest);



module.exports = route;
