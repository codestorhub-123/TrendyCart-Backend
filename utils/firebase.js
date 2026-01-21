let admin;

try {
  admin = require("firebase-admin");
  const setting = require("../setting");

  if (setting?.privateKey?.project_id) {

    // 🔥 FIX escaped newlines
    setting.privateKey.private_key =
      setting.privateKey.private_key.replace(/\\n/g, "\n");

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(setting.privateKey),
      });
      console.log("🔥 Firebase Admin Initialized");
      console.log("📌 Project:", setting.privateKey.project_id);
    }
  } else {
    console.warn("⚠️ Firebase privateKey object invalid");
    admin = null;
  }

} catch (err) {
  console.error("❌ Firebase init failed:", err.message);
  admin = null;
}

module.exports = admin;
