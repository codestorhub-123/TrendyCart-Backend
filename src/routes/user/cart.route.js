const express = require('express');
const route = express.Router();
const controller = require('../../controllers/cart.controller');

//add to cart
/**
 * @swagger
 * /user/cart/addToCart:
 *   post:
 *     summary: Add product to cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - productId
 *               - productQuantity
 *               - attributesArray
 *             properties:
 *               userId:
 *                 type: string
 *               productId:
 *                 type: string
 *               productQuantity:
 *                 type: integer
 *               attributesArray:
 *                 type: array
 *                 items:
 *                   type: object
 *                   example:
 *                     name: "Material"
 *                     value: "wood"
 *     responses:
 *       200:
 *         description: Success
 */
route.post('/addToCart', controller.addToCart);

//remove product from cart
/**
 * @swagger
 * /user/cart/removeProduct:
 *   patch:
 *     summary: Remove product from cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - productId
 *               - productQuantity
 *               - attributesArray
 *             properties:
 *               userId:
 *                 type: string
 *               productId:
 *                 type: string
 *               productQuantity:
 *                 type: integer
 *               attributesArray:
 *                 type: array
 *                 items:
 *                   type: object
 *                 example:
 *                     name: "Material"
 *                     value: "wood"
 *     responses:
 *       200:
 *         description: Success
 */
route.patch('/removeProduct', controller.removeProduct);

//get cart products
/**
 * @swagger
 * /user/cart/getCartProduct:
 *   get:
 *     summary: Get all products in cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Success
 */
route.get('/getCartProduct', controller.getCartProduct);

//delete cart
/**
 * @swagger
 * /user/cart/deleteCart:
 *   delete:
 *     summary: Delete user cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Success
 */
route.delete('/deleteCart', controller.deleteCart);

module.exports = route;
