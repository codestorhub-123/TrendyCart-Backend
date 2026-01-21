const express = require('express');
const route = express.Router();
const adminController = require("../../controllers/admin.controller");
const multer = require("multer");
const storage = require("../../../utils/multer");
const upload = multer({ storage: storage });
// const checkAccess = require("../../../utils/checkAccess")(); // Removed as per token auth request
const dashboardRoutes = require("./dashboard.route");



//admin login
/**
 * @swagger
 * /admin/login:
 *   post:
 *     summary: Admin login
 *     tags: [Admin Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success
 */
route.post("/login", adminController.adminLogin);

/**
 * @swagger
 * /admin/create:
 *   post:
 *     summary: Create a new admin account
 *     tags: [Admin Sign Up]

 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Admin created successfully
 */
route.post("/create", adminController.adminSignup);

/**
 * @swagger
 * /admin/profile:
 *   get:
 *     summary: Retrieve the logged-in admin's profile
 *     tags: [Admin Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin profile retrieved successfully
 */
route.get("/profile", adminController.getProfile);

/**
 * @swagger
 * /admin/updateProfile:
 *   patch:
 *     summary: Update admin name and email
 *     tags: [Admin Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
route.patch("/updateProfile", adminController.updateProfile);

/**
 * @swagger
 * /admin/updateImage:
 *   patch:
 *     summary: Update admin profile image
 *     tags: [Admin Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Image updated successfully
 */
route.patch("/updateImage", upload.single("image"), adminController.updateImage);

/**
 * @swagger
 * /admin/forgotPassword:
 *   post:
 *     summary: Send a forgot password email
 *     tags: [Admin Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email sent successfully
 */
route.post("/forgotPassword", adminController.forgotPassword);

/**
 * @swagger
 * /admin/updatePassword:
 *   patch:
 *     summary: Update the logged-in admin's password
 *     tags: [Admin Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password updated successfully
 */
route.patch("/updatePassword", adminController.updatePassword);

/**
 * @swagger
 * /admin/setPassword:
 *   post:
 *     summary: Set a new password (usually after reset)
 *     tags: [Admin Auth]
 *     parameters:
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *               - confirmPassword
 *             properties:
 *               password:
 *                 type: string
 *               confirmPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password set successfully
 */
route.post("/setPassword", adminController.setPassword);



//dashboard route
route.use("/dashboard", dashboardRoutes);

//user route
const userRoute = require("./user.route"); // Renamed from userRoutes
route.use("/user", userRoute);

//seller request route
const sellerRequestRoute = require("./sellerRequest.route"); // Renamed from sellerRequestRoutes
const sellerRoute = require('./seller.route.js'); // NEW IMPORT
const categoryRoute = require("./category.route");

route.use("/sellerRequest", sellerRequestRoute);
route.use("/seller", sellerRoute);
route.use("/category", categoryRoute);
route.use("/subCategory", require("./subCategory.route"));
route.use("/attributes", require("./attributes.route"));
route.use("/productRequest", require("./productRequest.route"));
route.use("/product", require("./product.route"));
route.use("/order", require("./order.route"));
const withdraw = require("./withdraw.route");
const withdrawRequest = require("./withdrawRequest.route");
const sellerWallet = require("./sellerWallet.route");
const reel = require("./reel.route");

route.use("/withdraw", withdraw);
route.use("/withdrawRequest", withdrawRequest);
route.use("/sellerWallet", sellerWallet);
route.use("/reel", reel);
route.use("/reportReason", require("./reportReason.route"));
route.use("/FAQ", require("./faq.route"));
route.use("/reportoReel", require("./reportoReel.route"));
route.use("/review", require("./review.route"));
route.use("/promoCode", require("./promocode.route"));
route.use("/currency", require("./currency.route"));
route.use("/notification", require("./notification.route"));
route.use("/liveSeller", require("./liveSeller.route"));
route.use("/setting", require("./setting.route"));
route.use("/bank", require("./bank.route"));

module.exports = route;
