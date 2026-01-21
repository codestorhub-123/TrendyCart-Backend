// Helper to generate 8-digit unique numeric ID
exports.generate8DigitId = () => {
    return Math.floor(10000000 + Math.random() * 90000000).toString();
};
