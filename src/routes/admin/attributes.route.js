const express = require('express');
const route = express.Router();
const controller = require('../../controllers/attributes.controller');
const multer = require("multer");
const storage = require("../../../utils/multer");
const upload = multer({ storage: storage });

/**
 * @swagger
 * /admin/attributes/insertAttributes:
 *   post:
 *     summary: Insert new attributes
 *     tags: [Admin Attributes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - subCategoryIds
 *               - name
 *               - fieldType
 *               - image
 *             properties:
 *               subCategoryIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               name:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *               fieldType:
 *                 type: number
 *                 description: 1.Text 2.Number 3.File 4.Radio 5.Dropdown 6.Checkboxes
 *               values:
 *                 type: array
 *                 items:
 *                   type: string
 *               minLength:
 *                 type: number
 *               maxLength:
 *                 type: number
 *               isRequired:
 *                 type: boolean
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Success
 */
route.post('/insertAttributes', upload.single("image"), controller.insertAttributes);

/**
 * @swagger
 * /admin/attributes/updateAttributes:
 *   patch:
 *     summary: Update existing attributes
 *     tags: [Admin Attributes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - attributeId
 *             properties:
 *               attributeId:
 *                 type: string
 *               subCategoryId:
 *                 type: string
 *               name:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *               fieldType:
 *                 type: number
 *               values:
 *                 type: array
 *                 items:
 *                   type: string
 *               minLength:
 *                 type: number
 *               maxLength:
 *                 type: number
 *               isRequired:
 *                 type: boolean
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Success
 */
route.patch('/updateAttributes', upload.single("image"), controller.updateAttributes);

/**
 * @swagger
 * /admin/attributes/listAllAttributes:
 *   get:
 *     summary: List all attributes
 *     tags: [Admin Attributes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: subCategoryId
 *         description: Filter attributes by SubCategory ID or 'All'.
 *         required: false
 *         schema:
 *           type: string
 *       - in: query
 *         name: fieldType
 *         description: Filter specific attribute types (1.Text 2.Number 3.File 4.Radio 5.Dropdown 6.Checkboxes) or 'All'.
 *         required: false
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
route.get('/listAllAttributes', controller.listAllAttributes);

/**
 * @swagger
 * /admin/attributes/destroyAttribute:
 *   delete:
 *     summary: Delete an attribute
 *     tags: [Admin Attributes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: attributeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
route.delete('/destroyAttribute', controller.destroyAttribute);

module.exports = route;
