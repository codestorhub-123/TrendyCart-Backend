const express = require("express");
const route = express.Router();
const controller = require("../../controllers/category.controller");

//multer
const multer = require("multer");
const storage = require("../../../utils/multer");
const upload = multer({ storage });

/**
 * @swagger
 * tags:
 *   name: Admin Category
 *   description: Admin category management
 */

/**
 * @swagger
 * /admin/category/create:
 *   post:
 *     summary: Create a new category
 *     tags: [Admin Category]
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Category created successfully
 *       500:
 *         description: Internal Server Error
 */
route.post("/create", upload.single("image"), controller.create);

/**
 * @swagger
 * /admin/category/update:
 *   patch:
 *     summary: Update an existing category
 *     tags: [Admin Category]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *         description: The category ID
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Category updated successfully
 *       500:
 *         description: Internal Server Error
 */
route.patch("/update", upload.single("image"), controller.update);

/**
 * @swagger
 * /admin/category/delete:
 *   delete:
 *     summary: Delete a category
 *     tags: [Admin Category]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *         description: The category ID
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *       500:
 *         description: Internal Server Error
 */
route.delete("/delete", controller.delete);

/**
 * @swagger
 * /admin/category/getCategory:
 *   get:
 *     summary: Get all categories (Admin view)
 *     tags: [Admin Category]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of categories
 *       500:
 *         description: Internal Server Error
 */
route.get("/getCategory", controller.getCategory);

module.exports = route;
