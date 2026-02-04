const express = require('express');
const route = express.Router();



//multer
const multer = require("multer");
const storage = require("../../../utils/multer");
const upload = multer({ storage });

//controller
const UserController = require("../../controllers/user.controller");

//user login and sign up
/**
 * @swagger
 * /user/login:
 *   post:
 *     summary: User login or signup
 *     tags: [User Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - identity
 *               - loginType
 *             properties:
 *               image:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               loginType:
 *                 type: string
 *                 description: "1=Google, 2=Apple, 3=Email/Password, 5=Mobile"
 *               password:
 *                 type: string
 *               email:
 *                 type: string
 *               fcmToken:
 *                 type: string
 *               identity:
 *                 type: string
 *                 description: Unique identity from provider
 *               mobileNumber:
 *                 type: string
 *               User:
 *                  type: string
 *                  description: Email or User identifier
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  status:
 *                    type: boolean
 *                  message:
 *                    type: string
 *                  token:
 *                    type: string
 *                  user:
 *                    type: object
 *                  signUp:
 *                    type: boolean
 *       500:
 *         description: Internal Server Error
 */
route.post("/login", UserController.store);

//check login enabled or not
/**
 * @swagger
 * /user/login:
 *   get:
 *     summary: Check if login is enabled
 *     tags: [User Auth]
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
 *                 message:
 *                   type: string
 *                 list:
 *                   type: boolean
 */
route.get("/login", UserController.getLoginToggle);

//check the user is exists or not
/**
 * @swagger
 * /user/checkUser:
 *   post:
 *     summary: Check if user exists
 *     tags: [User Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - loginType
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               loginType:
 *                 type: integer
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Check result
 */
route.post("/checkUser", UserController.checkUser);

//check the user's password wrong or true
/**
 * @swagger
 * /user/checkPassword:
 *   post:
 *     summary: Verify user password
 *     tags: [User Auth]
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
 *         description: Password verification result
 */
route.post("/checkPassword", UserController.checkPassword);

//get user profile who login
/**
 * @swagger
 * /user/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: The user ID
 *     responses:
 *       200:
 *         description: User profile data
 */
route.get("/profile", UserController.getProfile);



//update profile of user
/**
 * @swagger
 * /user/update:
 *   patch:
 *     summary: Update user profile
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 required: true
 *               image:
 *                 type: string
 *                 format: binary
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               dob:
 *                 type: string
 *               gender:
 *                 type: string
 *               location:
 *                 type: string
 *               countryCode:
 *                 type: string
 *               mobileNumber:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
route.patch("/update", upload.single("image"), UserController.updateProfile);

//update password
/**
 * @swagger
 * /user/updatePassword:
 *   patch:
 *     summary: Update user password
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
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
 *               - oldPass
 *               - newPass
 *               - confirmPass
 *             properties:
 *               oldPass:
 *                 type: string
 *               newPass:
 *                 type: string
 *               confirmPass:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password updated result
 */
route.patch("/updatePassword", UserController.updatePassword);

//set password
/**
 * @swagger
 * /user/setPassword:
 *   post:
 *     summary: Set new password
 *     tags: [User Profile]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               email:
 *                 type: string
 *               newPassword:
 *                 type: string
 *               confirmPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password set successfully
 */
route.post("/setPassword", UserController.setPassword);

/**
 * @swagger
 * /user/deleteUserAccount:
 *   delete:
 *     summary: Delete user account
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: The user ID
 *     responses:
 *       200:
 *         description: User account deleted successfully
 *       500:
 *         description: Internal Server Error
 */
route.delete("/deleteUserAccount", UserController.deleteUserAccount);

module.exports = route;

