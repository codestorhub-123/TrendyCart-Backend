module.exports = {
  "addressProof": {
    "isActive": true,
    "isRequired": true
  },
  "govId": {
    "isActive": true,
    "isRequired": true
  },
  "registrationCert": {
    "isActive": true,
    "isRequired": false
  },
  "currency": {
    "countryCode": "",
    "currencyCode": "",
    "isDefault": false,
    "name": "",
    "symbol": ""
  },
  "_id": "673eaea4529c5f0fedc97bec",
  "privacyPolicyLink": "<p>TERMS AND CONDITION LINK</p>",
  "privacyPolicyText": "<h2 style=\"text-align: center;\">Privacy Policy</h2><p>We respect your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard your data.</p><h3>Information We Collect</h3><p>We may collect personal details such as your name, email address, phone number, and usage data when you use our services.</p><h3>How We Use Your Information</h3><p>Your information is used to provide and improve our services, communicate with you, ensure security, and comply with legal requirements.</p><h3>Data Sharing</h3><p>We do not sell or rent your personal data. Information may be shared only with trusted third parties when required to operate our services or by law.</p><h3>Data Security</h3><p>We implement appropriate security measures to protect your information from unauthorized access, loss, or misuse.</p><h3>Your Rights</h3><p>You have the right to access, update, or delete your personal information by contacting us.</p><h3>Changes to This Policy</h3><p>We may update this Privacy Policy from time to time. Any changes will be posted here.</p><h3>Contact Us</h3><p>If you have any questions about this Privacy Policy, please contact us.</p>",
  "withdrawCharges": 10,
  "withdrawLimit": 1000,
  "createdAt": "2023-04-12T04:45:27.628Z",
  "updatedAt": "2026-01-19T10:58:03.418Z",
  "cancelOrderCharges": 20,
  "paymentGateway": [
    {
      "name": "paytm"
    },
    {
      "name": "phonePe"
    }
  ],
  "adminCommissionCharges": 50,
  "isAddProductRequest": true,
  "razorPayId": "Razor Pay Id",
  "razorPaySwitch": true,
  "razorSecretKey": process.env.RAZORPAY_SECRET_KEY,
  "stripePublishableKey": process.env.STRIPE_PUBLISHABLE_KEY,
  "stripeSecretKey": process.env.STRIPE_SECRET_KEY,
  "stripeSwitch": true,
  "isUpdateProductRequest": true,
  "isFakeData": false,
  "zegoAppId": process.env.ZEGO_APP_ID,
  "zegoAppSignIn": process.env.ZEGO_APP_SIGN_IN,
  "privateKey": {
    "type": "service_account",
    "project_id": process.env.FIREBASE_PROJECT_ID,
    "private_key_id": "df0f93ebe64370f93b5a8e61688ad0a52a2408c5",
    "private_key": process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
    "client_email": process.env.FIREBASE_CLIENT_EMAIL,
    "client_id": process.env.FIREBASE_CLIENT_ID,
    "auth_uri": process.env.FIREBASE_AUTH_URI,
    "token_uri": process.env.FIREBASE_TOKEN_URI,
    "auth_provider_x509_cert_url": process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
    "client_x509_cert_url": process.env.FIREBASE_CLIENT_X509_CERT_URL,
    "universe_domain": process.env.FIREBASE_UNIVERSE_DOMAIN
  },
  "flutterWaveId": process.env.FLUTTER_WAVE_ID,
  "flutterWaveSwitch": true,
  "isCashOnDelivery": false,
  "minPayout": 0,
  "openaiApiKey": "",
  "paymentReminderForLiveAuction": 0,
  "paymentReminderForManualAuction": 0,
  "resendApiKey": "RESEND API KEY",
  "termsAndConditionsLink": "<p>TERMS AND CONDITION LINK12345</p>",
  "termsConditionText": "<h2>Terms &amp; Conditions</h2><p>By accessing or using this website or application, you agree to comply with the following terms.</p><p>You may browse products without creating an account. However, placing an order requires providing accurate and complete information. You are responsible for maintaining the confidentiality of your account details.</p><p>All product descriptions, images, and prices are provided for general information only. While we strive for accuracy, errors may occur, and we reserve the right to correct them or cancel orders if necessary.</p><p>Orders are subject to availability and confirmation. Payments must be completed using the payment methods provided on the platform. Shipping timelines are estimates and may vary due to location or external factors.</p><p>Returns and refunds are handled according to our return policy. Items must be returned in original condition to be eligible for a refund or replacement.</p><p>Wishlist items saved without login are stored locally on your device and may be removed if browser data is cleared.</p><p>All content on this platform, including images, text, and logos, is protected by intellectual property laws and may not be used without permission.</p><p>We reserve the right to suspend or terminate access to the platform in case of misuse, fraudulent activity, or violation of these terms.</p><p>These Terms &amp; Conditions may be updated from time to time. Continued use of the platform indicates acceptance of any changes.</p>"
};