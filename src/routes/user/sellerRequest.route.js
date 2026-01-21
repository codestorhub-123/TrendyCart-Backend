const express = require('express');
const route = express.Router();

const controller = require('../../controllers/sellerRequest.controller');

//multer
const multer = require("multer");
const storage = require("../../../utils/multer");
const upload = multer({ storage });

/**
 * @swagger
 * tags:
 *   name: User Seller Request
 *   description: User management of seller requests
 */

/**
 * @swagger
 * /user/request/create:
 *   post:
 *     summary: Create a new seller request
 *     tags: [User Seller Request]
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *               - firstName
 *               - lastName
 *               - businessName
 *               - businessTag
 *               - mobileNumber
 *               - gender
 *               - email
 *               - password
 *               - countryCode
 *               - address
 *               - landMark
 *               - city
 *               - pinCode
 *               - state
 *               - country
 *               - bankBusinessName
 *               - bankName
 *               - accountNumber
 *               - IFSCCode
 *               - branchName
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               businessName:
 *                 type: string
 *               businessTag:
 *                 type: string
 *               mobileNumber:
 *                 type: string
 *               gender:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               countryCode:
 *                 type: string
 *               address:
 *                 type: string
 *               landMark:
 *                 type: string
 *               city:
 *                 type: string
 *               pinCode:
 *                 type: integer
 *               state:
 *                 type: string
 *               country:
 *                 type: string
 *               bankBusinessName:
 *                 type: string
 *               bankName:
 *                 type: string
 *               accountNumber:
 *                 type: integer
 *               IFSCCode:
 *                 type: string
 *               branchName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Request created successfully
 *       500:
 *         description: Internal Server Error
 */
route.post('/create', upload.single('image'), controller.createRequest);

/**
 * @swagger
 * /user/request/sellerBecomeOrNot:
 *   post:
 *     summary: Check seller status and latest request
 *     tags: [User Seller Request]
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
 *             properties:
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Status retrieved successfully
 *       500:
 *         description: Internal Server Error
 */
route.post('/sellerBecomeOrNot', controller.sellerBecomeOrNot);

module.exports = route;
