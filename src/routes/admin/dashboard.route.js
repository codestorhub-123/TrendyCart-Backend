const express = require('express');
const route = express.Router();
const controller = require('../../controllers/dashboard.controller');

//get dashboard count
/**
 * @swagger
 * /admin/dashboard:
 *   get:
 *     summary: Get general dashboard statistics (Admin)
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
route.get('/', controller.dashboard);

//date wise analytic for orders
/**
 * @swagger
 * /admin/dashboard/analyticOfOrders:
 *   get:
 *     summary: Get date wise analytics for orders (Admin)
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *         description: Start date (DD-MM-YYYY)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *         description: End date (DD-MM-YYYY)
 *     responses:
 *       200:
 *         description: Success
 */
route.get('/analyticOfOrders', controller.analyticOfOrders);
//date wise analytic for users
/**
 * @swagger
 * /admin/dashboard/analyticOfUsers:
 *   get:
 *     summary: Get date wise analytics for users (Admin)
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *         required: true
 *         description: Start date (DD-MM-YYYY) or 'All'
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *         required: true
 *         description: End date (DD-MM-YYYY) or 'All'
 *     responses:
 *       200:
 *         description: Success
 */
route.get('/analyticOfUsers', controller.analyticOfUsers);
//date wise chart analytic for users
/**
 * @swagger
 * /admin/dashboard/chartAnalyticOfUsers:
 *   get:
 *     summary: Get date wise chart analytics for users (Admin)
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *         required: true
 *         description: Start date (DD-MM-YYYY) or 'All'
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *         required: true
 *         description: End date (DD-MM-YYYY) or 'All'
 *     responses:
 *       200:
 *         description: Success
 */
route.get('/chartAnalyticOfUsers', controller.chartAnalyticOfUsers);
//revenue analytics chart data
/**
 * @swagger
 * /admin/dashboard/revenueAnalyticsChartData:
 *   get:
 *     summary: Get revenue analytics chart data (Admin)
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *         description: Start date (DD-MM-YYYY)
 *         required: true
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *         description: End date (DD-MM-YYYY)
 *         required: true
 *     responses:
 *       200:
 *         description: Success
 */
route.get('/revenueAnalyticsChartData', controller.revenueAnalyticsChartData);





module.exports = route;
