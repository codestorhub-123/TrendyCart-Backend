const express = require('express');
const route = express.Router();
const controller = require('../../controllers/subCategory.controller');
const multer = require("multer");
const storage = require("../../../utils/multer");
const upload = multer({ storage: storage });

/**
 * @swagger
 * /admin/subCategory/create:
 *   post:
 *     summary: Create a new subcategory
 *     tags: [Admin SubCategory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - category
 *               - image
 *             properties:
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *                 description: Category ID
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Success
 */
route.post('/create', upload.single('image'), controller.create);

/**
 * @swagger
 * /admin/subCategory/update:
 *   patch:
 *     summary: Update a subcategory
 *     tags: [Admin SubCategory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: subCategoryId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Success
 */
route.patch('/update', upload.single('image'), controller.update);

/**
 * @swagger
 * /admin/subCategory/delete:
 *   delete:
 *     summary: Delete a subcategory
 *     tags: [Admin SubCategory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: subCategoryId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
route.delete('/delete', controller.delete);

/**
 * @swagger
 * /admin/subCategory/categoryWiseSubCategory:
 *   get:
 *     summary: Get category-wise subcategories
 *     tags: [Admin SubCategory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
route.get('/categoryWiseSubCategory', controller.categoryWiseSubCategory);

/**
 * @swagger
 * /admin/subCategory/fetchActiveSubCategories:
 *   get:
 *     summary: Get active subcategories
 *     tags: [Admin SubCategory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Subcategories fetched successfully."
 *                 subCategories:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       createdAt:
 *                         type: string
 */
route.get('/fetchActiveSubCategories', controller.fetchActiveSubCategories);

module.exports = route;
