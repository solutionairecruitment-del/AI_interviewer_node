const axios = require("axios");

const BASE_URL = "http://localhost:3000/api";

// Test data
const testUser = {
  name: "Logout Test User",
  email: "logout@example.com",
  password: "password123",
  userType: "candidate",
};

let authToken = "";

// Test functions
async function createTestUser() {
  try {
    console.log("Creating test user...");
    const response = await axios.post(`${BASE_URL}/auth/register`, testUser);
    console.log("Test user created:", response.data.message);
    authToken = response.data.data.token;
    return true;
  } catch (error) {
    if (
      error.response?.status === 400 &&
      error.response.data.message.includes("already exists")
    ) {
      console.log("Test user already exists, proceeding with login...");
      return await loginTestUser();
    }
    console.log(
      "Failed to create test user:",
      error.response?.data?.message || error.message
    );
    return false;
  }
}

async function loginTestUser() {
  try {
    console.log("Logging in test user...");
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

async function testProtectedRoute() {
  try {
    console.log("Testing protected route...");
    const response = await axios.get(`${BASE_URL}/users/me`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    console.log("Protected route accessible:", response.data.data.user.name);
    return true;
  } catch (error) {
    console.log(
      "Protected route failed:",
      error.response?.data?.message || error.message
    );
    return false;
  }
}

async function testLogout() {
  try {
    console.log("Testing logout...");
    const response = await axios.post(
      `${BASE_URL}/auth/logout`,
      {},
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );
    console.log("Logout successful:", response.data.message);
    return true;
  } catch (error) {
    console.log(
      "Logout failed:",
      error.response?.data?.message || error.message
    );
    return false;
  }
}

async function testTokenAfterLogout() {
  try {
    console.log("Testing token after logout (should fail)...");
    const response = await axios.get(`${BASE_URL}/users/me`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    console.log("❌ Token still works after logout - this should not happen!");
    return false;
  } catch (error) {
    if (error.response?.status === 401) {
      console.log("✅ Token correctly invalidated after logout");
      return true;
    }
    console.log(
      "Unexpected error after logout:",
      error.response?.data?.message || error.message
    );
    return false;
  }
}

async function testAdminBlacklistAccess() {
  try {
    console.log("Testing admin blacklist access...");

    // First create admin user
    const adminUser = {
      name: "Admin User",
      email: "admin@example.com",
      password: "admin123",
      userType: "admin",
    };

    let adminToken = "";

    try {
      const registerResponse = await axios.post(
        `${BASE_URL}/auth/register`,
        adminUser
      );
      adminToken = registerResponse.data.data.token;
      console.log("Admin user created");
    } catch (error) {
      if (
        error.response?.status === 400 &&
        error.response.data.message.includes("already exists")
      ) {
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
          email: adminUser.email,
          password: adminUser.password,
        });
        adminToken = loginResponse.data.data.token;
        console.log("Admin user logged in");
      }
    }

    // Test blacklisted tokens endpoint
    const response = await axios.get(`${BASE_URL}/admin/blacklisted-tokens`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log(
      "Admin blacklist access successful:",
      response.data.data.count,
      "tokens found"
    );
    return true;
  } catch (error) {
    console.log(
      "Admin blacklist access failed:",
      error.response?.data?.message || error.message
    );
    return false;
  }
}

async function testClearExpiredTokens() {
  try {
    console.log("Testing clear expired tokens...");

    // Get admin token
    const adminUser = {
      email: "admin@example.com",
      password: "admin123",
    };

    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, adminUser);
    const adminToken = loginResponse.data.data.token;

    const response = await axios.post(
      `${BASE_URL}/admin/clear-expired-tokens`,
      {},
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    console.log("Clear expired tokens successful:", response.data.message);
    return true;
  } catch (error) {
    console.log(
      "Clear expired tokens failed:",
      error.response?.data?.message || error.message
    );
    return false;
  }
}

// Run all tests
async function runLogoutTests() {
  console.log("🚀 Starting Logout API tests...\n");

  // Setup
  const userCreated = await createTestUser();
  if (!userCreated) {
    console.log("❌ Tests failed at user setup");
    return;
  }

  // Test 1: Verify token works before logout
  await testProtectedRoute();

  // Test 2: Logout
  await testLogout();

  // Test 3: Verify token is invalidated
  await testTokenAfterLogout();

  // Test 4: Admin blacklist access
  await testAdminBlacklistAccess();

  // Test 5: Clear expired tokens
  await testClearExpiredTokens();

  console.log("\n🎉 All logout tests completed!");
}

// Check if server is running
async function checkServer() {
  try {
    await axios.get("http://localhost:3000/");
    console.log("✅ Server is running");
    return true;
  } catch (error) {
    console.log(
      "❌ Server is not running. Please start the server with: npm run dev"
    );
    return false;
  }
}

// Main execution
async function main() {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await runLogoutTests();
  }
}

main().catch(console.error);
