const express = require("express");
const route = express.Router();
const controller = require("../../controllers/faq.controller");

/**
 * @swagger
 * /admin/FAQ/create:
 *   post:
 *     summary: Create a new FAQ
 *     tags: [Admin FAQ]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - question
 *               - answer
 *             properties:
 *               question:
 *                 type: string
 *               answer:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success
 * */
route.post("/create", controller.create);

/**
 * @swagger
 * /admin/FAQ/update:
 *   patch:
 *     summary: Update an existing FAQ
 *     tags: [Admin FAQ]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: faqId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               question:
 *                 type: string
 *               answer:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success
 * */
route.patch("/update", controller.update);

/**
 * @swagger
 * /admin/FAQ/delete:
 *   delete:
 *     summary: Delete an FAQ
 *     tags: [Admin FAQ]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: faqId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 * */
route.delete("/delete", controller.delete);

/**
 * @swagger
 * /admin/FAQ/:
 *   get:
 *     summary: Get all FAQs
 *     tags: [Admin FAQ]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 * */
route.get("/", controller.getFAQs);

module.exports = route;
