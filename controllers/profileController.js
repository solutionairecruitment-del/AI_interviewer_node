// const fs = require("fs");
// const path = require("path");
// const fetch = require("node-fetch");
// const { GoogleGenerativeAI } = require("@google/generative-ai");
// const axios = require("axios");

// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// const parseResume = async (filePath) => {
//   try {
//     // Check if Gemini API key is available
//     if (!process.env.GEMINI_API_KEY) {
//       console.log(" GEMINI_API_KEY not found, using fallback parsing");
//       return await parseResumeFallback(filePath);
//     }

//     const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
//     const fileData = fs.readFileSync(filePath);

//     // Determine file type
//     const fileExt = path.extname(filePath).toLowerCase();
//     let mimeType = "application/pdf";
//     if (fileExt === '.doc') mimeType = "application/msword";
//     if (fileExt === '.docx') mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

//     const prompt = `
//       Extract structured data from this resume document.
//       Return a valid JSON object with these exact fields:
//       {
//         "name": "Full Name",
//         "email": "email@example.com",
//         "phone": "phone number",
//         "skills": ["skill1", "skill2", "skill3"],
//         "education": [
//           {
//             "degree": "Degree Name",
//             "institution": "Institution Name",
//             "year": "Year",
//             "gpa": "GPA if available"
//           }
//         ],
//         "experience": [
//           {
//             "title": "Job Title",
//             "company": "Company Name",
//             "duration": "Duration",
//             "description": "Job description"
//           }
//         ],
//         "summary": "Professional summary"
//       }

//       If any field is not available, use null or empty array/string.
//       Ensure the response is valid JSON only, no additional text.
//     `;

//     const result = await model.generateContent([
//       {
//         inlineData: {
//           data: fileData.toString("base64"),
//           mimeType: mimeType
//         }
//       },
//       prompt,
//     ]);

//     const responseText = result.response.text();
//     console.log("Gemini response:", responseText);

//     // Try to extract JSON from response
//     const jsonMatch = responseText.match(/\{[\s\S]*\}/);
//     if (jsonMatch) {
//       return JSON.parse(jsonMatch[0]);
//     } else {
//       return JSON.parse(responseText);
//     }
//   } catch (error) {
//     console.error("Error parsing resume with Gemini:", error);
//     console.log("Falling back to basic parsing...");
//     return await parseResumeFallback(filePath);
//   }
// };

// // Fallback resume parsing without AI
// const parseResumeFallback = async (filePath) => {
//   try {
//     const fileName = path.basename(filePath);
//     const fileStats = fs.statSync(filePath);

//     return {
//       name: "Resume Data",
//       email: "Not extracted",
//       phone: "Not extracted",
//       skills: ["Skills not extracted"],
//       education: [
//         {
//           degree: "Education details not extracted",
//           institution: "Institution not extracted",
//           year: "Year not extracted",
//           gpa: null
//         }
//       ],
//       experience: [
//         {
//           title: "Experience details not extracted",
//           company: "Company not extracted",
//           duration: "Duration not extracted",
//           description: "Description not extracted"
//         }
//       ],
//       summary: "Resume file uploaded but AI parsing not available. Please add GEMINI_API_KEY to .env file for full parsing.",
//       fileName: fileName,
//       fileSize: fileStats.size,
//       parsedAt: new Date().toISOString(),
//       note: "This is fallback parsing. For full AI-powered parsing, add GEMINI_API_KEY to your .env file"
//     };
//   } catch (error) {
//     console.error("Error in fallback parsing:", error);
//     return {
//       error: "Resume parsing failed",
//       fileName: path.basename(filePath),
//       message: "Unable to parse resume file. Please ensure it's a valid PDF, DOC, or DOCX file."
//     };
//   }
// };

// const fetchGitHubProfile = async (username) => {
//   try {
//     const res = await axios.get(`https://api.github.com/users/${username}`);
//     return await res.json();
//   } catch (error) {
//     console.error(" Error fetching GitHub profile:", error);
//     return { error: "GitHub profile fetch failed" };
//   }
// };

// const fetchGitHubRepos = async (username) => {
//   try {
//     const res = await axios.get(`https://api.github.com/users/${username}/repos`);
//     return await res.json();
//   } catch (error) {
//     console.error(" Error fetching repos:", error);
//     return { error: "GitHub repos fetch failed" };
//   }
// };

// const buildProfile = async (req, res) => {
//   try {
//     const { githubUsername, linkedinUsername, scrapingOptions } = req.body;
//     const resumeFile = req.file;

//     // Validate required fields
//     if (!githubUsername) {
//       return res.status(400).json({
//         success: false,
//         message: "GitHub username is required"
//       });
//     }

//     let resumeData = null;
//     let resumePath = null;

//     // 1. Parse resume if file provided
//     if (resumeFile) {
//       resumePath = path.join(process.cwd(), resumeFile.path);
//       resumeData = await parseResume(resumePath);
//     }

//     // 2. Scrape GitHub data
//     console.log(` Scraping GitHub profile for: ${githubUsername}`);
//     const githubProfile = await fetchGitHubProfile(githubUsername);
//     const githubRepos = await fetchGitHubRepos(githubUsername);

//     // 3. Scrape LinkedIn data (if provided)
//     let linkedinProfile = null;
//     if (linkedinUsername) {
//       console.log(` Scraping LinkedIn profile for: ${linkedinUsername}`);
//       linkedinProfile = await fetchLinkedInProfile(linkedinUsername);
//     }

//     // 4. Additional scraping based on options
//     let additionalData = {};
//     if (scrapingOptions) {
//       if (scrapingOptions.includeGitHubStats) {
//         additionalData.githubStats = await fetchGitHubStats(githubUsername);
//       }
//       if (scrapingOptions.includeGitHubLanguages) {
//         additionalData.githubLanguages = await fetchGitHubLanguages(githubUsername);
//       }
//     }

//     // Cleanup temp file if exists
//     if (resumePath && fs.existsSync(resumePath)) {
//       fs.unlinkSync(resumePath);
//     }

//     // 5. Return all scraped data
//     res.json({
//       success: true,
//       message: "Profile scraped and built successfully",
//       data: {
//         resumeData,
//         githubProfile,
//         githubRepos,
//         linkedinProfile,
//         additionalData,
//         scrapingMetadata: {
//           scrapedAt: new Date().toISOString(),
//           githubUsername,
//           linkedinUsername: linkedinUsername || null,
//           resumeProvided: !!resumeFile
//         }
//       },
//     });
//   } catch (error) {
//     console.error("Error building profile:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to build profile",
//       error: error.message
//     });
//   }
// };

// // Enhanced LinkedIn scraping function
// const fetchLinkedInProfile = async (username) => {
//   try {
//     // Extract username from URL if full URL provided
//     const cleanUsername = username.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, '').replace(/\/$/, '');

//     // Note: LinkedIn has strict anti-scraping measures
//     // This is a basic implementation - in production, use official LinkedIn API
//     return {
//       username: cleanUsername,
//       profileUrl: `https://www.linkedin.com/in/${cleanUsername}`,
//       message: "LinkedIn profile data requires official API integration",
//       note: "For production use, integrate with LinkedIn's official API",
//       scrapedAt: new Date().toISOString()
//     };
//   } catch (error) {
//     console.error("Error fetching LinkedIn profile:", error);
//     return { error: "LinkedIn profile fetch failed" };
//   }
// };

// // Additional GitHub scraping functions
// const fetchGitHubStats = async (username) => {
//   try {
//     console.log(` Fetching GitHub stats for: ${username}`);

//     // Fetch user's contribution data
//     const contributionsRes = await fetch(`https://api.github.com/users/${username}/events/public`);
//     const contributions = await contributionsRes.json();

//     // Calculate basic stats
//     const stats = {
//       totalEvents: contributions.length,
//       pushEvents: contributions.filter(e => e.type === 'PushEvent').length,
//       pullRequestEvents: contributions.filter(e => e.type === 'PullRequestEvent').length,
//       issuesEvents: contributions.filter(e => e.type === 'IssuesEvent').length,
//       lastActivity: contributions[0]?.created_at || null
//     };

//     return stats;
//   } catch (error) {
//     console.error("Error fetching GitHub stats:", error);
//     return { error: "GitHub stats fetch failed" };
//   }
// };

// const fetchGitHubLanguages = async (username) => {
//   try {
//     console.log(` Fetching GitHub languages for: ${username}`);

//     // Get user's repos
//     const reposRes = await fetch(`https://api.github.com/users/${username}/repos?per_page=100`);
//     const repos = await reposRes.json();

//     // Get languages for each repo
//     const languagePromises = repos.map(async (repo) => {
//       try {
//         const langRes = await fetch(`https://api.github.com/repos/${username}/${repo.name}/languages`);
//         return await langRes.json();
//       } catch (error) {
//         return {};
//       }
//     });

//     const languages = await Promise.all(languagePromises);

//     // Aggregate language usage
//     const languageStats = {};
//     languages.forEach(repoLangs => {
//       Object.entries(repoLangs).forEach(([lang, bytes]) => {
//         languageStats[lang] = (languageStats[lang] || 0) + bytes;
//       });
//     });

//     // Sort by usage
//     const sortedLanguages = Object.entries(languageStats)
//       .sort(([,a], [,b]) => b - a)
//       .slice(0, 10) // Top 10 languages
//       .map(([lang, bytes]) => ({ language: lang, bytes, percentage: 0 }));

//     // Calculate percentages
//     const totalBytes = sortedLanguages.reduce((sum, lang) => sum + lang.bytes, 0);
//     sortedLanguages.forEach(lang => {
//       lang.percentage = totalBytes > 0 ? ((lang.bytes / totalBytes) * 100).toFixed(2) : 0;
//     });

//     return {
//       totalRepos: repos.length,
//       languages: sortedLanguages,
//       totalBytes
//     };
//   } catch (error) {
//     console.error("Error fetching GitHub languages:", error);
//     return { error: "GitHub languages fetch failed" };
//   }
// };

// module.exports = {
//   parseResume,
//   parseResumeFallback,
//   fetchGitHubProfile,
//   fetchGitHubRepos,
//   fetchLinkedInProfile,
//   fetchGitHubStats,
//   fetchGitHubLanguages,
//   buildProfile,
// };

const fs = require("fs");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require("axios");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const parseResume = async (filePath) => {
  try {
    // Check if Gemini API key is available
    if (!process.env.GEMINI_API_KEY) {
      console.log(" GEMINI_API_KEY not found, using fallback parsing");
      return await parseResumeFallback(filePath);
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const fileData = fs.readFileSync(filePath);

    // Determine file type
    const fileExt = path.extname(filePath).toLowerCase();
    let mimeType = "application/pdf";
    if (fileExt === ".doc") mimeType = "application/msword";
    if (fileExt === ".docx")
      mimeType =
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    const prompt = `
      Extract structured data from this resume document.
      Return a valid JSON object with these exact fields:
      {
        "name": "Full Name",
        "email": "email@example.com",
        "phone": "phone number",
        "skills": ["skill1", "skill2", "skill3"],
        "education": [
          {
            "degree": "Degree Name",
            "institution": "Institution Name",
            "year": "Year",
            "gpa": "GPA if available"
          }
        ],
        "experience": [
          {
            "title": "Job Title",
            "company": "Company Name",
            "duration": "Duration",
            "description": "Job description"
          }
        ],
        "summary": "Professional summary"
      }
      
      If any field is not available, use null or empty array/string.
      Ensure the response is valid JSON only, no additional text.
    `;

    const result = await model.generateContent([
      {
        inlineData: {
          data: fileData.toString("base64"),
          mimeType: mimeType,
        },
      },
      prompt,
    ]);

    const responseText = result.response.text();
    console.log("Gemini response:", responseText);

    // Try to extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    } else {
      return JSON.parse(responseText);
    }
  } catch (error) {
    console.error("Error parsing resume with Gemini:", error);
    console.log("Falling back to basic parsing...");
    return await parseResumeFallback(filePath);
  }
};

// Fallback resume parsing without AI
const parseResumeFallback = async (filePath) => {
  try {
    const fileName = path.basename(filePath);
    const fileStats = fs.statSync(filePath);

    return {
      name: "Resume Data",
      email: "Not extracted",
      phone: "Not extracted",
      skills: ["Skills not extracted"],
      education: [
        {
          degree: "Education details not extracted",
          institution: "Institution not extracted",
          year: "Year not extracted",
          gpa: null,
        },
      ],
      experience: [
        {
          title: "Experience details not extracted",
          company: "Company not extracted",
          duration: "Duration not extracted",
          description: "Description not extracted",
        },
      ],
      summary:
        "Resume file uploaded but AI parsing not available. Please add GEMINI_API_KEY to .env file for full parsing.",
      fileName: fileName,
      fileSize: fileStats.size,
      parsedAt: new Date().toISOString(),
      note: "This is fallback parsing. For full AI-powered parsing, add GEMINI_API_KEY to your .env file",
    };
  } catch (error) {
    console.error("Error in fallback parsing:", error);
    return {
      error: "Resume parsing failed",
      fileName: path.basename(filePath),
      message:
        "Unable to parse resume file. Please ensure it's a valid PDF, DOC, or DOCX file.",
    };
  }
};

// GitHub functions with axios only
const fetchGitHubProfile = async (username) => {
  try {
    const res = await axios.get(`https://api.github.com/users/${username}`);
    return res.data;
  } catch (error) {
    console.error(" Error fetching GitHub profile:", error.message);
    return { error: "GitHub profile fetch failed" };
  }
};

const fetchGitHubRepos = async (username) => {
  try {
    const res = await axios.get(
      `https://api.github.com/users/${username}/repos?per_page=2&page=1`
    );
    return res.data;
  } catch (error) {
    console.error(" Error fetching repos:", error.message);
    return { error: "GitHub repos fetch failed" };
  }
};

const fetchGitHubStats = async (username) => {
  try {
    console.log(` Fetching GitHub stats for: ${username}`);
    const { data: contributions } = await axios.get(
      `https://api.github.com/users/${username}/events/public`
    );

    return {
      totalEvents: contributions.length,
      pushEvents: contributions.filter((e) => e.type === "PushEvent").length,
      pullRequestEvents: contributions.filter(
        (e) => e.type === "PullRequestEvent"
      ).length,
      issuesEvents: contributions.filter((e) => e.type === "IssuesEvent")
        .length,
      lastActivity: contributions[0]?.created_at || null,
    };
  } catch (error) {
    console.error("Error fetching GitHub stats:", error.message);
    return { error: "GitHub stats fetch failed" };
  }
};

const fetchGitHubLanguages = async (username) => {
  try {
    console.log(` Fetching GitHub languages for: ${username}`);
    const { data: repos } = await axios.get(
      `https://api.github.com/users/${username}/repos?per_page=100`
    );

    const languagePromises = repos.map(async (repo) => {
      try {
        const { data } = await axios.get(
          `https://api.github.com/repos/${username}/${repo.name}/languages`
        );
        return data;
      } catch {
        return {};
      }
    });

    const languages = await Promise.all(languagePromises);

    const languageStats = {};
    languages.forEach((repoLangs) => {
      Object.entries(repoLangs).forEach(([lang, bytes]) => {
        languageStats[lang] = (languageStats[lang] || 0) + bytes;
      });
    });

    const sortedLanguages = Object.entries(languageStats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([lang, bytes]) => ({ language: lang, bytes, percentage: 0 }));

    const totalBytes = sortedLanguages.reduce(
      (sum, lang) => sum + lang.bytes,
      0
    );
    sortedLanguages.forEach((lang) => {
      lang.percentage =
        totalBytes > 0 ? ((lang.bytes / totalBytes) * 100).toFixed(2) : 0;
    });

    return {
      totalRepos: repos.length,
      languages: sortedLanguages,
      totalBytes,
    };
  } catch (error) {
    console.error("Error fetching GitHub languages:", error.message);
    return { error: "GitHub languages fetch failed" };
  }
};

// LinkedIn scraping (stubbed)
const fetchLinkedInProfile = async (username) => {
  try {
    const cleanUsername = username
      .replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, "")
      .replace(/\/$/, "");

    return {
      username: cleanUsername,
      profileUrl: `https://www.linkedin.com/in/${cleanUsername}`,
      message: "LinkedIn profile data requires official API integration",
      note: "For production use, integrate with LinkedIn's official API",
      scrapedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error fetching LinkedIn profile:", error.message);
    return { error: "LinkedIn profile fetch failed" };
  }
};

// Main controller
const buildProfile = async (req, res) => {
  try {
    const { githubUsername, linkedinUsername, scrapingOptions } = req.body;
    const resumeFile = req.file;

    if (!githubUsername) {
      return res.status(400).json({
        success: false,
        message: "GitHub username is required",
      });
    }

    let resumeData = null;
    let resumePath = null;

    if (resumeFile) {
      resumePath = path.join(process.cwd(), resumeFile.path);
      resumeData = await parseResume(resumePath);
    }

    console.log(` Scraping GitHub profile for: ${githubUsername}`);
    const githubProfile = await fetchGitHubProfile(githubUsername);
    const githubRepos = await fetchGitHubRepos(githubUsername);

    let linkedinProfile = null;
    if (linkedinUsername) {
      console.log(` Scraping LinkedIn profile for: ${linkedinUsername}`);
      linkedinProfile = await fetchLinkedInProfile(linkedinUsername);
    }

    let additionalData = {};
    if (scrapingOptions) {
      if (scrapingOptions.includeGitHubStats) {
        additionalData.githubStats = await fetchGitHubStats(githubUsername);
      }
      if (scrapingOptions.includeGitHubLanguages) {
        additionalData.githubLanguages = await fetchGitHubLanguages(
          githubUsername
        );
      }
    }

    if (resumePath && fs.existsSync(resumePath)) {
      fs.unlinkSync(resumePath);
    }

    res.json({
      success: true,
      message: "Profile scraped and built successfully",
      data: {
        resumeData,
        githubProfile,
        githubRepos,
        linkedinProfile,
        additionalData,
        scrapingMetadata: {
          scrapedAt: new Date().toISOString(),
          githubUsername,
          linkedinUsername: linkedinUsername || null,
          resumeProvided: !!resumeFile,
        },
      },
    });
  } catch (error) {
    console.error("Error building profile:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to build profile",
      error: error.message,
    });
  }
};

module.exports = {
  parseResume,
  parseResumeFallback,
  fetchGitHubProfile,
  fetchGitHubRepos,
  fetchLinkedInProfile,
  fetchGitHubStats,
  fetchGitHubLanguages,
  buildProfile,
};
