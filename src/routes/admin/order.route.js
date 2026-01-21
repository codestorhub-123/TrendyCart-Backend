const express = require('express');
const route = express.Router();
const controller = require('../../controllers/order.controller');

// Get all orders
/**
 * @swagger
 * /admin/order/getOrders:
 *   get:
 *     summary: Get all orders
 *     tags: [Admin Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Start index for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Limit for pagination
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Pending, Confirmed, Out For Delivery, Delivered, Cancelled, Manual Auction Pending Payment, Manual Auction Cancelled, Auction Pending Payment, Auction Cancelled, All]
 *         description: Filter by order status
 *     responses:
 *       200:
 *         description: All orders retrieved successfully
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
 *                   example: "All orders retrieved successfully."
 *                 total:
 *                   type: integer
 *                   example: 100
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 */
route.get('/getOrders', controller.getOrders);

// Get orders for a specific user
/**
 * @swagger
 * /admin/order/ordersOfUser:
 *   get:
 *     summary: Get orders for a specific user
 *     tags: [Admin Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: query
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *           enum: [Pending, Confirmed, Out Of Delivery, Delivered, Cancelled, All]
 *         description: Order Status
 *       - in: query
 *         name: start
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: User orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 messages:
 *                   type: string
 *                   example: "Retrive OrderHistory for User with status All"
 *                 totalOrder:
 *                   type: integer
 *                   example: 5
 *                 orderData:
 *                   type: array
 *                   items:
 *                     type: object
 */
route.get('/ordersOfUser', controller.ordersOfUser);

// Get orders for a specific seller
/**
 * @swagger
 * /admin/order/ordersOfSeller:
 *   get:
 *     summary: Get orders for a specific seller
 *     tags: [Admin Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sellerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Seller ID
 *       - in: query
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *           enum: [Pending, Confirmed, Out Of Delivery, Delivered, Cancelled, Manual Auction Pending Payment, Manual Auction Cancelled, Auction Pending Payment, Auction Cancelled, All]
 *         description: Order Status
 *       - in: query
 *         name: start
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Seller orders retrieved successfully
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
 *                   example: "Order history for seller with status All"
 *                 total:
 *                   type: integer
 *                   example: 20
 *                 orders:
 *                   type: array
 *                   items:
 *                     type: object
 */
route.get('/ordersOfSeller', controller.ordersOfSeller);

// Get details of a specific order
/**
 * @swagger
 * /admin/order/orderDetails:
 *   get:
 *     summary: Get details of a specific order
 *     tags: [Admin Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order details retrieved successfully
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
 *                   example: "Retrive order details for admin."
 *                 order:
 *                   type: object
 */
route.get('/orderDetails', controller.orderDetails);

// Get recent orders for dashboard
/**
 * @swagger
 * /admin/order/recentOrders:
 *   get:
 *     summary: Get recent orders for dashboard
 *     tags: [Admin Order]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recent orders retrieved successfully
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
 *                   example: "Retrive recent orders!"
 *                 orders:
 *                   type: array
 *                   items:
 *                     type: object
 */
route.get('/recentOrders', controller.recentOrders);



// Update order status
/**
 * @swagger
 * /admin/order/updateOrder:
 *   patch:
 *     summary: Update order status
 *     tags: [Admin Order]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - itemId
 *               - status
 *             properties:
 *               orderId:
 *                 type: string
 *               itemId:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [Pending, Confirmed, Out Of Delivery, Delivered, Cancelled]
 *               deliveredServiceName:
 *                 type: string
 *               trackingId:
 *                 type: string
 *               trackingLink:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success
 */
route.patch('/updateOrder', controller.updateOrder);

module.exports = route;

