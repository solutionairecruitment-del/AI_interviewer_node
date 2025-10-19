const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");

const BASE_URL = "http://localhost:3000/api";

// Test data
const testUser = {
  name: "Profile Test User",
  email: "profile@example.com",
  password: "password123",
  role: "candidate",
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

async function testBuildProfile() {
  try {
    console.log("Testing comprehensive profile scraping...");
    
    // Create a test PDF file
    const testFilePath = path.join(__dirname, "test-resume.pdf");
    const testContent = "Test Resume Content - John Doe, Software Engineer";
    fs.writeFileSync(testFilePath, testContent);

    const formData = new FormData();
    formData.append("resume", fs.createReadStream(testFilePath));
    formData.append("githubUsername", "octocat"); // GitHub's test user
    formData.append("linkedinUsername", "testuser"); // Optional
    formData.append("scrapingOptions", JSON.stringify({
      includeGitHubStats: true,
      includeGitHubLanguages: true
    }));

    const response = await axios.post(
      `${BASE_URL}/profile/build`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          ...formData.getHeaders(),
        },
      }
    );

    console.log("✅ Profile scraping successful:", response.data.message);
    console.log("📄 Resume data:", response.data.data.resumeData ? "Parsed" : "Not provided");
    console.log("🐙 GitHub profile:", response.data.data.githubProfile.login);
    console.log("📊 GitHub repos count:", response.data.data.githubRepos.length);
    console.log("🔗 LinkedIn profile:", response.data.data.linkedinProfile ? "Processed" : "Not provided");
    console.log("📈 Additional data:", Object.keys(response.data.data.additionalData));
    console.log("⏰ Scraped at:", response.data.data.scrapingMetadata.scrapedAt);
    
    // Clean up test file
    fs.unlinkSync(testFilePath);
    
    return true;
  } catch (error) {
    console.log(
      "❌ Profile scraping failed:",
      error.response?.data?.message || error.message
    );
    return false;
  }
}

async function testBuildProfileWithoutAuth() {
  try {
    console.log("Testing build profile without auth (should fail)...");
    
    const formData = new FormData();
    formData.append("githubUsername", "octocat");

    await axios.post(`${BASE_URL}/profile/build`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });
    
    console.log("❌ Build profile without auth should have failed!");
    return false;
  } catch (error) {
    if (error.response?.status === 401) {
      console.log("✅ Build profile without auth correctly blocked");
      return true;
    }
    console.log(
      "Unexpected error:",
      error.response?.data?.message || error.message
    );
    return false;
  }
}

async function testBuildProfileWithInvalidData() {
  try {
    console.log("Testing profile scraping with invalid data (should fail)...");
    
    const formData = new FormData();
    // Missing required field: githubUsername

    await axios.post(
      `${BASE_URL}/profile/build`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          ...formData.getHeaders(),
        },
      }
    );
    
    console.log("❌ Profile scraping with invalid data should have failed!");
    return false;
  } catch (error) {
    if (error.response?.status === 400) {
      console.log("✅ Profile scraping with invalid data correctly rejected");
      return true;
    }
    console.log(
      "Unexpected error:",
      error.response?.data?.message || error.message
    );
    return false;
  }
}

async function testGitHubOnlyScraping() {
  try {
    console.log("Testing GitHub-only scraping (no resume)...");
    
    const formData = new FormData();
    formData.append("githubUsername", "octocat");
    formData.append("scrapingOptions", JSON.stringify({
      includeGitHubStats: true,
      includeGitHubLanguages: true
    }));

    const response = await axios.post(
      `${BASE_URL}/profile/build`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          ...formData.getHeaders(),
        },
      }
    );

    console.log("✅ GitHub-only scraping successful:", response.data.message);
    console.log("🐙 GitHub profile:", response.data.data.githubProfile.login);
    console.log("📊 GitHub stats:", response.data.data.additionalData.githubStats);
    console.log("💻 GitHub languages:", response.data.data.additionalData.githubLanguages?.languages?.length || 0, "languages found");
    
    return true;
  } catch (error) {
    console.log(
      "❌ GitHub-only scraping failed:",
      error.response?.data?.message || error.message
    );
    return false;
  }
}

// Run all tests
async function runProfileTests() {
  console.log("🚀 Starting Profile API tests...\n");

  // Setup
  const userCreated = await createTestUser();
  if (!userCreated) {
    console.log("❌ Tests failed at user setup");
    return;
  }

  // Test 1: Comprehensive profile scraping with all data
  await testBuildProfile();

  // Test 2: GitHub-only scraping (no resume)
  await testGitHubOnlyScraping();

  // Test 3: Build profile without authentication
  await testBuildProfileWithoutAuth();

  // Test 4: Build profile with invalid data
  await testBuildProfileWithInvalidData();

  console.log("\n🎉 All profile tests completed!");
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
    await runProfileTests();
  }
}

main().catch(console.error);
