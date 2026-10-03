# PathNotes

## Internship Preparation & Career Planning Platform for Engineering Students

PathNotes is a student-focused web application that connects a student's **career goal, skills, projects, resume, internship opportunities and applications** into one preparation workflow.

The purpose of PathNotes is not to replace LinkedIn, Internshala, Naukri or company career pages. Those platforms host the real internship listings. PathNotes acts as the preparation and organization layer around them.

---

## Core Idea

A student should be able to answer three questions from one place:

1. **Where am I right now?**
2. **What am I missing for the internship I want?**
3. **What should I do next?**

The product loop is:

```text
Career Goal
    ↓
Career Profile
    ↓
Skills + Projects + External Profiles
    ↓
Readiness
    ↓
Find a real internship externally
    ↓
Paste internship link into PathNotes
    ↓
Fill only missing details
    ↓
Internship Skill Match
    ↓
Skill Gap → Specific Task → Project Evidence → Resume → Application
    ↓
Application Tracker
    ↓
Next Action on Dashboard
```

---

## Main Features

### 1. Personalized onboarding

Students create a career profile containing:

- Name and academic information
- Branch / specialization
- Current year and graduation year
- Career interests
- Primary career goal
- Skills
- Self-rated preparation levels
- Weekly preparation time
- Target company types
- Internship / hackathon experience
- Certifications
- GitHub profile
- LinkedIn profile
- Portfolio / personal website
- LeetCode or coding profile
- Projects

The onboarding information becomes the foundation for the rest of PathNotes.

---

### 2. Career Dashboard

The Dashboard is the main home screen of PathNotes.

It is designed around the question:

> **What should I do next?**

It brings together:

- Readiness
- Target role
- Skill progress
- Project evidence
- Roadmap progress
- Saved internships
- Application activity
- Next actions

The Dashboard should not require the student to understand the whole application first. It provides the current state and points to the next useful action.

---

### 3. Skills & Evidence

Skills are not treated only as tags.

PathNotes considers:

- Skills entered by the student
- Project technologies
- Project descriptions
- Internship requirements
- Resume content

For example:

```text
Internship requires:
C++ · DSA · SQL · Git

Profile:
C++ · Git

Projects provide evidence for:
C++ · Git

Needs attention:
DSA · SQL
```

This allows the student to understand the difference between a skill they claim and a skill they can actually demonstrate through a project.

---

### 4. Project → Internship Connection

Projects are a central part of PathNotes.

Each project can contain:

- Project name
- Technology / skill stack
- Description
- GitHub / source-code URL
- Live / deployed URL
- Project evidence

Supported project links can point to places such as:

- GitHub
- Vercel
- Render
- GitHub Pages
- Other live/demo URLs

Projects are used when comparing the student's profile with an internship.

Example:

```text
Required skill: REST APIs

No direct skill evidence found.
        ↓
PathNotes identifies a gap.
        ↓
Roadmap task:
Build one small REST API integration.
        ↓
Add the work to a project.
        ↓
Use the project as evidence.
        ↓
Update the resume.
        ↓
Apply to the internship.
```

This is one of the key differences between PathNotes and a simple internship bookmark manager.

---

### 5. Internship Workflow

PathNotes does not create fake or curated internship listings.

Students find a real opportunity on an external platform and paste its URL into PathNotes.

The workflow is:

```text
Paste link
    ↓
PathNotes creates the internship record
    ↓
Source detected
    ↓
Student fills only missing details
    ↓
Save
    ↓
PathNotes tracks preparation + application
```

The record can contain:

- Internship URL
- Source
- Company
- Role
- Location
- Deadline
- Stipend
- Required skills
- Description
- Application status
- Preparation status

PathNotes does not pretend to scrape arbitrary LinkedIn, Internshala, Naukri or company pages in the frontend-only prototype. The original listing remains the source for applying.

---

### 6. Internship Skill Matching

Saved internships are compared against the student's profile and project evidence.

PathNotes can show:

- Profile + project match
- Skills already covered
- Skills needing attention
- Relevant project evidence
- Preparation actions

The intended progression is:

**Skill gap → specific task → evidence → resume → application**

---

### 7. Personalized Roadmap

The roadmap is connected to the student's current gaps and selected internship.

It can include tasks such as:

- DSA practice
- SQL practice
- Development tasks
- Project improvements
- Git / README improvements
- Resume updates
- Internship preparation
- Application actions

The roadmap can use a saved internship as its current focus, allowing preparation to be targeted instead of generic.

---

### 8. Resume Workspace

PathNotes supports resume input through:

- PDF
- DOCX / Word
- TXT
- Markdown
- Pasted text

Resume text is extracted locally in the browser where supported and can be analyzed against the student's target role.

The analyzer checks:

- Role keywords
- Missing recommended skills
- Contact/profile links
- Education
- Technical skills
- Projects
- Experience / certifications

The latest resume text can be stored with the student's PathNotes profile so the student does not have to start from zero every time.

PathNotes also includes a basic **Build from my PathNotes profile** workflow that creates a resume draft from the student's stored information, projects, skills and profile links. The student should review and format the generated draft before using it professionally.

---

### 9. Application Tracker

The tracker is designed as an application cockpit rather than another dashboard.

Applications can move through stages such as:

```text
Wishlist
   ↓
Applied
   ↓
Online Assessment
   ↓
Interview
   ↓
Offer / Result
```

The tracker provides:

- Total applications
- Saved / wishlist applications
- Applied applications
- OA / interview activity
- Offers
- Status updates
- Application dates
- Notes
- Original listing links where available

The goal is to make the next action obvious.

---

### 10. Career Profile

The Career Profile acts as the source of truth for the application.

It contains:

- Academic profile
- Career interests
- Skills
- Projects
- Certifications
- Experience
- External profiles
- Resume information

Information entered here can be reused across skill analysis, internship matching, roadmap generation and resume preparation.

---

### 11. External Internship Discovery

PathNotes intentionally links students to external platforms rather than pretending to own their listings.

Students can explore real opportunities through:

- Internshala
- Naukri
- LinkedIn
- Company career pages

The intended workflow is:

**Find externally → bring the link into PathNotes → prepare → apply → track.**

---

### 12. Multi-user support

PathNotes supports multiple local student profiles.

Users can:

- Continue as an existing user
- Create a new user
- Log out
- Switch users
- Keep profile/application/roadmap/internship data separated locally

---

## Technology Stack

### Frontend

- HTML5
- CSS3
- JavaScript
- Responsive layout

### Browser storage

- `localStorage`

### Resume processing

- PDF.js for PDF text extraction
- Mammoth for DOCX text extraction
- Browser `FileReader` APIs for local file handling

### Development tools

- Visual Studio Code
- Git
- GitHub
- Any modern web browser

---

## Data Model

The current prototype keeps user information locally in the browser.

A user profile can contain:

```text
User
├── Personal information
├── Career interests
├── Primary goal
├── Skills
├── Preparation levels
├── Experience
│   ├── Certifications
│   ├── GitHub
│   ├── LinkedIn
│   ├── Portfolio
│   ├── LeetCode
│   └── Projects
├── Resume
├── Active internship
└── Career/application state
    ├── Saved internships
    ├── Roadmap progress
    └── Applications
```

---

## Project Structure

```text
PathNotes-main/
│
├── index.html              # Landing / entry page
├── onboarding.html         # Career profile onboarding
├── onboarding.css
├── onboarding.js
│
├── dashboard.html          # Main home screen
├── skills.html             # Skills and evidence
├── career-paths.html       # Target career roles
├── roadmap.html             # Preparation roadmap
├── internships.html        # Internship saving and preparation
├── resume.html             # Resume storage, builder and analyzer
├── tracker.html            # Application cockpit
├── profile.html            # Career profile and projects
├── settings.html           # Account/settings
│
├── dashboard.css           # Shared application styling
├── dashboard.js            # Main application logic
├── account.js              # Local multi-user account/session handling
└── README.md
```

---

## How to Run

### Option 1 — VS Code Live Server

1. Open the `PathNotes-main` folder in VS Code.
2. Open `index.html`.
3. Use **Live Server → Open with Live Server**.
4. Start with the PathNotes landing page.

### Option 2 — Local HTTP server

If Python is installed:

```bash
python -m http.server 5500
```

Then open:

```text
http://localhost:5500
```

A local HTTP server is preferable to opening the HTML files directly because browser file restrictions can affect some frontend functionality.

---

## Important Prototype Notes

### No fake internship data

PathNotes does not intentionally present fabricated internship opportunities as live listings.

The internship workflow uses real external listing links supplied by the student.

### No arbitrary web scraping in the current version

A pasted LinkedIn, Internshala, Naukri or company URL is stored as a PathNotes record. Automatic extraction from arbitrary external websites is not guaranteed in this frontend-only version because of browser CORS restrictions and changing website structures.

A future backend/proxy service could provide controlled metadata extraction if required.

### Local data only

The current prototype uses browser `localStorage` rather than a remote database.

Clearing browser site data can remove locally stored PathNotes information.

For a production deployment, the application should move to a secure backend/database and authenticated user accounts.

---

## Future Scope

Possible future improvements include:

- Secure cloud accounts and database storage
- Backend-based internship metadata extraction where legally and technically appropriate
- More detailed internship requirement parsing
- Better project-to-skill evidence mapping
- ATS-style resume analysis
- Resume PDF generation
- Calendar/deadline integration
- Application reminders
- Analytics across applications
- More advanced personalized recommendations
- Authentication and cloud synchronization

These are future possibilities; the current prototype focuses on connecting the student's profile, projects, internships, preparation and applications into one usable workflow.

---

## Product Positioning

PathNotes is **not another internship listing website**.

Its purpose is to sit between internship discovery and application preparation:

> **Find the opportunity anywhere. Bring it into PathNotes. Understand what you are missing. Prepare with a plan. Use your projects as evidence. Strengthen your resume. Apply. Track what happens next.**

---

## Academic Project

PathNotes is a student-developed academic project prototype created to explore how a career-planning web application can help engineering students organize internship preparation and application workflows.

The application is intended for educational and demonstration purposes in its current prototype form.
