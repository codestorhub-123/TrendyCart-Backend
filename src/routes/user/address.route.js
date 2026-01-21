const express = require('express');
const route = express.Router();
const controller = require('../../controllers/address.controller');

//store address
/**
 * @swagger
 * /user/address/create:
 *   post:
 *     summary: Create new address
 *     tags: [Address]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - name
 *               - address
 *               - city
 *               - state
 *               - country
 *               - zipCode
 *             properties:
 *               userId:
 *                 type: string
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               country:
 *                 type: string
 *               zipCode:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Success
 */
route.post('/create', controller.store);

//update address
/**
 * @swagger
 * /user/address/update:
 *   patch:
 *     summary: Update address
 *     tags: [Address]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: addressId
 *         schema:
 *           type: string
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               country:
 *                 type: string
 *               zipCode:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Success
 */
route.patch('/update', controller.update);

//get all address
/**
 * @swagger
 * /user/address/getAllAddress:
 *   get:
 *     summary: Get all addresses for user
 *     tags: [Address]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Success
 */
route.get('/getAllAddress', controller.getAllAddress);

//select or not
/**
 * @swagger
 * /user/address/selectOrNot:
 *   patch:
 *     summary: Select address
 *     tags: [Address]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *       - in: query
 *         name: addressId
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Success
 */
route.patch('/selectOrNot', controller.selectedOrNot);

//get select address
/**
 * @swagger
 * /user/address/selectAddress:
 *   get:
 *     summary: Get selected address
 *     tags: [Address]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Success
 */
route.get('/selectAddress', controller.getSelectedAddress);

//delete address
/**
 * @swagger
 * /user/address/delete:
 *   delete:
 *     summary: Delete address
 *     tags: [Address]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *       - in: query
 *         name: addressId
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Success
 */
route.delete('/delete', controller.deleteAddress);

module.exports = route;
