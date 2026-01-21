const express = require('express');
const route = express.Router();
const controller = require('../../controllers/currency.controller');

/**
 * @swagger
 * /admin/currency/storeCurrency:
 *   post:
 *     summary: Create a new currency
 *     tags: [Admin Currency]
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
 *               - symbol
 *               - currencyCode
 *             properties:
 *               name:
 *                 type: string
 *               symbol:
 *                 type: string
 *               countryCode:
 *                 type: string
 *               currencyCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success
 */
route.post('/storeCurrency', controller.storeCurrency);

/**
 * @swagger
 * /admin/currency/updateCurrency:
 *   patch:
 *     summary: Update an existing currency
 *     tags: [Admin Currency]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: currencyId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               symbol:
 *                 type: string
 *               countryCode:
 *                 type: string
 *               currencyCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success
 */
route.patch('/updateCurrency', controller.updateCurrency);

/**
 * @swagger
 * /admin/currency/deleteCurrency:
 *   delete:
 *     summary: Delete a currency
 *     tags: [Admin Currency]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: currencyId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
route.delete('/deleteCurrency', controller.deleteCurrency);

/**
 * @swagger
 * /admin/currency/setdefaultCurrency:
 *   patch:
 *     summary: Set default currency
 *     tags: [Admin Currency]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: currencyId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
route.patch('/setdefaultCurrency', controller.setDefaultCurrency);

/**
 * @swagger
 * /admin/currency/fetchCurrencies:
 *   get:
 *     summary: Get all currencies
 *     tags: [Admin Currency]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
route.get('/fetchCurrencies', controller.fetchCurrencies);

/**
 * @swagger
 * /admin/currency/getDefaultCurrency:
 *   get:
 *     summary: Get default currency
 *     tags: [Admin Currency]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
route.get('/getDefaultCurrency', controller.getDefaultCurrency);

module.exports = route;
