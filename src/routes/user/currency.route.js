const express = require('express');
const route = express.Router();
const controller = require('../../controllers/currency.controller');

/**
 * @swagger
 * /user/currency/fetchCurrencies:
 *   get:
 *     summary: Get all currencies
 *     tags: [Currency]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
route.get('/fetchCurrencies', controller.fetchCurrencies);

/**
 * @swagger
 * /user/currency/getDefaultCurrency:
 *   get:
 *     summary: Get default currency
 *     tags: [Currency]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
route.get('/getDefaultCurrency', controller.getDefaultCurrency);

module.exports = route;
