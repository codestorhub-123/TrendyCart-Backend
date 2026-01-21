const express = require('express');
const route = express.Router();
const controller = require('../../controllers/user.controller');

/**
 * @swagger
 * /admin/user:
 *   get:
 *     summary: Get all users for admin panel
 *     tags: [Admin User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of users to return
 *     responses:
 *       200:
 *         description: Success
 */
route.get('/', controller.getAllUsers);

/**
 * @swagger
 * /admin/user/getProfile:
 *   get:
 *     summary: Get user profile by admin
 *     tags: [Admin User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID
 *     responses:
 *       200:
 *         description: Success
 */
route.get('/getProfile', controller.getProfile);

/**
 * @swagger
 * /admin/user/blockUnblock:
 *   patch:
 *     summary: Block or Unblock a user
 *     tags: [Admin User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
route.patch('/blockUnblock', controller.blockUnblock);

/**
 * @swagger
 * /admin/user/deleteUserAccount:
 *   delete:
 *     summary: Delete a user account (and associated data)
 *     tags: [Admin User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted successfully
 */
route.delete('/deleteUserAccount', controller.deleteUserAccount);

/**
 * @swagger
 * /admin/user/topCustomers:
 *   get:
 *     summary: Get top customers for dashboard
 *     tags: [Admin User Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
route.get('/topCustomers', controller.getTopCustomers);

module.exports = route;
