const passValidation = "required|password_pattern";
const sortOrder = "in:ASC,DESC";
const validationSchema = {
  "/auth/login": {
    schema: {
      identity: "required",
      mobileNumber: "required",
      fcmToken: "string",
    },
  },
};

module.exports = {
  passValidation,
  sortOrder,
  validationSchema,
};
