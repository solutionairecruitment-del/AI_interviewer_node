const axios = require("axios");

const BASE_URL = "http://localhost:3000/api";

// Test data
const adminUser = {
  name: "Admin User",
  email: "admin@example.com",
  password: "admin123",
  userType: "admin",
};

const candidateUser = {
  name: "Test Candidate",
  email: "candidate@example.com",
  password: "candidate123",
  userType: "candidate",
};

let adminToken = "";
let candidateId = "";

// Test functions
async function createAdminUser() {
  try {
    console.log("Creating admin user...");
    const response = await axios.post(`${BASE_URL}/auth/register`, adminUser);
    console.log("Admin user created:", response.data.message);
    adminToken = response.data.data.token;
    return true;
  } catch (error) {
    if (
      error.response?.status === 400 &&
      error.response.data.message.includes("already exists")
    ) {
      console.log("Admin user already exists, proceeding with login...");
      return await loginAdmin();
    }
    console.log(
      "Failed to create admin user:",
      error.response?.data?.message || error.message
    );
    return false;
  }
}

async function loginAdmin() {
  try {
    console.log("Logging in as admin...");
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: adminUser.email,
      password: adminUser.password,
    });
    console.log("Admin login successful:", response.data.message);
    adminToken = response.data.data.token;
    return true;
  } catch (error) {
    console.log(
      "Admin login failed:",
      error.response?.data?.message || error.message
    );
    return false;
  }
}

async function createCandidateUser() {
  try {
    console.log("Creating candidate user...");
    const response = await axios.post(
      `${BASE_URL}/auth/register`,
      candidateUser
    );
    console.log("Candidate user created:", response.data.message);
    candidateId = response.data.data.user._id;
    return true;
  } catch (error) {
    if (
      error.response?.status === 400 &&
      error.response.data.message.includes("already exists")
    ) {
      console.log("Candidate user already exists, getting ID...");
      // Try to get candidate ID by logging in
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        email: candidateUser.email,
        password: candidateUser.password,
      });
      candidateId = loginResponse.data.data.user._id;
      return true;
    }
    console.log(
      "Failed to create candidate user:",
      error.response?.data?.message || error.message
    );
    return false;
  }
}

async function testGetAllUsers() {
  try {
    console.log("Testing get all users...");
    const response = await axios.get(`${BASE_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log(
      "Get all users successful:",
      response.data.data.users.length,
      "users found"
    );
    return true;
  } catch (error) {
    console.log(
      "Get all users failed:",
      error.response?.data?.message || error.message
    );
    return false;
  }
}

async function testUpdateUser() {
  try {
    console.log("Testing update user...");
    const response = await axios.put(
      `${BASE_URL}/admin/users/${candidateId}`,
      {
        status: "verified",
        name: "Updated Test Candidate",
      },
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    console.log("Update user successful:", response.data.message);
    return true;
  } catch (error) {
    console.log(
      "Update user failed:",
      error.response?.data?.message || error.message
    );
    return false;
  }
}

async function testForwardCandidate() {
  try {
    console.log("Testing forward candidate...");
    const response = await axios.post(
      `${BASE_URL}/admin/forward-candidate`,
      {
        candidateId: candidateId,
        jobId: "JOB123",
        notes: "Promising candidate for frontend position",
      },
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    console.log("Forward candidate successful:", response.data.message);
    return response.data.data.forwardedApplication._id;
  } catch (error) {
    console.log(
      "Forward candidate failed:",
      error.response?.data?.message || error.message
    );
    return null;
  }
}

async function testGetForwardedApplications() {
  try {
    console.log("Testing get forwarded applications...");
    const response = await axios.get(
      `${BASE_URL}/admin/forwarded-applications`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    console.log(
      "Get forwarded applications successful:",
      response.data.data.applications.length,
      "applications found"
    );
    return true;
  } catch (error) {
    console.log(
      "Get forwarded applications failed:",
      error.response?.data?.message || error.message
    );
    return false;
  }
}

async function testUpdateForwardedApplication(applicationId) {
  try {
    console.log("Testing update forwarded application...");
    const response = await axios.put(
      `${BASE_URL}/admin/forwarded-applications/${applicationId}`,
      {
        status: "reviewed",
        notes: "Application under review",
      },
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    console.log(
      "Update forwarded application successful:",
      response.data.message
    );
    return true;
  } catch (error) {
    console.log(
      "Update forwarded application failed:",
      error.response?.data?.message || error.message
    );
    return false;
  }
}

async function testDashboard() {
  try {
    console.log("Testing admin dashboard...");
    const response = await axios.get(`${BASE_URL}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log("Dashboard successful:", "Stats retrieved");
    return true;
  } catch (error) {
    console.log(
      "Dashboard failed:",
      error.response?.data?.message || error.message
    );
    return false;
  }
}

async function testNonAdminAccess() {
  try {
    console.log("Testing non-admin access (should fail)...");
    const response = await axios.get(`${BASE_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log("Non-admin access test failed - should have been denied");
    return false;
  } catch (error) {
    if (error.response?.status === 403) {
      console.log("Non-admin access correctly denied");
      return true;
    }
    console.log(
      "Non-admin access test unexpected error:",
      error.response?.data?.message || error.message
    );
    return false;
  }
}

// Run all tests
async function runAdminTests() {
  console.log("🚀 Starting Admin API tests...\n");

  // Setup
  const adminCreated = await createAdminUser();
  if (!adminCreated) {
    console.log("❌ Tests failed at admin setup");
    return;
  }

  const candidateCreated = await createCandidateUser();
  if (!candidateCreated) {
    console.log("❌ Tests failed at candidate setup");
    return;
  }

  // Admin functionality tests
  await testGetAllUsers();
  await testUpdateUser();

  const applicationId = await testForwardCandidate();
  if (applicationId) {
    await testGetForwardedApplications();
    await testUpdateForwardedApplication(applicationId);
  }

  await testDashboard();

  console.log("\n🎉 All admin tests completed!");
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
    await runAdminTests();
  }
}

main().catch(console.error);
