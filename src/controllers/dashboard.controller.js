const User = require("../models/user.model");
const Category = require("../models/category.model");
const SubCategory = require("../models/subCategory.model");
const SellerWallet = require("../models/sellerWallet.model");
const Seller = require("../models/seller.model");
const Product = require("../models/product.model");
const Order = require("../models/order.model");
const Reel = require("../models/reel.model");
const Review = require("../models/review.model");
const ReportReel = require("../models/reportoReel.model");
const SellerRequest = require("../models/sellerRequest.model");
const WithdrawRequest = require("../models/withdrawRequest.model");
const mongoose = require("mongoose");
const { get_message } = require("../../utils/message");

//get dashboard count
exports.dashboard = async (req, res) => {
  try {
    const [totalCategory, totalSubCategory, totalProducts, totalOrders, totalUsers, totalSeller, totalLiveSeller, totalAdminCommission] = await Promise.all([
      Category.countDocuments(),
      SubCategory.countDocuments(),
      Product.countDocuments(),
      Order.countDocuments(),
      User.countDocuments(),
      Seller.countDocuments(),
      Seller.countDocuments({ isLive: true }),
      SellerWallet.aggregate([
        //{ $match: dateFilterQuery },
        { $group: { _id: null, totalCommission: { $sum: "$commissionPerProductQuantity" } } },
      ]).then((result) => (result.length > 0 ? result[0].totalCommission : 0)),
    ]);

    const dashboard = {
      totalCategory,
      totalSubCategory,
      totalProducts,
      totalOrders,
      totalUsers,
      totalSeller,
      totalLiveSeller,
      totalAdminCommission,
    };

    return res.status(200).json({ status: true, message: get_message(1001), dashboard });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};
//get date wise analytic for orders
exports.analyticOfOrders = async (req, res) => {
  try {
    if (!req.query.startDate || !req.query.endDate) {
      return res.status(400).json({ status: false, message: get_message(1074) });
    }

    //get today's date range
    const currentDate = new Date();
    const startOfDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    const endOfDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1);

    //get yesterday's date range
    const yesterday = new Date(currentDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const startOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
    const endOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate() + 1);

    //get weekly date range
    const weekStartDate = new Date(currentDate);
    weekStartDate.setDate(weekStartDate.getDate() - 7);
    const startOfWeek = new Date(weekStartDate.getFullYear(), weekStartDate.getMonth(), weekStartDate.getDate());
    const endOfWeek = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1);

    //get dateWise date range
    let dateFilterQuery = {};
    if (req?.query?.startDate !== "All" && req?.query?.endDate !== "All") {
      const [day, month, year] = req.query.startDate.split('-');
      const startDate = new Date(year, month - 1, day);

      const [endDay, endMonth, endYear] = req.query.endDate.split('-');
      const endDate = new Date(endYear, endMonth - 1, endDay);
      endDate.setHours(23, 59, 59, 999);

      dateFilterQuery = {
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        },
      };
    }
    console.log("dateFilterQuery:   ", dateFilterQuery);

    const [todayOrders, yesterdayOrders, weeklyOrders, analyticdata] = await Promise.all([
      Order.aggregate([{ $match: { createdAt: { $gte: startOfDay, $lte: endOfDay } } }, { $group: { _id: null, total: { $sum: 1 } } }]),
      Order.aggregate([{ $match: { createdAt: { $gte: startOfYesterday, $lte: endOfYesterday } } }, { $group: { _id: null, total: { $sum: 1 } } }]),
      Order.aggregate([{ $match: { createdAt: { $gte: startOfWeek, $lte: endOfWeek } } }, { $group: { _id: null, total: { $sum: 1 } } }]),
      Order.aggregate([{ $match: dateFilterQuery }, { $group: { _id: null, total: { $sum: 1 } } }]),
    ]);

    return res.status(200).json({
      status: true,
      message: get_message(1001),
      orders: {
        totalOrders: analyticdata[0]?.total > 0 ? analyticdata[0]?.total : 0,
        todayOrders: todayOrders[0]?.total > 0 ? todayOrders[0]?.total : 0,
        yesterdayOrders: yesterdayOrders[0]?.total > 0 ? yesterdayOrders[0]?.total : 0,
        weeklyOrders: weeklyOrders[0]?.total > 0 ? weeklyOrders[0]?.total : 0,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//get date wise analytic for users
exports.analyticOfUsers = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(200).json({
        status: false,
        message: get_message(1074)
      });
    }

    /* ===================== TODAY RANGE ===================== */
    const now = new Date();

    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const endOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1
    );

    /* ===================== YESTERDAY RANGE ===================== */
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    const startOfYesterday = new Date(
      yesterday.getFullYear(),
      yesterday.getMonth(),
      yesterday.getDate()
    );
    const endOfYesterday = new Date(
      yesterday.getFullYear(),
      yesterday.getMonth(),
      yesterday.getDate() + 1
    );

    /* ===================== WEEKLY RANGE (LAST 7 DAYS) ===================== */
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);

    const startOfWeek = new Date(
      weekStart.getFullYear(),
      weekStart.getMonth(),
      weekStart.getDate()
    );
    const endOfWeek = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1
    );

    /* ===================== DATE RANGE (DD-MM-YYYY FIX) ===================== */
    let dateFilterQuery = {};

    if (startDate !== "All" && endDate !== "All") {
      // Convert DD-MM-YYYY → Date
      const [sd, sm, sy] = startDate.split("-");
      const [ed, em, ey] = endDate.split("-");

      const parsedStartDate = new Date(`${sy}-${sm}-${sd}T00:00:00.000Z`);
      const parsedEndDate = new Date(`${ey}-${em}-${ed}T23:59:59.999Z`);

      dateFilterQuery = {
        createdAt: {
          $gte: parsedStartDate,
          $lte: parsedEndDate
        }
      };
    }

    /* ===================== AGGREGATIONS ===================== */
    const [
      todayOrders,
      yesterdayOrders,
      weeklyOrders,
      totalOrders
    ] = await Promise.all([
      Order.countDocuments({
        createdAt: { $gte: startOfDay, $lt: endOfDay }
      }),
      Order.countDocuments({
        createdAt: { $gte: startOfYesterday, $lt: endOfYesterday }
      }),
      Order.countDocuments({
        createdAt: { $gte: startOfWeek, $lt: endOfWeek }
      }),
      Order.countDocuments(dateFilterQuery)
    ]);

    /* ===================== RESPONSE ===================== */
    return res.status(200).json({
      status: true,
      message: get_message(1001),
      orders: {
        totalOrders: totalOrders || 0,
        todayOrders: todayOrders || 0,
        yesterdayOrders: yesterdayOrders || 0,
        weeklyOrders: weeklyOrders || 0
      }
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error"
    });
  }
};

//get date wise chartAnalytic for users
exports.chartAnalyticOfUsers = async (req, res) => {
  try {
    if (!req.query.startDate || !req.query.endDate) {
      return res.status(400).json({ status: false, message: get_message(1074) });
    }

    let dateFilterQuery = {};

    if (req?.query?.startDate !== "All" && req?.query?.endDate !== "All") {
      const [day, month, year] = req.query.startDate.split('-');
      const startDate = new Date(year, month - 1, day);

      const [endDay, endMonth, endYear] = req.query.endDate.split('-');
      const endDate = new Date(endYear, endMonth - 1, endDay);
      endDate.setHours(23, 59, 59, 999);

      dateFilterQuery = {
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        },
      };
    }
    //console.log("dateFilterQuery:   ", dateFilterQuery);

    const data = await User.aggregate([
      {
        $match: dateFilterQuery,
      },
      {
        $group: {
          _id: { $dateToString: { format: "%d-%m-%Y", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    return res.status(200).json({ status: true, message: get_message(1001), chartAnalyticOfUsers: data });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};
//revenue analytics chart data
exports.revenueAnalyticsChartData = async (req, res) => {
  try {
    if (!req.query.startDate || !req.query.endDate) {
      return res.status(400).json({ status: false, message: get_message(1074) });
    }

    let dateFilterQuery = {};
    if (req?.query?.startDate !== "All" && req?.query?.endDate !== "All") {
      const [day, month, year] = req.query.startDate.split('-');
      const startDate = new Date(year, month - 1, day);

      const [endDay, endMonth, endYear] = req.query.endDate.split('-');
      const endDate = new Date(endYear, endMonth - 1, endDay);
      endDate.setHours(23, 59, 59, 999);

      dateFilterQuery = {
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        },
      };
    }

    const [totalCommission, totalEarningWithCommission, totalEarningWithoutCommission] = await Promise.all([
      SellerWallet.aggregate([
        {
          $match: dateFilterQuery,
        },
        {
          $group: {
            _id: { $dateToString: { format: "%d-%m-%Y", date: "$createdAt" } },
            totalCommission: { $sum: "$commissionPerProductQuantity" },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ]),
      SellerWallet.aggregate([
        {
          $match: dateFilterQuery,
        },
        {
          $group: {
            _id: { $dateToString: { format: "%d-%m-%Y", date: "$createdAt" } },
            totalEarningWithCommission: { $sum: { $sum: ["$amount", "$commissionPerProductQuantity"] } },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ]),
      SellerWallet.aggregate([
        {
          $match: dateFilterQuery,
        },
        {
          $group: {
            _id: { $dateToString: { format: "%d-%m-%Y", date: "$createdAt" } },
            totalEarningWithoutCommission: { $sum: "$amount" },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ]),
    ]);

    return res.status(200).json({
      status: true,
      message: get_message(1001),
      totalCommission,
      totalEarningWithCommission,
      totalEarningWithoutCommission,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

