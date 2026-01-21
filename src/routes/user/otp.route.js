const express = require('express');
const route = express.Router();
const controller = require('../../controllers/otp.controller');

// Create OTP for password security
/**
 * @swagger
 * /user/otp/create:
 *   post:
 *     summary: Create OTP and send email/mobile for password security
 *     tags: [OTP]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *               mobileNumber:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success
 */
route.post('/create', controller.create);

// Create OTP for login
/**
 * @swagger
 * /user/otp/otplogin:
 *   post:
 *     summary: Create OTP when user logins
 *     tags: [OTP]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mobileNumber
 *             properties:
 *               mobileNumber:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success
 */
route.post('/otplogin', controller.otplogin);

// Verify OTP
/**
 * @swagger
 * /user/otp/verify:
 *   post:
 *     summary: Verify the OTP
 *     tags: [OTP]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - otp
 *             properties:
 *               otp:
 *                 type: string
 *               email:
 *                 type: string
 *               mobileNumber:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success
 */
route.post('/verify', controller.verify);

module.exports = route;
