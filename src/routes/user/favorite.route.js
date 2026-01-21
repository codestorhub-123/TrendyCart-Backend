const express = require('express');
const route = express.Router();
const controller = require('../../controllers/favorite.controller');

//favorite or unfavorite product
/**
 * @swagger
 * /user/favorite/favoriteUnfavorite:
 *   post:
 *     summary: Favorite or unfavorite a product
 *     tags: [Favorite]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *             properties:
 *               productId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success
 */


route.post('/favoriteUnfavorite', controller.favoriteUnfavorite);

//get favorite products
/**
 * @swagger
 * /user/favorite/favoriteProduct:
 *   get:
 *     summary: Get user's favorite products
 *     tags: [Favorite]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the user
 *     responses:
 *       200:
 *         description: Success
 */
route.get('/favoriteProduct', controller.favoriteProduct);

module.exports = route;
