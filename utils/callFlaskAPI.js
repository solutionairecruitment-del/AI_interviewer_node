const axios = require("axios");

async function callFlaskAPI({ method = "GET", url, body = {}, headers = {} }) {
  try {
    const response = await axios({
      method,
      url,
      data: body,
      headers,
      validateStatus: () => true, // Always resolve, handle status manually
    });
    return {
      success: response.status >= 200 && response.status < 300,
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    console.error("Flask API call error:", error.message);
    return {
      success: false,
      status: error.response?.status || 500,
      data: error.response?.data || { message: error.message },
    };
  }
}

module.exports = callFlaskAPI;
