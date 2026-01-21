const express = require('express');
const route = express.Router();
const controller = require('../../controllers/bank.controller');

/**
 * @swagger
 * /user/bank/create:
 *   post:
 *     summary: Create bank details
 *     tags: [Bank]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success
 */
route.post('/create', controller.create);

/**
 * @swagger
 * /user/bank/update:
 *   patch:
 *     summary: Update bank details
 *     tags: [Bank]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: bankId
 *         required: true
 *         schema:
 *           type: string
 *         description: Bank ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success
 */
route.patch('/update', controller.update);

/**
 * @swagger
 * /user/bank/getBanks:
 *   get:
 *     summary: Get all banks
 *     tags: [Bank]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
route.get('/getBanks', controller.getBanks);

/**
 * @swagger
 * /user/bank/delete:
 *   delete:
 *     summary: Delete bank details
 *     tags: [Bank]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: bankId
 *         required: true
 *         schema:
 *           type: string
 *         description: Bank ID
 *     responses:
 *       200:
 *         description: Success
 */
route.delete('/delete', controller.delete);

module.exports = route;
