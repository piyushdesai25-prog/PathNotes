# PathNotes

PathNotes is a frontend-first internship preparation and career planning web application for engineering students.

## Current version

- Separate pages: Dashboard, Skills, Career Paths, Roadmap, Internships, Resume Analyzer, Application Tracker, Profile and Settings.
- Responsive layout for desktop, tablet and mobile.
- Browser `localStorage` persistence.
- Multiple local user profiles: continue as an existing user, switch users, or start a new profile.
- Profile editing, project CRUD, skill management and application tracking.
- Internship shortlist: paste a listing URL from Internshala, Naukri, LinkedIn or a company site, store concise details, open the original listing, and track the application.
- External internship-source buttons instead of pretending to provide live/scraped listings.
- Internship → Tracker connection and internship → Roadmap focus connection.
- Four-week roadmap with practical tasks, deliverables and completion tracking.
- Resume analyzer accepts pasted text plus PDF, DOCX, TXT and Markdown files. PDF/DOCX extraction uses browser libraries loaded from CDN.
- JSON profile/application/roadmap/internship backup export.

## Important scope note

This is a college-project prototype. Internship listings shown in the curated section are illustrative demo examples, not a live job feed. The application does not scrape or claim real-time availability from external job portals.

## Run locally

Open the project folder in VS Code and use Live Server, or run a simple local server:

```text
python -m http.server 8000
```

Then open `http://localhost:8000/`.

For PDF/DOCX resume extraction, the browser needs internet access to load the PDF.js and Mammoth libraries from their CDNs. Text paste/TXT/Markdown analysis does not depend on those parsers.

## Data model

User profiles, applications, roadmap progress and saved internships are stored locally in the browser. The project has no backend/database in this prototype.
