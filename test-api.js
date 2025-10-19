const axios = require("axios");

const BASE_URL = "http://localhost:3000/api";

// Test data
const testUser = {
  name: "Test User",
  email: "test@example.com",
  password: "password123",
  userType: "candidate",
};

let authToken = "";

// Test functions
async function testRegister() {
  try {
    console.log("Testing user registration...");
    const response = await axios.post(`${BASE_URL}/auth/register`, testUser);
    console.log("Registration successful:", response.data.message);
    authToken = response.data.data.token;
    return true;
  } catch (error) {
    if (
      error.response?.status === 400 &&
      error.response.data.message.includes("already exists")
    ) {
      console.log("User already exists, proceeding with login...");
      return await testLogin();
    }
    console.log(
      "Registration failed:",
      error.response?.data?.message || error.message
    );
    return false;
  }
}

async function testLogin() {
  try {
    console.log("Testing user login...");
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password,
    });
    console.log("Login successful:", response.data.message);
    authToken = response.data.data.token;
    return true;
  } catch (error) {
    console.log(
      "Login failed:",
      error.response?.data?.message || error.message
    );
    return false;
  }
}

async function testGetProfile() {
  try {
    console.log("Testing get profile...");
    const response = await axios.get(`${BASE_URL}/users/me`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    console.log("Get profile successful:", response.data.data.user.name);
    return true;
  } catch (error) {
    console.log(
      "Get profile failed:",
      error.response?.data?.message || error.message
    );
    return false;
  }
}

async function testUpdateProfile() {
  try {
    console.log("Testing update profile...");
    const response = await axios.put(
      `${BASE_URL}/users/me`,
      {
        name: "Updated Test User",
        phone: "+1234567890",
      },
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );
    console.log("Update profile successful:", response.data.message);
    return true;
  } catch (error) {
    console.log(
      "Update profile failed:",
      error.response?.data?.message || error.message
    );
    return false;
  }
}

async function testForgotPassword() {
  try {
    console.log("Testing forgot password...");
    const response = await axios.post(`${BASE_URL}/auth/forgot-password`, {
      email: testUser.email,
    });
    console.log("Forgot password successful:", response.data.message);

    // In development, token might be returned for testing
    const resetToken = response.data.data?.resetToken;
    if (resetToken) {
      console.log("Reset token (development):", resetToken);
    } else {
      console.log("Check your email for reset link");
    }

    return resetToken;
  } catch (error) {
    console.log(
      "Forgot password failed:",
      error.response?.data?.message || error.message
    );
    return null;
  }
}

async function testResetPassword(resetToken) {
  try {
    console.log("Testing reset password...");
    const response = await axios.post(`${BASE_URL}/auth/reset-password`, {
      token: resetToken,
      newPassword: "newpassword123",
    });
    console.log("Reset password successful:", response.data.message);
    return true;
  } catch (error) {
    console.log(
      "Reset password failed:",
      error.response?.data?.message || error.message
    );
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log("Starting API tests...\n");

  const registerSuccess = await testRegister();
  if (!registerSuccess) {
    console.log("Tests failed at registration step");
    return;
  }

  await testGetProfile();
  await testUpdateProfile();

  const resetToken = await testForgotPassword();
  if (resetToken) {
    await testResetPassword(resetToken);
  }

  console.log("\n All tests completed!");
}

// Check if server is running
async function checkServer() {
  try {
    await axios.get("http://localhost:3000/");
    console.log("Server is running");
    return true;
  } catch (error) {
    console.log(
      "Server is not running. Please start the server with: npm run dev"
    );
    return false;
  }
}

// Main execution
async function main() {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await runTests();
  }
}

main().catch(console.error);
