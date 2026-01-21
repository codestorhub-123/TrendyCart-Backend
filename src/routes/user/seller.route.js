const express = require('express');
const route = express.Router();
const controller = require('../../controllers/seller.controller');

/**
 * @swagger
 * /user/seller/login:
 *   post:
 *     summary: Seller login
 *     tags: [Seller]
 *     responses:
 *       200: { description: Success }
 */
route.post('/login', controller.login);

/**
 * @swagger
 * /user/seller/getProfile:
 *   get:
 *     summary: Get logged-in seller profile
 *     tags: [Seller]
 *     responses:
 *       200: { description: Success }
 */
route.get('/getProfile', controller.getProfile);

/**
 * @swagger
 * /user/seller/fetchSellerProfile:
 *   get:
 *     summary: Get public seller profile
 *     tags: [Seller]
 *     responses:
 *       200: { description: Success }
 */
route.get('/fetchSellerProfile', controller.fetchSellerProfile);

/**
 * @swagger
 * /user/seller/update:
 *   patch:
 *     summary: Update seller profile
 *     tags: [Seller]
 *     responses:
 *       200: { description: Success }
 */
route.patch('/update', controller.update);

/**
 * @swagger
 * /user/seller/updatePassword:
 *   patch:
 *     summary: Update seller password
 *     tags: [Seller]
 *     responses:
 *       200: { description: Success }
 */
route.patch('/updatePassword', controller.updatePassword);

/**
 * @swagger
 * /user/seller/setPassword:
 *   post:
 *     summary: Set seller password
 *     tags: [Seller]
 *     responses:
 *       200: { description: Success }
 */
route.post('/setPassword', controller.setPassword);

module.exports = route;
