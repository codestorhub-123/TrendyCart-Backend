const express = require('express');
const route = express.Router();
const controller = require('../../controllers/follower.controller');

/**
 * @swagger
 * /user/follower/followUnfollow:
 *   post:
 *     summary: Follow or unfollow a seller
 *     tags: [Follower]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sellerId
 *             properties:
 *               sellerId:
 *                 type: string
 *                 description: The ID of the seller
 *     responses:
 *       200:
 *         description: Success
 */
route.post('/followUnfollow', controller.followUnfollow);

/**
 * @swagger
 * /user/follower/getSellerFollowers:
 *   get:
 *     summary: Get follower list of a seller
 *     tags: [Follower]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sellerId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the seller
 *     responses:
 *       200:
 *         description: Success
 */
route.get('/getSellerFollowers', controller.getSellerFollowers);

module.exports = route;
