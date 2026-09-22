<div align="center">

# 🧭 PathNotes

### *Stop guessing. Start knowing.*

An AI-driven, explainable skill-gap and roadmap platform for engineering students.

![Status](https://img.shields.io/badge/status-prototype-6366f1?style=flat-square)
![Stack](https://img.shields.io/badge/stack-HTML%20%7C%20CSS%20%7C%20Vanilla%20JS-orange?style=flat-square)
![Backend](https://img.shields.io/badge/backend-none%20(localStorage)-lightgrey?style=flat-square)
![Made for](https://img.shields.io/badge/made%20for-college%20project-brightgreen?style=flat-square)

</div>

---

PathNotes turns one student profile into a **skill-gap analysis**, a **transparent readiness score**, and a **week-by-week roadmap** — inspired by the product concept of CareerCompass.tech, built from scratch with its own branding, design, and code.

## 🧩 How it works

| Step | What happens |
|:---:|---|
| **1. Tell us about you** | A 6-step onboarding form: academic info, career interests, skills, experience & projects, self-rated preparation, target companies. |
| **2. See where you stand** | Skills matched against 12 career roles (format-insensitive — "JS" = "JavaScript"), producing a readiness score and a gap analysis. |
| **3. Follow your roadmap** | A generated 4-week plan of tasks, a mini-project, and resource links — scoped to *your* missing skills, with progress saved as you go. |

## ✨ Key features

- 🎯 **Skill Gap Analysis** — matched vs. missing skills against any role, plus a coverage %
- 📊 **Career Readiness Score** — a visible, weighted formula — never a random number
- 🗺️ **Personalized Roadmap** — 4 weeks, generated from your actual gaps, with checkboxes
- 💼 **Internship Matching** — a clearly-labeled demo dataset, filterable against your skills
- 📄 **Resume Analyzer** — paste or upload `.txt` text → detected skills, missing keywords, section feedback
- 📌 **Application Tracker** — Applied → OA → Interview → Selected / Rejected, saved locally

## 📈 Scale, as actually built

<div align="center">

| 12 | 39 | 29 | 10 | 4 |
|:---:|:---:|:---:|:---:|:---:|
| Career roles | Skills tracked | Learning resources | Demo internships | Week roadmap |

</div>

## 🎓 Who it's for

Built with Indian engineering students in mind — CSE, ECE, EEE, Mechanical, Civil, AI & ML, Data Science, IoT, Cybersecurity, Robotics, and Information Science are all onboarding options.

## 🔐 Access

No login, no signup. Everything — profile, roadmap progress, applications — lives in your browser's `localStorage`. Nothing syncs across devices, but nothing needs an account either.

## 📝 Notes

> This is a college mini-project: no backend, no live data feeds, no real ATS. Internship data and resume scoring are explicitly labeled as demo/prototype right in the UI.

For file structure, the exact readiness-score formula, and the `localStorage` schema, see the project's technical `README.md`.
