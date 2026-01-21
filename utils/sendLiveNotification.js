const admin = require("./firebase");

const sendLiveNotification = async ({
  tokens = [],
  seller,
  liveSellingHistoryId,
}) => {
  console.log("🔔 [Notification] Function triggered");

  try {
    if (!admin) {
      console.warn("⚠️ [Notification] Firebase admin not available. Skipping.");
      return;
    }

    if (!Array.isArray(tokens) || tokens.length === 0) {
      console.warn("⚠️ [Notification] No FCM tokens found.");
      return;
    }

    if (!admin.messaging) {
      console.warn("⚠️ [Notification] Firebase messaging not initialized.");
      return;
    }

    console.log("📨 [Notification] Sending to tokens:", tokens.length);
    console.log("👤 [Notification] Seller:", seller.firstName, seller.lastName);

    const payload = {
      notification: {
        title: `${seller.firstName} is live now! 🚀✨`,
        body: "📺 Tap to join the stream and watch live! 🎥👀",
        image: seller.image || "",
      },
      data: {
        channel: seller.channel.toString(),
        liveSellingHistoryId: liveSellingHistoryId.toString(),
        type: "LIVE",
      },
    };

    const response = await admin.messaging().sendEachForMulticast({
      tokens,
      notification: payload.notification,
      data: payload.data,
    });

    console.log(
      `✅ [Notification] Sent successfully → Success: ${response.successCount}, Failed: ${response.failureCount}`
    );

    if (response.failureCount > 0) {
      response.responses.forEach((res, index) => {
        if (!res.success) {
          console.error(
            `❌ [Notification] Failed token: ${tokens[index]}`,
            res.error?.message
          );
        }
      });
    }
  } catch (error) {
    console.error("🔥 [Notification] Error (ignored):", error.message);
  }
};

module.exports = sendLiveNotification;
