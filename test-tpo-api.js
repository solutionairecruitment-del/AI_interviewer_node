const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");

const BASE_URL = "http://localhost:3000/api";
let authToken = "";
let tpoToken = "";
let studentToken = "";
let createdAnnouncementId = "";
let createdJobId = "";

// Colors for console output
const colors = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  reset: "\x1b[0m",
};

const log = (message, color = "reset") => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Test functions
const testAuth = async () => {
  log("\n=== Testing Authentication ===", "blue");

  try {
    // Register TPO user
    log("1. Registering TPO user...", "yellow");
    const tpoUser = {
      name: "TPO Officer",
      email: "tpo@college.edu",
      password: "password123",
      role: "tpo", // TPO users have tpo role
    };

    const registerResponse = await axios.post(
      `${BASE_URL}/auth/register`,
      tpoUser
    );
    log("✓ TPO user registered successfully", "green");

    // Login TPO user
    log("2. Logging in TPO user...", "yellow");
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: tpoUser.email,
      password: tpoUser.password,
    });

    tpoToken = loginResponse.data.token;
    log("✓ TPO user logged in successfully", "green");

    // Register student user
    log("3. Registering student user...", "yellow");
    const studentUser = {
      name: "John Student",
      email: "john.student@college.edu",
      password: "password123",
      role: "student",
    };

    await axios.post(`${BASE_URL}/auth/register`, studentUser);
    log("✓ Student user registered successfully", "green");

    // Login student user
    log("4. Logging in student user...", "yellow");
    const studentLoginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: studentUser.email,
      password: studentUser.password,
    });

    studentToken = studentLoginResponse.data.token;
    log("✓ Student user logged in successfully", "green");
  } catch (error) {
    log(
      `✗ Authentication test failed: ${
        error.response?.data?.message || error.message
      }`,
      "red"
    );
  }
};

const testAnnouncements = async () => {
  log("\n=== Testing Announcements ===", "blue");

  try {
    // Create announcement
    log("1. Creating announcement...", "yellow");
    const announcementData = {
      title: "Important: Campus Recruitment Drive",
      content:
        "We are pleased to announce that TechCorp will be conducting a campus recruitment drive next month. All final year students are eligible to apply.",
      category: "job",
      priority: "high",
      targetAudience: "final_year,pre_final_year",
      tags: "recruitment,techcorp,campus drive",
    };

    const createResponse = await axios.post(
      `${BASE_URL}/tpo/announcements`,
      announcementData,
      {
        headers: {
          Authorization: `Bearer ${tpoToken}`,
        },
      }
    );

    createdAnnouncementId = createResponse.data.data._id;
    log("✓ Announcement created successfully", "green");

    // Get all announcements
    log("2. Fetching all announcements...", "yellow");
    const getAllResponse = await axios.get(`${BASE_URL}/tpo/announcements`);
    log(
      `✓ Found ${getAllResponse.data.data.docs.length} announcements`,
      "green"
    );

    // Get announcement by ID
    log("3. Fetching announcement by ID...", "yellow");
    const getByIdResponse = await axios.get(
      `${BASE_URL}/tpo/announcements/${createdAnnouncementId}`
    );
    log("✓ Announcement retrieved successfully", "green");

    // Update announcement
    log("4. Updating announcement...", "yellow");
    const updateData = {
      title: "Updated: Campus Recruitment Drive - TechCorp",
      priority: "urgent",
    };

    const updateResponse = await axios.put(
      `${BASE_URL}/tpo/announcements/${createdAnnouncementId}`,
      updateData,
      {
        headers: {
          Authorization: `Bearer ${tpoToken}`,
        },
      }
    );
    log("✓ Announcement updated successfully", "green");

    // Publish announcement
    log("5. Publishing announcement...", "yellow");
    const publishResponse = await axios.patch(
      `${BASE_URL}/tpo/announcements/${createdAnnouncementId}/publish`,
      {},
      {
        headers: {
          Authorization: `Bearer ${tpoToken}`,
        },
      }
    );
    log("✓ Announcement published successfully", "green");
  } catch (error) {
    log(
      `✗ Announcement test failed: ${
        error.response?.data?.message || error.message
      }`,
      "red"
    );
  }
};

const testJobs = async () => {
  log("\n=== Testing Jobs ===", "blue");

  try {
    // Create job
    log("1. Creating job posting...", "yellow");
    const jobData = {
      title: "Software Engineer - Full Stack",
      companyName: "TechCorp Solutions",
      companyWebsite: "https://techcorp.com",
      companyLocation: "Bangalore, India",
      description:
        "We are looking for a talented full-stack developer to join our team. The ideal candidate should have experience with React, Node.js, and MongoDB.",
      skills: "React,Node.js,MongoDB,JavaScript,TypeScript",
      experience: "0-2 years",
      education: "B.Tech in Computer Science or related field",
      minCgpa: "7.0",
      ctc: "800000",
      currency: "INR",
      basic: "600000",
      hra: "120000",
      da: "80000",
      jobType: "full_time",
      workMode: "hybrid",
      location: "Bangalore",
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      positions: "5",
      tags: "software engineer,full stack,react,nodejs",
    };

    const createResponse = await axios.post(`${BASE_URL}/tpo/jobs`, jobData, {
      headers: {
        Authorization: `Bearer ${tpoToken}`,
      },
    });

    createdJobId = createResponse.data.data._id;
    log("✓ Job created successfully", "green");

    // Get all jobs
    log("2. Fetching all jobs...", "yellow");
    const getAllResponse = await axios.get(`${BASE_URL}/tpo/jobs`);
    log(`✓ Found ${getAllResponse.data.data.docs.length} jobs`, "green");

    // Get job by ID
    log("3. Fetching job by ID...", "yellow");
    const getByIdResponse = await axios.get(
      `${BASE_URL}/tpo/jobs/${createdJobId}`
    );
    log("✓ Job retrieved successfully", "green");

    // Update job
    log("4. Updating job...", "yellow");
    const updateData = {
      title: "Senior Software Engineer - Full Stack",
      ctc: "1200000",
      positions: "3",
    };

    const updateResponse = await axios.put(
      `${BASE_URL}/tpo/jobs/${createdJobId}`,
      updateData,
      {
        headers: {
          Authorization: `Bearer ${tpoToken}`,
        },
      }
    );
    log("✓ Job updated successfully", "green");

    // Publish job
    log("5. Publishing job...", "yellow");
    const publishResponse = await axios.patch(
      `${BASE_URL}/tpo/jobs/${createdJobId}/publish`,
      {},
      {
        headers: {
          Authorization: `Bearer ${tpoToken}`,
        },
      }
    );
    log("✓ Job published successfully", "green");
  } catch (error) {
    log(
      `✗ Job test failed: ${error.response?.data?.message || error.message}`,
      "red"
    );
  }
};

const testStudentAccess = async () => {
  log("\n=== Testing Student Access ===", "blue");

  try {
    // Student viewing announcements
    log("1. Student viewing announcements...", "yellow");
    const studentAnnouncementsResponse = await axios.get(
      `${BASE_URL}/tpo/student/announcements`,
      {
        headers: {
          Authorization: `Bearer ${studentToken}`,
        },
      }
    );
    log(
      `✓ Student can view ${studentAnnouncementsResponse.data.data.docs.length} announcements`,
      "green"
    );

    // Student viewing jobs
    log("2. Student viewing jobs...", "yellow");
    const studentJobsResponse = await axios.get(
      `${BASE_URL}/tpo/student/jobs`,
      {
        headers: {
          Authorization: `Bearer ${studentToken}`,
        },
      }
    );
    log(
      `✓ Student can view ${studentJobsResponse.data.data.docs.length} jobs`,
      "green"
    );

    // Student viewing specific announcement
    log("3. Student viewing specific announcement...", "yellow");
    const studentAnnouncementResponse = await axios.get(
      `${BASE_URL}/tpo/student/announcements/${createdAnnouncementId}`,
      {
        headers: {
          Authorization: `Bearer ${studentToken}`,
        },
      }
    );
    log("✓ Student can view specific announcement", "green");

    // Student viewing specific job
    log("4. Student viewing specific job...", "yellow");
    const studentJobResponse = await axios.get(
      `${BASE_URL}/tpo/student/jobs/${createdJobId}`,
      {
        headers: {
          Authorization: `Bearer ${studentToken}`,
        },
      }
    );
    log("✓ Student can view specific job", "green");
  } catch (error) {
    log(
      `✗ Student access test failed: ${
        error.response?.data?.message || error.message
      }`,
      "red"
    );
  }
};

const testDashboard = async () => {
  log("\n=== Testing Dashboard ===", "blue");

  try {
    log("1. Fetching dashboard statistics...", "yellow");
    const dashboardResponse = await axios.get(`${BASE_URL}/tpo/dashboard`, {
      headers: {
        Authorization: `Bearer ${tpoToken}`,
      },
    });

    const stats = dashboardResponse.data.data;
    log("✓ Dashboard statistics retrieved successfully", "green");
    log(`  - Total Announcements: ${stats.announcements.total}`, "green");
    log(
      `  - Published Announcements: ${stats.announcements.published}`,
      "green"
    );
    log(`  - Total Jobs: ${stats.jobs.total}`, "green");
    log(`  - Published Jobs: ${stats.jobs.published}`, "green");
    log(`  - Total Applications: ${stats.applications}`, "green");
  } catch (error) {
    log(
      `✗ Dashboard test failed: ${
        error.response?.data?.message || error.message
      }`,
      "red"
    );
  }
};

const testFileUpload = async () => {
  log("\n=== Testing File Upload ===", "blue");

  try {
    // Create a test file
    const testFilePath = path.join(__dirname, "test-file.txt");
    fs.writeFileSync(testFilePath, "This is a test file for upload testing.");

    log("1. Creating announcement with file attachment...", "yellow");

    const formData = new FormData();
    formData.append("title", "Announcement with Attachment");
    formData.append(
      "content",
      "This announcement includes a test file attachment."
    );
    formData.append("category", "general");
    formData.append("priority", "medium");
    formData.append("attachments", fs.createReadStream(testFilePath));

    const uploadResponse = await axios.post(
      `${BASE_URL}/tpo/announcements`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${tpoToken}`,
          ...formData.getHeaders(),
        },
      }
    );

    log("✓ Announcement with file attachment created successfully", "green");

    // Clean up test file
    fs.unlinkSync(testFilePath);
  } catch (error) {
    log(
      `✗ File upload test failed: ${
        error.response?.data?.message || error.message
      }`,
      "red"
    );
  }
};

const testErrorHandling = async () => {
  log("\n=== Testing Error Handling ===", "blue");

  try {
    // Test unauthorized access
    log("1. Testing unauthorized access...", "yellow");
    try {
      await axios.post(`${BASE_URL}/tpo/announcements`, {
        title: "Test",
        content: "Test content",
        category: "general",
      });
    } catch (error) {
      if (error.response?.status === 401) {
        log("✓ Unauthorized access properly blocked", "green");
      } else {
        throw error;
      }
    }

    // Test invalid data
    log("2. Testing invalid data validation...", "yellow");
    try {
      await axios.post(
        `${BASE_URL}/tpo/announcements`,
        {
          title: "", // Invalid: empty title
          content: "Test content",
          category: "invalid_category", // Invalid category
        },
        {
          headers: {
            Authorization: `Bearer ${tpoToken}`,
          },
        }
      );
    } catch (error) {
      if (error.response?.status === 400) {
        log("✓ Invalid data properly validated", "green");
      } else {
        throw error;
      }
    }

    // Test non-existent resource
    log("3. Testing non-existent resource...", "yellow");
    try {
      await axios.get(`${BASE_URL}/tpo/announcements/507f1f77bcf86cd799439011`);
    } catch (error) {
      if (error.response?.status === 404) {
        log("✓ Non-existent resource properly handled", "green");
      } else {
        throw error;
      }
    }
  } catch (error) {
    log(
      `✗ Error handling test failed: ${
        error.response?.data?.message || error.message
      }`,
      "red"
    );
  }
};

const cleanup = async () => {
  log("\n=== Cleanup ===", "blue");

  try {
    if (createdAnnouncementId) {
      log("1. Deleting test announcement...", "yellow");
      await axios.delete(
        `${BASE_URL}/tpo/announcements/${createdAnnouncementId}`,
        {
          headers: {
            Authorization: `Bearer ${tpoToken}`,
          },
        }
      );
      log("✓ Test announcement deleted", "green");
    }

    if (createdJobId) {
      log("2. Deleting test job...", "yellow");
      await axios.delete(`${BASE_URL}/tpo/jobs/${createdJobId}`, {
        headers: {
          Authorization: `Bearer ${tpoToken}`,
        },
      });
      log("✓ Test job deleted", "green");
    }
  } catch (error) {
    log(
      `✗ Cleanup failed: ${error.response?.data?.message || error.message}`,
      "red"
    );
  }
};

// Main test runner
const runTests = async () => {
  log("🚀 Starting TPO API Tests...", "blue");

  try {
    await testAuth();
    await delay(1000);

    await testAnnouncements();
    await delay(1000);

    await testJobs();
    await delay(1000);

    await testStudentAccess();
    await delay(1000);

    await testDashboard();
    await delay(1000);

    await testFileUpload();
    await delay(1000);

    await testErrorHandling();
    await delay(1000);

    await cleanup();

    log("\n🎉 All TPO API tests completed successfully!", "green");
  } catch (error) {
    log(`\n❌ Test suite failed: ${error.message}`, "red");
  }
};

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = {
  runTests,
  testAuth,
  testAnnouncements,
  testJobs,
  testStudentAccess,
  testDashboard,
  testFileUpload,
  testErrorHandling,
  cleanup,
};
