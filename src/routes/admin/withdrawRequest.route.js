const express = require('express');
const route = express.Router();
const controller = require('../../controllers/withdrawRequest.controller');

/**
 * @swagger
 * /admin/withdrawRequest/listWithdrawalRequests:
 *   get:
 *     summary: List all withdrawal requests
 *     tags: [Admin Withdraw Request]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Optional. Filter by status (1=Pending, 2=Approved, 3=Rejected). Defaults to All.
 *     responses:
 *       200:
 *         description: Success
 * */
route.get('/listWithdrawalRequests', controller.listWithdrawalRequests);

/**
 * @swagger
 * /admin/withdrawRequest/approveWithdrawalRequest:
 *   patch:
 *     summary: Approve a withdrawal request
 *     tags: [Admin Withdraw Request]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - requestId
 *             properties:
 *               requestId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success
 * */
route.patch('/approveWithdrawalRequest', controller.approveWithdrawalRequest);

/**
 * @swagger
 * /admin/withdrawRequest/rejectWithdrawalRequest:
 *   patch:
 *     summary: Reject a withdrawal request
 *     tags: [Admin Withdraw Request]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - requestId
 *               - reason
 *             properties:
 *               requestId:
 *                 type: string
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success
 * */
route.patch('/rejectWithdrawalRequest', controller.rejectWithdrawalRequest);

module.exports = route;
