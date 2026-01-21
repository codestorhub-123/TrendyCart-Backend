require('dotenv').config();

const getApiBase = () => {
    const isLocal = process.env.API_URL && process.env.API_URL.includes("localhost");
    let base = isLocal ? process.env.API_URL.replace("/api/v1", "") : process.env.BASE_URL;

    if (base && !base.endsWith("/")) {
        base += "/";
    }
    return base || "";
};

module.exports = getApiBase;
