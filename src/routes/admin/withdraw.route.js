const express = require('express');
const route = express.Router();
const withdrawController = require('../../controllers/withdraw.controller');
const multer = require("multer");
const storage = require("../../../utils/multer");
const upload = multer({ storage: storage });

/**
 * @swagger
 * /admin/withdraw/create:
 *   post:
 *     summary: Create withdrawal method
 *     tags: [Admin Withdraw]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - details
 *               - image
 *             properties:
 *               name:
 *                 type: string
 *               details:
 *                 type: string
 *                 description: JSON string of details array
 *                 example: '["Account Number", "IFSC Code", "Bank Name"]'
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Success
 * */
route.post('/create', upload.single('image'), withdrawController.create);

/**
 * @swagger
 * /admin/withdraw/update:
 *   patch:
 *     summary: Update withdrawal method
 *     tags: [Admin Withdraw]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: withdrawId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               details:
 *                 type: string
 *                 description: JSON string of details array
 *                 example: '["UPI ID", "Phone Number"]'
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Success
 * */
route.patch('/update', upload.single('image'), withdrawController.update);

/**
 * @swagger
 * /admin/withdraw/:
 *   get:
 *     summary: Get withdrawal methods
 *     tags: [Admin Withdraw]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 * */
route.get('/', withdrawController.getWithdrawRequests);

/**
 * @swagger
 * /admin/withdraw/:
 *   delete:
 *     summary: Delete withdrawal method
 *     tags: [Admin Withdraw]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: withdrawId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 * */
route.delete('/', withdrawController.delete);


/**
 * @swagger
 * /admin/withdraw/handleSwitch:
 *   patch:
 *     summary: Enable/Disable withdrawal method
 *     tags: [Admin Withdraw]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: withdrawId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 * */
route.patch('/handleSwitch', withdrawController.handleSwitch);


/**
 * @swagger
 * /admin/withdraw/withdrawalList:
 *   get:
 *     summary: Get active withdrawal methods
 *     tags: [Admin Withdraw]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 * */
route.get('/withdrawalList', withdrawController.withdrawalList);

module.exports = route;
