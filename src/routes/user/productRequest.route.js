const express = require("express");
const route = express.Router();

const controller = require("../../controllers/productRequest.controller");
const multer = require("multer");
const storage = require("../../../utils/multer");
const upload = multer({ storage });

// =======================
// UPDATE PRODUCT REQUEST
// =======================

/**
 * @swagger
 * /user/productRequest/updateProductRequest:
 *   patch:
 *     summary: Create or submit product update request (partial update)
 *     description: >
 *       This is a PATCH API. Only the fields that need to be updated should be sent.
 *       productId, sellerId and productCode are mandatory query parameters.
 *     tags:
 *       - Product Request
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: query
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *
 *       - in: query
 *         name: sellerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Seller ID
 *
 *       - in: query
 *         name: productCode
 *         required: true
 *         schema:
 *           type: string
 *         description: Product code
 *
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *
 *               productName:
 *                 type: string
 *                 example: "Updated Product Name"
 *
 *               description:
 *                 type: string
 *                 example: "Updated description"
 *
 *               productSaleType:
 *                 type: number
 *                 example: 1
 *
 *               price:
 *                 type: number
 *                 example: 499
 *
 *               minimumOfferPrice:
 *                 type: number
 *                 example: 300
 *
 *               processingTime:
 *                 type: string
 *                 example: "2 business days"
 *
 *               recipientAddress:
 *                 type: string
 *                 example: "India"
 *
 *               isImmediatePaymentRequired:
 *                 type: boolean
 *                 example: true
 *
 *               shippingCharges:
 *                 type: number
 *                 example: 50
 *
 *               category:
 *                 type: string
 *                 example: "65a123abc..."
 *
 *               subCategory:
 *                 type: string
 *                 example: "65a456def..."
 *
 *               attributes:
 *                 type: string
 *                 description: JSON string of attributes
 *                 example: >
 *                   [{"name":"Color","values":["white","red"],"image":"https://example.com/images/color.png"}]
 *
 *               mainImage:
 *                 type: string
 *                 format: binary
 *
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *
 *               enableAuction:
 *                 type: boolean
 *                 example: false
 *
 *               scheduleTime:
 *                 type: string
 *                 example: "2026-01-20 10:00"
 *
 *               auctionStartingPrice:
 *                 type: number
 *                 example: 100
 *
 *               enableReservePrice:
 *                 type: boolean
 *                 example: true
 *
 *               reservePrice:
 *                 type: number
 *                 example: 300
 *
 *               auctionDuration:
 *                 type: number
 *                 example: 60
 *
 *               auctionStartDate:
 *                 type: string
 *                 example: "2026-01-20"
 *
 *               auctionEndDate:
 *                 type: string
 *                 example: "2026-01-21"
 *
 *     responses:
 *       200:
 *         description: Product update request submitted or product updated directly
 */
route.patch(
  "/updateProductRequest",
  upload.fields([
    { name: "mainImage", maxCount: 1 },
    { name: "images", maxCount: 10 },
  ]),
  controller.updateProductRequest
);

module.exports = route;
