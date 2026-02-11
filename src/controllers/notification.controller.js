
const mongoose = require("mongoose");
const User = require("../models/user.model");
const Notification = require("../models/notification.model");
const Seller = require("../models/seller.model");
const admin = require("../../utils/firebase");
const { get_message } = require("../../utils/message");

exports.list = async (req, res) => {
  try {
    /* ===================== AUTH USER ===================== */
    if (!req.user || (!req.user._id && !req.user.id)) {
      return res.status(401).json({
        status: false,
        message: get_message(1015)
      });
    }

    const id = req.user._id
      ? req.user._id
      : new mongoose.Types.ObjectId(req.user.id);
    const role = req.user.role;

    let identity = null;
    let query = {};

    if (role === 'user') {
      identity = await User.findById(id).select("isBlock").lean();
      query = { userId: id };
    } else if (role === 'seller') {
      identity = await Seller.findById(id).select("isBlock").lean();
      query = { sellerId: id };
    } else {
      return res.status(403).json({
        status: false,
        message: "Access denied. Invalid role for notifications."
      });
    }

    /* ===================== FETCH IDENTITY ===================== */
    if (!identity) {
      return res.status(404).json({
        status: false,
        message: role === 'user' ? get_message(1016) : "Seller not found!"
      });
    }

    if (identity.isBlock) {
      return res.status(403).json({
        status: false,
        message: role === 'user' ? get_message(1017) : "Seller is blocked!"
      });
    }

    /* ===================== FETCH NOTIFICATIONS ===================== */
    const notification = await Notification.find(query)
      .sort({ createdAt: -1 })
      .lean();

    /* ===================== RESPONSE ===================== */
    return res.status(200).json({
      status: true,
      message: `Retrieved the notification list for the ${role}!`,
      notification
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server Error"
    });
  }
};

// exports.send = async (req, res) => {
//   try {
//     const { title, message, type } = req.body; // type: 1(User), 2(Seller), 3(Both)

//     if (!title || !message || !type) {
//       return res.status(200).json({ status: false, message: "Title, message, and type are required." });
//     }

//     let image = null;
//     if (req.file) {
//       image = req.file.path;
//     }

//     let users = [];
//     let sellers = [];

//     // Fetch recipients
//     if (type == 1 || type == 3) {
//       users = await User.find({ isBlock: false, fcmToken: { $ne: null } }).select("fcmToken");
//     }
//     if (type == 2 || type == 3) {
//       sellers = await Seller.find({ isBlock: false, fcmToken: { $ne: null } }).select("fcmToken");
//     }

//     const tokens = [];
//     if (users.length > 0) tokens.push(...users.map(u => u.fcmToken));
//     if (sellers.length > 0) tokens.push(...sellers.map(s => s.fcmToken));

//     const uniqueTokens = [...new Set(tokens)];

//     console.log(`🔔 [Notification] Found ${uniqueTokens.length} unique tokens.`);

//     // Create Notification records in DB
//     const notifications = [];
//     const date = new Date().toISOString();

//     if (type == 1 || type == 3) {
//       const allUsers = await User.find({ isBlock: false }).select("_id");
//       allUsers.forEach(user => {
//         notifications.push({
//           title,
//           message,
//           image,
//           date,
//           notificationType: 4,
//           userId: user._id,
//         });
//       });
//     }

//     if (type == 2 || type == 3) {
//       const allSellers = await Seller.find({ isBlock: false }).select("_id");
//       allSellers.forEach(seller => {
//         notifications.push({
//           title,
//           message,
//           image,
//           date,
//           notificationType: 4,
//           sellerId: seller._id,
//         });
//       });
//     }

//     if (notifications.length > 0) {
//       // split into chunks to avoid memory issues or db limits if too large, though insertMany handles batching usually.
//       // For safety/performance on large sets:
//       await Notification.insertMany(notifications);
//     }

//     // Send FCM in chunks of 500
//     if (uniqueTokens.length > 0) {
//       if (admin) {
//         const chunkSize = 500;
//         const payload = {
//           notification: {
//             title: title,
//             body: message,
//             image: image || ""
//           }
//         };

//         console.log("🚀 [Notification] Starting FCM send...");

//         for (let i = 0; i < uniqueTokens.length; i += chunkSize) {
//           const batchTokens = uniqueTokens.slice(i, i + chunkSize);
//           console.log(`📦 [Notification] Sending batchTokens ${batchTokens}`);
//           const response = await admin.messaging().sendEachForMulticast({
//             tokens: batchTokens,
//             notification: payload.notification
//           }).catch(err => console.log("❌ [Notification] FCM Error:", err));

//           if (response) {
//             console.log(`📦 [Notification] Batch ${(i / chunkSize) + 1}: Success: ${response.successCount}, Failure: ${response.failureCount}`);
//             if (response.failureCount > 0) {
//               response.responses.forEach((resp, idx) => {
//                 if (!resp.success) {
//                   console.log(`⚠️ [Notification] Failed Token: ${batchTokens[idx]} Error: ${resp.error}`);
//                 }
//               });
//             }
//           }
//         }
//       } else {
//         console.log("⚠️ [Notification] Firebase Admin not initialized!");
//       }
//     } else {
//       console.log("⚠️ [Notification] No tokens found to send.");
//     }

//     return res.status(200).json({ status: true, message: "Notification process completed.", recipientsFound: uniqueTokens.length });

//   } catch (error) {
//     console.log(error);
//     return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
//   }
// };

exports.send = async (req, res) => {
  try {
    const { title, message, type, fcmToken } = req.body;
    // type: 1(User), 2(Seller), 3(Both)

    if (!title || !message || !type) {
      return res.status(400).json({
        status: false,
        message: get_message(1009),
      });
    }

    let image = req.file ? req.file.path : null;

    let tokens = [];

    /* ===========================
       🔹 STATIC TOKEN FOR TESTING
    ============================ */
    if (fcmToken && typeof fcmToken === "string") {
      tokens.push(fcmToken.trim());
      console.log("🧪 Using STATIC FCM Token for testing");
    }
    /* ===========================
       🔹 DYNAMIC TOKENS FROM DB
    ============================ */
    else {
      if (type == 1 || type == 3) {
        const users = await User.find({
          isBlock: false,
          fcmToken: { $nin: [null, "", "string"] },
        }).select("fcmToken");

        tokens.push(...users.map(u => u.fcmToken));
      }

      if (type == 2 || type == 3) {
        const sellers = await Seller.find({
          isBlock: false,
          fcmToken: { $nin: [null, "", "string"] },
        }).select("fcmToken");

        tokens.push(...sellers.map(s => s.fcmToken));
      }
    }

    const uniqueTokens = [...new Set(tokens)];

    console.log(`🔔 Unique tokens count: ${uniqueTokens.length}`);

    /* ===========================
       🔹 SAVE TO DATABASE
    ============================ */
    const notifications = [];
    const date = new Date().toISOString();

    if (type == 1 || type == 3) {
      const allUsers = await User.find({ isBlock: false }).select("_id");
      allUsers.forEach((user) => {
        notifications.push({
          title,
          message,
          image,
          date,
          userId: user._id,
        });
      });
    }

    if (type == 2 || type == 3) {
      const allSellers = await Seller.find({ isBlock: false }).select("_id");
      allSellers.forEach((seller) => {
        notifications.push({
          title,
          message,
          image,
          date,
          sellerId: seller._id,
        });
      });
    }

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
      console.log(`💾 Saved ${notifications.length} notifications to DB`);
    }

    if (!uniqueTokens.length) {
      console.log("⚠️ No valid FCM tokens found, skipping push notification.");
    }

    /* ===========================
       🔹 SEND FCM NOTIFICATIONS
    ============================ */
    let invalidTokens = []; // Defined in outer scope

    if (uniqueTokens.length > 0) {
      if (!admin) {
        console.log("❌ Firebase Admin not initialized");
      } else {
        const payload = {
          notification: {
            title,
            body: message,
            image: image || undefined,
          },
        };

        const chunkSize = 500;

        for (let i = 0; i < uniqueTokens.length; i += chunkSize) {
          const batch = uniqueTokens.slice(i, i + chunkSize);

          const response = await admin
            .messaging()
            .sendEachForMulticast({ tokens: batch, notification: payload.notification });

          console.log(
            `📦 Batch ${i / chunkSize + 1} → Success: ${response.successCount}, Failure: ${response.failureCount}`
          );

          response.responses.forEach((resp, idx) => {
            if (!resp.success) {
              console.log("⚠️ Failed Token:", batch[idx], resp.error.message);
              invalidTokens.push(batch[idx]);
            }
          });
        }
      }
    }

    /* ===========================
       🔹 CLEAN INVALID TOKENS
    ============================ */
    if (invalidTokens.length && !fcmToken) {
      await User.updateMany(
        { fcmToken: { $in: invalidTokens } },
        { $set: { fcmToken: null } }
      );

      await Seller.updateMany(
        { fcmToken: { $in: invalidTokens } },
        { $set: { fcmToken: null } }
      );

      console.log("🧹 Invalid FCM tokens cleaned from DB");
    }

    return res.status(200).json({
      status: true,
      status: true,
      message: get_message(1010),
      sentTo: uniqueTokens.length,
      notification: {
        title,
        message,
        image,
        type,
      },
    });

  } catch (error) {
    console.log("❌ Notification Error:", error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error",
    });
  }
};


exports.particularSeller = async (req, res) => {
  try {
    const { sellerId, title, message } = req.body;
    if (!sellerId || !title || !message) {
      return res.status(400).json({ status: false, message: get_message(1011) });
    }

    if (!mongoose.Types.ObjectId.isValid(sellerId)) {
      return res.status(400).json({ status: false, message: get_message(1012) });
    }

    let image = null;
    if (req.file) image = req.file.path;

    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({ status: false, message: get_message(1013) });
    }

    // Create Notification Instance
    const notification = new Notification({
      title,
      message,
      image,
      date: new Date().toISOString(),
      sellerId: seller._id
    });

    // Prepare Tasks
    const tasks = [notification.save()];

    // Add FCM Task if possible
    if (seller.fcmToken && admin) {
      const payload = {
        notification: {
          title: title,
          body: message,
          image: image || ""
        }
      };

      const fcmPromise = admin.messaging().send({
        token: seller.fcmToken,
        notification: payload.notification
      }).catch(err => console.log("FCM Error:", err)); // Non-blocking error handling

      tasks.push(fcmPromise);
    }

    // Execute Parallel
    await Promise.all(tasks);

    return res.status(200).json({
      status: true,
      message: get_message(1014),
      notification,
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};
