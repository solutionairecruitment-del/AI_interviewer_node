# Profile Scraping API Documentation

## Overview
The `/api/profile/build` endpoint provides comprehensive profile scraping capabilities, combining resume parsing, GitHub data extraction, LinkedIn profile processing, and additional analytics.

## Endpoint
```
POST /api/profile/build
```

## Authentication
- **Required**: Bearer Token
- **Header**: `Authorization: Bearer <your_jwt_token>`

## Request Format
- **Content-Type**: `multipart/form-data`
- **Method**: POST

## Request Parameters

### Required Parameters
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `githubUsername` | String | GitHub username to scrape | `"octocat"` |

### Optional Parameters
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `resume` | File | Resume file (PDF, DOC, DOCX) | `resume.pdf` |
| `linkedinUsername` | String | LinkedIn username or URL | `"john-doe"` or `"https://linkedin.com/in/john-doe"` |
| `scrapingOptions` | JSON String | Additional scraping options | `{"includeGitHubStats": true, "includeGitHubLanguages": true}` |

### Scraping Options
```json
{
  "includeGitHubStats": true,      // Include GitHub activity statistics
  "includeGitHubLanguages": true   // Include programming language analysis
}
```

## Response Format

### Success Response (200)
```json
{
  "success": true,
  "message": "Profile scraped and built successfully",
  "data": {
    "resumeData": {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "skills": ["JavaScript", "React", "Node.js"],
      "education": [...],
      "experience": [...]
    },
    "githubProfile": {
      "login": "octocat",
      "id": 583231,
      "name": "The Octocat",
      "email": "octocat@github.com",
      "bio": "GitHub's mascot",
      "public_repos": 8,
      "followers": 20,
      "following": 0,
      "created_at": "2011-01-25T18:44:36Z",
      "updated_at": "2023-11-15T07:20:07Z"
    },
    "githubRepos": [
      {
        "id": 1296269,
        "name": "Hello-World",
        "full_name": "octocat/Hello-World",
        "description": "This your first repo!",
        "language": "JavaScript",
        "stargazers_count": 80,
        "forks_count": 9,
        "created_at": "2011-01-26T19:01:12Z",
        "updated_at": "2023-11-15T07:20:07Z"
      }
    ],
    "linkedinProfile": {
      "username": "john-doe",
      "profileUrl": "https://www.linkedin.com/in/john-doe",
      "message": "LinkedIn profile data requires official API integration",
      "note": "For production use, integrate with LinkedIn's official API",
      "scrapedAt": "2024-01-15T10:30:00.000Z"
    },
    "additionalData": {
      "githubStats": {
        "totalEvents": 150,
        "pushEvents": 120,
        "pullRequestEvents": 25,
        "issuesEvents": 5,
        "lastActivity": "2024-01-15T09:45:00Z"
      },
      "githubLanguages": {
        "totalRepos": 25,
        "languages": [
          {
            "language": "JavaScript",
            "bytes": 150000,
            "percentage": "45.5"
          },
          {
            "language": "Python",
            "bytes": 80000,
            "percentage": "24.2"
          }
        ],
        "totalBytes": 330000
      }
    },
    "scrapingMetadata": {
      "scrapedAt": "2024-01-15T10:30:00.000Z",
      "githubUsername": "octocat",
      "linkedinUsername": "john-doe",
      "resumeProvided": true
    }
  }
}
```

### Error Responses

#### 400 Bad Request
```json
{
  "success": false,
  "message": "GitHub username is required"
}
```

#### 401 Unauthorized
```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Failed to build profile",
  "error": "Detailed error message"
}
```

## Features

### 1. Resume Parsing
- **Supported Formats**: PDF, DOC, DOCX
- **Extracted Data**: Name, email, phone, skills, education, experience
- **Technology**: Google Gemini AI for intelligent parsing

### 2. GitHub Scraping
- **Profile Data**: Basic profile information, stats, followers
- **Repositories**: All public repositories with details
- **Activity Stats**: Push events, pull requests, issues
- **Language Analysis**: Programming language usage statistics

### 3. LinkedIn Processing
- **URL Cleaning**: Handles both usernames and full URLs
- **Note**: Requires official API for production use

### 4. Additional Analytics
- **GitHub Statistics**: Activity patterns, contribution data
- **Language Breakdown**: Top programming languages with percentages
- **Repository Analysis**: Repository count, language distribution

## Usage Examples

### Basic GitHub Scraping
```bash
curl -X POST http://localhost:3000/api/profile/build \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "githubUsername=octocat"
```

### Complete Profile Scraping
```bash
curl -X POST http://localhost:3000/api/profile/build \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "githubUsername=octocat" \
  -F "linkedinUsername=john-doe" \
  -F "resume=@resume.pdf" \
  -F 'scrapingOptions={"includeGitHubStats":true,"includeGitHubLanguages":true}'
```

### JavaScript/Node.js Example
```javascript
const FormData = require('form-data');
const fs = require('fs');

const formData = new FormData();
formData.append('githubUsername', 'octocat');
formData.append('linkedinUsername', 'john-doe');
formData.append('resume', fs.createReadStream('resume.pdf'));
formData.append('scrapingOptions', JSON.stringify({
  includeGitHubStats: true,
  includeGitHubLanguages: true
}));

const response = await fetch('http://localhost:3000/api/profile/build', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    ...formData.getHeaders()
  },
  body: formData
});

const result = await response.json();
console.log(result);
```

## Rate Limits
- **GitHub API**: 60 requests per hour (unauthenticated)
- **File Upload**: 10MB maximum file size
- **Processing Time**: 5-30 seconds depending on data volume

## Error Handling
- **Network Errors**: Automatic retry with exponential backoff
- **API Limits**: Graceful degradation when rate limits are hit
- **File Processing**: Validation and error reporting for unsupported formats
- **Data Validation**: Comprehensive input validation and sanitization

## Testing
Run the test suite:
```bash
npm run test:profile
```

## Notes
- **LinkedIn**: Currently returns placeholder data. Production use requires official LinkedIn API integration
- **GitHub**: Uses public GitHub API. Consider using authenticated requests for higher rate limits
- **Resume Parsing**: Requires Google Gemini API key in environment variables
- **File Cleanup**: Temporary files are automatically cleaned up after processing
