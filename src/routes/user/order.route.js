const express = require('express');
const route = express.Router();
const controller = require('../../controllers/order.controller');

//create order
/**
 * @swagger
 * /user/order/create:
 *   post:
 *     summary: Create a new order
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - shippingAddress
 *               - items
 *               - finalTotal
 *             properties:
 *               userId:
 *                 type: string
 *                 description: Optional if provided via Bearer token
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - productId
 *                     - sellerId
 *                     - purchasedTimeProductPrice
 *                     - productQuantity
 *                   properties:
 *                     productId:
 *                       type: string
 *                     sellerId:
 *                       type: string
 *                     purchasedTimeProductPrice:
 *                       type: number
 *                     productQuantity:
 *                       type: number
 *                     attributesArray:
 *                       type: array
 *                       items:
 *                          type: object
 *               shippingAddress:
 *                 type: object
 *                 required:
 *                   - name
 *                   - country
 *                   - state
 *                   - city
 *                   - zipCode
 *                   - address
 *                 properties:
 *                   name:
 *                     type: string
 *                   country:
 *                     type: string
 *                   state:
 *                     type: string
 *                   city:
 *                     type: string
 *                   zipCode:
 *                     type: number
 *                   address:
 *                     type: string
 *               paymentGateway:
 *                 type: string
 *               promoCode:
 *                 type: string
 *               finalTotal:
 *                 type: number
 *             example:
 *               userId: "60d0fe4f5311236168a109ca"
 *               items:
 *                 - productId: "6957b97c120b0f910fb6783b"
 *                   sellerId: "69575409120b0f910fb66f9a"
 *                   purchasedTimeProductPrice: 20000
 *                   productQuantity: 4
 *                   attributesArray:
 *                     - name: "color"
 *                       value: "white"
 *               shippingAddress:
 *                 name: "string"
 *                 country: "string"
 *                 state: "string"
 *                 city: "string"
 *                 zipCode: 0
 *                 address: "string"
 *               paymentGateway: "string"
 *               promoCode: "string"
 *               finalTotal: 8000
 *     responses:
 *       200:
 *         description: Order created successfully
 */
route.post('/create', controller.create);

//cancel the order by user
/**
 * @swagger
 * /user/order/cancelOrderByUser:
 *   patch:
 *     summary: Cancel an order item
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *       - in: query
 *         name: orderId
 *         schema:
 *           type: string
 *         required: true
 *       - in: query
 *         name: itemId
 *         schema:
 *           type: string
 *         required: true
 *         description: The _id of the item within the order
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Cancelled]
 *         required: true
 *     responses:
 *       200:
 *         description: Order item cancelled successfully
 */
route.patch('/cancelOrderByUser', controller.cancelOrderByUser);

//get status wise order details for user
/**
 * @swagger
 * /user/order/orderDetailsForUser:
 *   get:
 *     summary: Get order details for user
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Optional if provided via Bearer token
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Pending, Confirmed, Out Of Delivery, Delivered, Cancelled, All]
 *         description: Filter by order status (e.g. Pending, All)
 *     responses:
 *       200:
 *         description: Success
 */
route.get('/orderDetailsForUser', controller.orderDetailsForUser);

//update order (within payment reminder min payment made)
/**
 * @swagger
 * /user/order/modifyOrderItemStatus:
 *   patch:
 *     summary: Modify order item status (e.g. for auction payment confirmation)
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: orderId
 *         schema:
 *           type: string
 *         required: true
 *       - in: query
 *         name: itemId
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Success
 */
route.patch('/modifyOrderItemStatus', controller.modifyOrderItemStatus);

//get status wise order counts for seller
/**
 * @swagger
 * /user/order/orderCountForSeller:
 *   get:
 *     summary: get status wise order counts for seller
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sellerId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
route.get('/orderCountForSeller', controller.orderCountForSeller);

//get status wise order details for seller
/**
 * @swagger
 * /user/order/orderDetailsForSeller:
 *   get:
 *     summary: get status wise order details for seller
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sellerId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *           enum: [Pending, Confirmed, Out Of Delivery, Delivered, Cancelled, Manual Auction Pending Payment, Manual Auction Cancelled, Auction Pending Payment, Auction Cancelled, All]
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
 *         description: Success
 */
route.get('/orderDetailsForSeller', controller.orderDetailsForSeller);

//update order (seller and admin)
/**
 * @swagger
 * /user/order/updateOrder:
 *   patch:
 *     summary: update statusWise the order by seller and admin
 *     tags: [Order]
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
