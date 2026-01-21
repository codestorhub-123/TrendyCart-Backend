const express = require('express');
const route = express.Router();
const controller = require('../../controllers/setting.controller');

/**
 * @swagger
 * tags:
 *   name: Setting
 *   description: The Setting managing API
 */

/**
 * @swagger
 * /admin/setting:
 *   get:
 *     summary: Get all settings
 *     tags: [Admin Setting]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Settings fetched successfully
 */
route.get('/', controller.getSetting);

/**
 * @swagger
 * /admin/setting/update:
 *   patch:
 *     summary: Update setting fields
 *     tags: [Admin Setting]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: settingId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               privacyPolicyLink:
 *                 type: string
 *               termAndConditionLink:
 *                 type: string
 *               commissionPercent:
 *                 type: number
 *               minValueForWithdrawal:
 *                 type: number
 *     responses:
 *       200:
 *         description: Setting updated successfully
 */
route.patch('/update', controller.update);

/**
 * @swagger
 * /admin/setting/handleSwitch:
 *   patch:
 *     summary: Toggle boolean settings (e.g. isFakeData)
 *     tags: [Admin Setting]
 *     parameters:
 *       - in: query
 *         name: settingId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [isFakeData, stripe, razorPay, flutterWave, productRequest, updateProductRequest, isCashOnDelivery]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Switch toggled successfully
 */
route.patch('/handleSwitch', controller.handleSwitch);

/**
 * @swagger
 * /admin/setting/handleFieldSwitch:
 *   patch:
 *     summary: Toggle nested document fields
 *     tags: [Admin Setting]
 *     parameters:
 *       - in: query
 *         name: settingId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: field
 *         required: true
 *         schema:
 *           type: string
 *           enum: [addressProof, govId, registrationCert]
 *       - in: query
 *         name: toggleType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [isActive, isRequired]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Field switch toggled successfully
 */
route.patch('/handleFieldSwitch', controller.handleFieldSwitch);

module.exports = route;
