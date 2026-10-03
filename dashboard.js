(function () {
  "use strict";

  /* ---------------- storage & session state ---------------- */
  var accounts = window.PathNotesAccounts;
  var users = accounts ? accounts.listUsers() : [];
  var session = accounts ? accounts.getSession() : null;

  // Backward compatibility: older PathNotes sessions did not have userId.
  if (accounts && session && session.loggedIn && !session.userId && users.length === 1) {
    accounts.login(users[0].id);
    session = accounts.getSession();
  }

  var activeUser = accounts ? accounts.getCurrentUser() : null;
  var rawData = null;
  if (activeUser) {
    rawData = JSON.stringify(activeUser.profile || {});
  } else {
    try { rawData = localStorage.getItem("pathnotes_onboarding"); } catch (e) { rawData = null; }
  }

  var emptyState = document.getElementById("emptyState");
  var loggedOutState = document.getElementById("loggedOutState");
  var content = document.getElementById("dashboardContent");

  if (!rawData) {
    if (emptyState) emptyState.style.display = "block";
    if (loggedOutState) loggedOutState.style.display = "none";
    if (content) content.style.display = "none";
    return;
  }

  var data;
  try {
    data = JSON.parse(rawData);
  } catch (e) {
    if (emptyState) emptyState.style.display = "block";
    if (loggedOutState) loggedOutState.style.display = "none";
    if (content) content.style.display = "none";
    return;
  }

  if (!session || !session.loggedIn || !activeUser) {
    if (emptyState) emptyState.style.display = "none";
    if (loggedOutState) {
      loggedOutState.style.display = "block";
      var nameEl = document.getElementById("loggedOutName");
      var loggedOutProfile = users.length ? users[0].profile : data;
      if (nameEl && loggedOutProfile && loggedOutProfile.personal && loggedOutProfile.personal.fullName) {
        nameEl.textContent = loggedOutProfile.personal.fullName.split(" ")[0];
      }
    }
    if (content) content.style.display = "none";

    var loginBackBtn = document.getElementById("loginBackBtn");
    if (loginBackBtn) {
      loginBackBtn.onclick = function () {
        if (accounts && users.length) accounts.login(users[0].id);
        window.location.reload();
      };
    }
    return;
  }

  if (emptyState) emptyState.style.display = "none";
  if (loggedOutState) loggedOutState.style.display = "none";
  if (content) content.style.display = "block";

  /* ---------------- mobile nav toggle ---------------- */
  var sidebar = document.getElementById("sidebar");
  var navToggle = document.getElementById("navToggle");
  if (navToggle && sidebar) {
    navToggle.addEventListener("click", function () {
      sidebar.classList.toggle("open");
    });
  }

  // Multi-page navigation: each sidebar tab is now its own HTML page.
  var currentPage = document.body.dataset.page || "dashboard";
  var pageMeta = {
    dashboard: { title: "Welcome back", showStats: true },
    skills: { title: "My Skills", showStats: false },
    paths: { title: "Career Paths", showStats: false },
    roadmap: { title: "Learning Roadmap", showStats: false },
    internships: { title: "Internships", showStats: false },
    resume: { title: "Resume Analyzer", showStats: false },
    tracker: { title: "Application Tracker", showStats: false },
    profile: { title: "Profile & Projects", showStats: false },
    settings: { title: "Settings & Account", showStats: false }
  };

  var navLinks = document.querySelectorAll("#sidebarNav a");
  navLinks.forEach(function (link) {
    var href = link.getAttribute("href") || "";
    var pageName = href.replace(".html", "");
    if ((currentPage === "dashboard" && pageName === "dashboard") || currentPage === pageName.replace("career-paths", "paths")) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
    link.addEventListener("click", function () {
      navLinks.forEach(function (l) { l.classList.remove("active"); });
      link.classList.add("active");
      if (sidebar && window.innerWidth <= 900) {
        sidebar.classList.remove("open");
      }
    });
  });

  var pageInfo = pageMeta[currentPage] || pageMeta.dashboard;
  var statsRibbon = document.getElementById("statsRibbon");
  if (statsRibbon) statsRibbon.style.display = pageInfo.showStats ? "grid" : "none";
  var pageTitleOverride = document.getElementById("welcomeHeading");
  if (pageTitleOverride && currentPage !== "dashboard") pageTitleOverride.textContent = pageInfo.title;
  var pageMetaRow = document.getElementById("metaRow");
  if (pageMetaRow && currentPage !== "dashboard") pageMetaRow.style.display = "none";

  // Navigation state is handled above; each destination is a separate page.

  /* ---------------- data normalization ---------------- */
  function getPersonal() { return data.personal || {}; }
  function getSkills() { return data.skills || []; }
  function getInterests() { return data.careerInterests || []; }
  function getGoal() { return data.primaryGoal || "Exploring career options"; }
  function getLevels() { return data.preparationLevels || {}; }
  function getProjects() { return (data.experience && data.experience.projects) || []; }

  function norm(s) { return String(s || "").trim().toLowerCase(); }
  function userHas(skillName) {
    var userSkillsNorm = getSkills().map(norm);
    return userSkillsNorm.indexOf(norm(skillName)) !== -1;
  }

  /* ---------------- role library ---------------- */
  var roles = [
    { name: "Full Stack Developer", interest: "Web Development", required: ["HTML","CSS","JavaScript","React","Node.js","Git","REST APIs","SQL"] },
    { name: "Software Development Engineer", interest: "Software Development", required: ["Java","C++","Python","DSA","OOP","Git","Problem solving","REST APIs"] },
    { name: "Data Analyst", interest: "Data Science", required: ["Python","SQL","Excel","Statistics","Data Visualization","MongoDB"] },
    { name: "Data Scientist", interest: "Artificial Intelligence / Machine Learning", required: ["Python","Machine Learning","Statistics","SQL","Pandas","NumPy"] },
    { name: "Cybersecurity Analyst", interest: "Cybersecurity", required: ["Linux","Networking","Python","Cryptography basics","Git"] },
    { name: "Cloud / DevOps Engineer", interest: "Cloud Computing", required: ["AWS","Docker","Linux","Git","CI/CD basics","Networking"] },
    { name: "Mobile App Developer", interest: "Mobile App Development", required: ["Java","Kotlin","REST APIs","Git","UI basics"] },
    { name: "UI/UX Designer", interest: "UI/UX Design", required: ["Figma","Wireframing","User research","HTML","CSS"] }
  ];

  var activeRoleName = data.primaryTargetRole || null;

  /* ---------------- curated internships database ---------------- */
  var internshipDatabase = [
    {
      id: "intern-1",
      title: "Software Engineer Intern",
      company: "Razorpay",
      location: "Bengaluru (Hybrid)",
      workMode: "Hybrid",
      stipend: "₹35,000 / month",
      duration: "6 Months",
      interestCategory: "Software Development",
      requiredSkills: ["Python", "Java", "DSA", "REST APIs", "Git", "SQL"],
      description: "Work with the core payment gateway team building high-scale microservices, merchant dashboard APIs, and reliable SQL transactions."
    },
    {
      id: "intern-2",
      title: "Frontend Engineering Intern",
      company: "Swiggy",
      location: "Bengaluru / Remote",
      workMode: "Remote",
      stipend: "₹30,000 / month",
      duration: "3-6 Months",
      interestCategory: "Web Development",
      requiredSkills: ["HTML", "CSS", "JavaScript", "React", "Git", "REST APIs"],
      description: "Develop responsive, accessible, and performant user interfaces for millions of daily active users ordering food and groceries."
    },
    {
      id: "intern-3",
      title: "Data Analytics Intern",
      company: "Zerodha",
      location: "Bengaluru (On-site)",
      workMode: "On-site",
      stipend: "₹25,000 / month",
      duration: "6 Months",
      interestCategory: "Data Science",
      requiredSkills: ["Python", "SQL", "Excel", "Statistics", "Data Visualization"],
      description: "Analyze user trading behavior, market volume patterns, and prepare daily automated business intelligence dashboards."
    },
    {
      id: "intern-4",
      title: "Cloud & DevOps Intern",
      company: "Freshworks",
      location: "Chennai / Remote",
      workMode: "Remote",
      stipend: "₹28,000 / month",
      duration: "6 Months",
      interestCategory: "Cloud Computing",
      requiredSkills: ["AWS", "Docker", "Linux", "Git", "Networking"],
      description: "Assist cloud operations engineers in configuring Docker containers, writing CI/CD automation scripts, and monitoring AWS cloud instances."
    },
    {
      id: "intern-5",
      title: "Machine Learning Intern",
      company: "Krutrim AI",
      location: "Bengaluru (Hybrid)",
      workMode: "Hybrid",
      stipend: "₹32,000 / month",
      duration: "4 Months",
      interestCategory: "Artificial Intelligence / Machine Learning",
      requiredSkills: ["Python", "Machine Learning", "Pandas", "NumPy", "SQL"],
      description: "Preprocess datasets, run feature engineering pipelines, and evaluate natural language benchmarks for multilingual LLM applications."
    },
    {
      id: "intern-6",
      title: "Full Stack Web Developer Intern",
      company: "Zoho",
      location: "Tenkasi / Chennai",
      workMode: "On-site",
      stipend: "₹22,000 / month",
      duration: "6 Months",
      interestCategory: "Web Development",
      requiredSkills: ["HTML", "CSS", "JavaScript", "Node.js", "MySQL", "REST APIs"],
      description: "Collaborate on internal enterprise SaaS tools, building backend endpoints in Node.js and fast web interfaces with modular JavaScript."
    }
  ];

  /* ---------------- applications state ---------------- */
  var applications = [];
  if (activeUser && Array.isArray(activeUser.applications)) {
    applications = activeUser.applications.slice();
  } else {
    try { applications = JSON.parse(localStorage.getItem("pathnotes_applications")) || []; } catch (e) { applications = []; }
  }

  var savedInternships = activeUser && Array.isArray(activeUser.savedInternships)
    ? activeUser.savedInternships.slice() : [];

  /* ---------------- roadmap completion state ---------------- */
  var completedWeeks = [];
  if (activeUser && Array.isArray(activeUser.roadmapProgress)) {
    completedWeeks = activeUser.roadmapProgress.slice();
  } else {
    try { completedWeeks = JSON.parse(localStorage.getItem("pathnotes_roadmap_progress")) || []; } catch (e) { completedWeeks = []; }
  }

  /* ---------------- toast utility ---------------- */
  var toastContainer = document.getElementById("toastContainer");
  function showToast(msg) {
    if (!toastContainer) return;
    var t = document.createElement("div");
    t.className = "toast";
    t.innerHTML = '<span>•</span> ' + escapeHtml(msg);
    toastContainer.appendChild(t);
    setTimeout(function () {
      t.style.opacity = "0";
      t.style.transition = "opacity .3s ease";
      setTimeout(function () {
        if (t.parentNode === toastContainer) toastContainer.removeChild(t);
      }, 300);
    }, 3200);
  }

  /* ---------------- modal utility ---------------- */
  var modalContainer = document.getElementById("modalContainer");
  function openModal(contentHtml) {
    if (!modalContainer) return;
    modalContainer.innerHTML =
      '<div class="modal-overlay" id="modalOverlay">' +
        '<div class="modal-card">' + contentHtml + '</div>' +
      '</div>';
    modalContainer.style.display = "block";

    var overlay = document.getElementById("modalOverlay");
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closeModal();
    });
  }
  function closeModal() {
    if (modalContainer) {
      modalContainer.innerHTML = "";
      modalContainer.style.display = "none";
    }
  }

  /* ---------------- main render cycle ---------------- */
  function renderAll() {
    var personal = getPersonal();
    var skills = getSkills();
    var interests = getInterests();
    var goal = getGoal();
    var levels = getLevels();
    var projects = getProjects();

    /* 1. Header & Meta */
    var firstName = (personal.fullName || "there").split(" ")[0];
    document.getElementById("welcomeHeading").textContent = "Welcome back, " + firstName;
    document.getElementById("profileChipName").textContent = personal.fullName || "Your profile";
    document.getElementById("avatarInitial").textContent = (personal.fullName || "?").trim().charAt(0).toUpperCase() || "?";

    var metaRow = document.getElementById("metaRow");
    var metaPills = [];
    if (personal.branch) metaPills.push(personal.branch);
    if (personal.yearSem) metaPills.push(personal.yearSem);
    if (goal) metaPills.push("Goal: " + goal);
    metaRow.innerHTML = metaPills.map(function (m) { return '<span class="meta-pill">' + escapeHtml(m) + "</span>"; }).join("");

    /* 2. Role matching & Active Primary Role */
    function matchPct(role) {
      var have = role.required.filter(function (r) { return userHas(r); }).length;
      return role.required.length ? Math.round((have / role.required.length) * 100) : 0;
    }
    roles.forEach(function (r) {
      r.score = matchPct(r);
      r.interestMatch = interests.indexOf(r.interest) !== -1;
    });

    roles.sort(function (a, b) {
      if (a.interestMatch !== b.interestMatch) return a.interestMatch ? -1 : 1;
      return b.score - a.score;
    });

    var topRoles = roles.slice(0, 4);
    var primaryRole = null;
    if (activeRoleName) {
      for (var i = 0; i < roles.length; i++) {
        if (roles[i].name === activeRoleName) { primaryRole = roles[i]; break; }
      }
    }
    if (!primaryRole) {
      primaryRole = topRoles[0] || roles[0];
      activeRoleName = primaryRole.name;
    }

    /* 3. Readiness score calculation */
    var levelValues = { "Beginner": 33, "Intermediate": 66, "Advanced": 100 };
    var levelKeys = ["dsa", "dev", "cs", "comm", "apt"];
    var levelScores = levelKeys.map(function (k) { return levelValues[levels[k]] || 0; });
    var levelAvg = levelScores.length ? levelScores.reduce(function (a, b) { return a + b; }, 0) / levelScores.length : 0;
    var projectFactor = Math.min(projects.length / 3, 1) * 100;

    var overallReadiness = Math.round((primaryRole ? primaryRole.score : 0) * 0.4 + levelAvg * 0.35 + projectFactor * 0.25);
    overallReadiness = Math.max(0, Math.min(100, overallReadiness));

    /* 4. Quick stats ribbon */
    document.getElementById("statReadiness").textContent = overallReadiness + "%";
    document.getElementById("statTargetRole").textContent = primaryRole.name;
    document.getElementById("statSkillsCount").textContent = skills.length;
    document.getElementById("statTrackerCount").textContent = applications.length;

    /* 5. Readiness circular gauge */
    document.getElementById("readinessPct").textContent = overallReadiness + "%";
    var radius = 82, circumference = 2 * Math.PI * radius;
    var ringFill = document.getElementById("ringFill");
    ringFill.style.strokeDasharray = circumference;
    ringFill.style.strokeDashoffset = circumference * (1 - overallReadiness / 100);

    document.getElementById("readinessBlurb").innerHTML =
      "Built from your <b>" + primaryRole.score + "% match</b> with <b>" + escapeHtml(primaryRole.name) + "</b>, " +
      "self-rated skills avg (" + Math.round(levelAvg) + "%), and " + projects.length + " project" + (projects.length === 1 ? "" : "s") + " listed." +
      '<div style="font-size:12px; color:var(--ink-soft); margin-top:6px;">Formula: Role match (40%) + Skill levels (35%) + Projects (25%)</div>';

    var badgesEl = document.getElementById("readinessBadges");
    var badgeText = [];
    if (primaryRole.name) badgeText.push("Target: " + primaryRole.name);
    if (data.hoursPerWeek) badgeText.push(data.hoursPerWeek + "/week");
    if (goal) badgeText.push(goal);
    badgesEl.innerHTML = badgeText.map(function (b) { return '<span class="badge">' + escapeHtml(b) + '</span>'; }).join("");

    /* 6. Career paths list */
    var pathList = document.getElementById("pathList");
    pathList.innerHTML = topRoles.map(function (role, i) {
      var isCurrent = role.name === primaryRole.name;
      var why = role.interestMatch ? "Matches your interest in " + role.interest : "Closest match to your current skills";
      return (
        '<div class="path-row' + (isCurrent ? ' active-role' : '') + '" style="' + (isCurrent ? 'border-left:4px solid var(--marker);' : '') + '">' +
          '<div class="path-rank">' + (i + 1) + '</div>' +
          '<div class="path-info">' +
            '<div class="name">' + escapeHtml(role.name) + (isCurrent ? ' <span class="match-badge" style="margin-left:8px;">Primary Target</span>' : '') + '</div>' +
            '<div class="why">' + escapeHtml(why) + '</div>' +
          '</div>' +
          '<div class="path-score">' +
            '<div class="pct-label">' + role.score + '% Match</div>' +
            '<div class="mini-bar"><div class="fill" style="width:' + role.score + '%;"></div></div>' +
          '</div>' +
          '<div>' +
            (!isCurrent ? '<button class="btn btn-ghost btn-sm set-target-btn" data-role="' + escapeAttr(role.name) + '" style="font-size:12px; padding:4px 10px;">Select Target</button>' : '') +
          '</div>' +
        '</div>'
      );
    }).join("");

    pathList.querySelectorAll(".set-target-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        activeRoleName = btn.dataset.role;
        data.primaryTargetRole = activeRoleName;
        saveData();
        showToast("Primary target set to " + activeRoleName);
        renderAll();
      });
    });

    /* 7. Skills have & gaps */
    var haveSkillsEl = document.getElementById("haveSkills");
    var gapSkillsEl = document.getElementById("gapSkills");

    haveSkillsEl.innerHTML = skills.length
      ? skills.map(function (s) {
          return '<span class="tag have">' + escapeHtml(s) + ' <span class="tag-remove" data-skill="' + escapeAttr(s) + '" title="Remove skill">&times;</span></span>';
        }).join("")
      : '<span class="empty-note">No skills added yet. Use the box below to add one.</span>';

    haveSkillsEl.querySelectorAll(".tag-remove").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var skillToRemove = btn.dataset.skill;
        if (confirm("Remove '" + skillToRemove + "' from your skills list?")) {
          data.skills = data.skills.filter(function (s) { return s !== skillToRemove; });
          saveData();
          showToast("Removed " + skillToRemove);
          renderAll();
        }
      });
    });

    var gaps = primaryRole ? primaryRole.required.filter(function (r) { return !userHas(r); }) : [];
    gapSkillsEl.innerHTML = gaps.length
      ? gaps.map(function (s) { return '<span class="tag gap">' + escapeHtml(s) + '</span>'; }).join("")
      : '<span class="empty-note">You cover every skill ' + escapeHtml(primaryRole.name) + ' needs — outstanding!</span>';

    /* 8. 4-week Roadmap */
    var roadmapList = document.getElementById("roadmapList");
    var roadmapItems = buildRoadmap(gaps, levels, projects, interests);
    document.getElementById("roadmapProgressFill").style.width = ((completedWeeks.length / 4) * 100) + "%";
    document.getElementById("roadmapProgressText").textContent = completedWeeks.length + " of 4 milestones completed (" + Math.round((completedWeeks.length / 4) * 100) + "%)";
    var roadmapFocusEl = document.getElementById("roadmapFocus");
    if (roadmapFocusEl) {
      var focusInternship = data.activeInternshipId ? savedInternships.find(function (x) { return x.id === data.activeInternshipId; }) : null;
      if (focusInternship) {
        roadmapFocusEl.style.display = "flex";
        roadmapFocusEl.innerHTML = '<span>🎯</span><span>Current focus:</span><b>' + escapeHtml(focusInternship.role) + ' at ' + escapeHtml(focusInternship.company) + '</b>';
      } else {
        roadmapFocusEl.style.display = "none";
      }
    }

    roadmapList.innerHTML = roadmapItems.map(function (item) {
      var isDone = completedWeeks.indexOf(item.week) !== -1;
      var tasks = (item.tasks || []).map(function (task) { return '<span class="roadmap-task">' + escapeHtml(task) + '</span>'; }).join("");
      return (
        '<div class="roadmap-item' + (isDone ? ' completed' : '') + '">' +
          '<div class="roadmap-week">Week ' + item.week + '</div>' +
          '<div class="roadmap-body">' +
            '<h3>' + escapeHtml(item.title) + '</h3>' +
            '<p>' + escapeHtml(item.body) + '</p>' +
            (tasks ? '<div class="roadmap-task-list">' + tasks + '</div>' : '') +
            '<label class="roadmap-check-label">' +
              '<input type="checkbox" class="week-checkbox" data-week="' + item.week + '" ' + (isDone ? 'checked' : '') + '> ' +
              (isDone ? 'Completed' : 'Mark week as completed') +
            '</label>' +
          '</div>' +
        '</div>'
      );
    }).join("");

    roadmapList.querySelectorAll(".week-checkbox").forEach(function (cb) {
      cb.addEventListener("change", function () {
        var w = parseInt(cb.dataset.week, 10);
        if (cb.checked) {
          if (completedWeeks.indexOf(w) === -1) completedWeeks.push(w);
          showToast("Week " + w + " milestone marked completed!");
        } else {
          completedWeeks = completedWeeks.filter(function (x) { return x !== w; });
          showToast("Week " + w + " unchecked.");
        }
        localStorage.setItem("pathnotes_roadmap_progress", JSON.stringify(completedWeeks));
        if (accounts) accounts.updateRoadmap(completedWeeks);
        renderAll();
      });
    });

    /* 9. Internship readiness bars */
    renderInternshipBars(personal, skills, interests, goal, levels, projects);

    /* 10. Saved + curated Internships directory */
    renderSavedInternships();
    renderInternshipsDirectory();

    /* 11. Resume Analyzer update */
    var resumeRoleLabel = document.getElementById("resumeRoleLabel");
    if (resumeRoleLabel) resumeRoleLabel.textContent = primaryRole.name;

    /* 12. Application Tracker */
    renderTrackerTable();

    /* 13. Profile Section */
    renderProfileView(personal, levels, projects, interests);

    /* 14. Recommended actions */
    renderActionCards(projects, levels, gaps);
  }

  /* ---------------- roadmap builder ---------------- */
  function buildRoadmap(gaps, levels, projects, interests) {
    var items = [];
    var g = gaps.slice();
    var focus = null;
    if (data.activeInternshipId) {
      focus = savedInternships.find(function (x) { return x.id === data.activeInternshipId; }) || null;
    }
    if (!focus && savedInternships.length) focus = savedInternships[0];

    var focusSkills = focus && Array.isArray(focus.skills) ? focus.skills : [];
    var missingFocus = focusSkills.filter(function (s) { return !userHas(s); });
    var w1 = pickGap(g, ["Git", "GitHub", "SQL", "DSA"]) || pickAny(missingFocus) || pickAny(g) || "your weakest technical skill";
    items.push({
      week: 1,
      title: "Close your biggest skill gap: " + w1,
      body: "Build a small practice routine instead of only watching tutorials. Aim for 30–45 minutes a day and finish one measurable exercise by the end of the week.",
      tasks: ["5 focused sessions", "1 mini exercise", "Write 5 takeaways"]
    });

    var dsaWeak = (levels.dsa === "Beginner") || g.indexOf("DSA") !== -1;
    var w2 = dsaWeak ? "DSA fundamentals" : (pickAny(missingFocus) || pickAny(g) || "interview fundamentals");
    items.push({
      week: 2,
      title: "Practice " + w2,
      body: dsaWeak ? "Solve 8–12 beginner problems on arrays, strings and basic complexity. Review every mistake and keep your solutions in GitHub." : "Turn the second gap into interview-ready evidence with short exercises, notes and one timed practice session.",
      tasks: [dsaWeak ? "8–12 problems" : "3 practice tasks", "1 timed session", "Review mistakes"]
    });

    var interestArea = interests[0] || "your target field";
    var projectName = focus && focus.role ? focus.role + " prep project" : interestArea + " mini-project";
    items.push({
      week: 3,
      title: "Build evidence: " + projectName,
      body: "Create or improve one project that demonstrates the skills you are trying to prove. Keep the scope small enough to finish and document.",
      tasks: ["Define MVP", "3–5 Git commits", "README + screenshots"]
    });

    var finalBody = focus
      ? "Finish your target internship preparation: tailor your resume, verify the listing, apply on the original source, and record the application status in PathNotes."
      : "Polish your strongest project, update your resume and start applying to roles that match your current profile.";
    items.push({
      week: 4,
      title: focus ? "Apply + track: " + focus.role : "Package your profile and apply",
      body: finalBody,
      tasks: ["Resume update", "1 application", "Track next step"]
    });

    return items;
  }
  function pickGap(list, preferred) {
    for (var i = 0; i < preferred.length; i++) {
      if (list.indexOf(preferred[i]) !== -1) return preferred[i];
    }
    return null;
  }
  function pickAny(list) { return list.length ? list[0] : null; }

  /* ---------------- internship readiness bars ---------------- */
  function renderInternshipBars(personal, skills, interests, goal, levels, projects) {
    var totalFields = 18;
    var filledFields = 0;
    ["fullName","collegeName","degree","branch","yearSem","gradYear","location"].forEach(function (k) { if (personal[k]) filledFields++; });
    if (interests.length) filledFields++;
    if (goal) filledFields++;
    if (skills.length) filledFields++;
    if (data.experience && data.experience.githubLink) filledFields++;
    if (data.experience && data.experience.linkedinLink) filledFields++;
    if (data.experience && data.experience.certifications) filledFields++;
    if (projects.length) filledFields++;
    if (data.hoursPerWeek) filledFields++;
    var levelKeys = ["dsa", "dev", "cs", "comm", "apt"];
    if (levelKeys.every(function (k) { return levels[k]; })) filledFields++;
    if (data.targetCompanyTypes && data.targetCompanyTypes.length) filledFields++;
    var profileCompletion = Math.round((filledFields / totalFields) * 100);

    var githubLink = (data.experience && data.experience.githubLink) || "";
    var linkedinLink = (data.experience && data.experience.linkedinLink) || "";
    var certs = (data.experience && data.experience.certifications) || "";

    var resumeSignals = [Boolean(githubLink), Boolean(linkedinLink), Boolean(certs), projects.length > 0, skills.length >= 5];
    var resumeReadiness = Math.round((resumeSignals.filter(Boolean).length / resumeSignals.length) * 100);

    var projectStrength = Math.round(Math.min(projects.length / 3, 1) * 100);
    var technicalSkills = Math.round(Math.min(skills.length / 15, 1) * 100);
    var overallInternship = Math.round((profileCompletion + resumeReadiness + projectStrength + technicalSkills) / 4);

    var barsData = [
      { label: "Profile completion", value: profileCompletion },
      { label: "Resume readiness", value: resumeReadiness },
      { label: "Project strength", value: projectStrength },
      { label: "Technical skills", value: technicalSkills },
      { label: "Overall internship readiness", value: overallInternship, overall: true }
    ];

    document.getElementById("readinessBars").innerHTML = barsData.map(function (b) {
      return (
        '<div class="bar-row' + (b.overall ? " overall" : "") + '">' +
          '<div class="bar-top"><span>' + escapeHtml(b.label) + '</span><span class="val">' + b.value + '%</span></div>' +
          '<div class="bar-track"><div class="fill" style="width:' + b.value + '%;"></div></div>' +
        '</div>'
      );
    }).join("");
  }

  /* ---------------- saved internship workbench ---------------- */
  function detectInternshipSource(url) {
    try {
      var host = new URL(url).hostname.toLowerCase();
      if (host.indexOf("internshala") !== -1) return "Internshala";
      if (host.indexOf("naukri") !== -1) return "Naukri";
      if (host.indexOf("linkedin") !== -1) return "LinkedIn";
      return "Company / external site";
    } catch (e) { return "External listing"; }
  }

  function validHttpUrl(url) {
    try {
      var u = new URL(url);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch (e) { return false; }
  }

  var customInternshipGrid = document.getElementById("customInternshipGrid");
  var internshipUrlInput = document.getElementById("internshipUrl");
  var internshipSourceHint = document.getElementById("internshipSourceHint");

  if (internshipUrlInput) {
    internshipUrlInput.addEventListener("input", function () {
      var url = internshipUrlInput.value.trim();
      if (!url) {
        internshipSourceHint.textContent = "Paste a listing link to detect its source.";
        return;
      }
      internshipSourceHint.textContent = validHttpUrl(url)
        ? "Source detected: " + detectInternshipSource(url)
        : "Enter a full link starting with https://";
    });
  }

  var saveCustomInternshipBtn = document.getElementById("saveCustomInternshipBtn");
  if (saveCustomInternshipBtn) {
    saveCustomInternshipBtn.addEventListener("click", function () {
      var url = (document.getElementById("internshipUrl") || {}).value || "";
      var company = (document.getElementById("internshipCompany") || {}).value || "";
      var role = (document.getElementById("internshipRole") || {}).value || "";
      var location = (document.getElementById("internshipLocation") || {}).value || "";
      var deadline = (document.getElementById("internshipDeadline") || {}).value || "";
      var stipend = (document.getElementById("internshipStipend") || {}).value || "";
      var skillsText = (document.getElementById("internshipSkills") || {}).value || "";
      var description = (document.getElementById("internshipDescription") || {}).value || "";

      url = url.trim(); company = company.trim(); role = role.trim(); location = location.trim();
      deadline = deadline.trim(); stipend = stipend.trim(); description = description.trim();
      var skills = skillsText.split(",").map(function (x) { return x.trim(); }).filter(Boolean);

      if (!validHttpUrl(url)) { showToast("Please enter a valid internship link starting with https://"); return; }
      if (!company || !role) { showToast("Company and role are required."); return; }

      var item = {
        id: "saved-intern-" + Date.now(),
        url: url,
        source: detectInternshipSource(url),
        company: company,
        role: role,
        location: location || "Not specified",
        deadline: deadline,
        stipend: stipend,
        skills: skills,
        description: description || "No description added yet.",
        createdAt: new Date().toISOString()
      };
      savedInternships.unshift(item);
      if (accounts) accounts.updateSavedInternships(savedInternships);
      localStorage.setItem("pathnotes_saved_internships", JSON.stringify(savedInternships));

      // Put it into the application pipeline as a Wishlist item; user can mark Applied later.
      var exists = applications.some(function (a) { return norm(a.company) === norm(company) && norm(a.role) === norm(role); });
      if (!exists) {
        applications.unshift({
          id: "app-" + Date.now(),
          company: company,
          role: role,
          date: new Date().toISOString().split("T")[0],
          status: "Wishlist",
          notes: "Saved from " + item.source + ". Listing: " + url,
          internshipId: item.id,
          url: url
        });
        saveApplications();
      }

      ["internshipUrl","internshipCompany","internshipRole","internshipLocation","internshipDeadline","internshipStipend","internshipSkills","internshipDescription"].forEach(function (id) {
        var el = document.getElementById(id); if (el) el.value = "";
      });
      if (internshipSourceHint) internshipSourceHint.textContent = "Saved. Add another listing whenever you find one.";
      showToast("Saved " + role + " at " + company + " to your PathNotes shortlist.");
      renderAll();
    });
  }

  function updateSavedInternshipsStorage() {
    if (accounts) accounts.updateSavedInternships(savedInternships);
    try { localStorage.setItem("pathnotes_saved_internships", JSON.stringify(savedInternships)); } catch (e) {}
  }

  function getApplicationForInternship(item) {
    return applications.find(function (a) {
      return a.internshipId === item.id || (norm(a.company) === norm(item.company) && norm(a.role) === norm(item.role));
    });
  }

  function markInternshipApplied(item) {
    var app = getApplicationForInternship(item);
    if (!app) {
      app = { id: "app-" + Date.now(), company: item.company, role: item.role, date: new Date().toISOString().split("T")[0], status: "Applied", notes: "Applied from saved internship.", internshipId: item.id, url: item.url };
      applications.unshift(app);
    } else {
      app.status = "Applied";
      app.date = new Date().toISOString().split("T")[0];
      app.url = item.url;
      app.internshipId = item.id;
    }
    saveApplications();
    showToast("Marked " + item.company + " as Applied.");
    renderAll();
  }

  function renderSavedInternships() {
    if (!customInternshipGrid) return;
    if (!savedInternships.length) {
      customInternshipGrid.innerHTML = '<div class="card" style="grid-column:1/-1;text-align:center;padding:28px;color:var(--ink-soft);">No saved internships yet. Paste a listing link above to build your personal shortlist.</div>';
      return;
    }

    var today = new Date(); today.setHours(0,0,0,0);
    customInternshipGrid.innerHTML = savedInternships.map(function (item) {
      var expired = false;
      if (item.deadline) { var d = new Date(item.deadline + "T00:00:00"); expired = !isNaN(d) && d < today; }
      var app = getApplicationForInternship(item);
      var status = app ? app.status : "Wishlist";
      var missing = (item.skills || []).filter(function (skill) { return !userHas(skill); });
      return '<div class="internship-card saved-internship-card ' + (expired ? 'expired' : '') + '">' +
        '<div>' +
          '<div class="internship-top"><div><div class="internship-title">' + escapeHtml(item.role) + '</div><div class="internship-company">' + escapeHtml(item.company) + ' • ' + escapeHtml(item.location) + '</div></div><span class="status-pill status-' + escapeAttr(status) + '">' + escapeHtml(status) + '</span></div>' +
          '<div class="internship-source">Source: ' + escapeHtml(item.source) + '</div>' +
          '<div class="internship-details"><span class="deadline">' + (item.deadline ? (expired ? 'Deadline passed: ' : 'Deadline: ') + escapeHtml(item.deadline) : 'No deadline added') + '</span>' + (item.stipend ? '<span>' + escapeHtml(item.stipend) + '</span>' : '') + '</div>' +
          '<p style="font-size:12.5px;color:var(--ink-soft);margin:0 0 10px;">' + escapeHtml(item.description) + '</p>' +
          '<div class="internship-skills">' + ((item.skills || []).length ? item.skills.map(function (s) { return '<span class="tag ' + (userHas(s) ? 'have' : 'gap') + '" style="font-size:11px;padding:3px 8px;">' + (userHas(s) ? '✓ ' : '') + escapeHtml(s) + '</span>'; }).join("") : '<span class="empty-note">No skills added</span>') + '</div>' +
          (missing.length ? '<div style="font-size:11.5px;color:var(--ink-soft);">Skill gaps for this listing: <b>' + escapeHtml(missing.slice(0,4).join(", ")) + (missing.length > 4 ? ' +' + (missing.length-4) : '') + '</b></div>' : '<div style="font-size:11.5px;color:var(--sage);font-weight:600;">Your listed skills cover the saved requirements.</div>') +
        '</div>' +
        '<div class="saved-actions">' +
          '<a class="btn btn-solid btn-sm" href="' + escapeAttr(item.url) + '" target="_blank" rel="noopener noreferrer">Open listing ↗</a>' +
          '<button class="btn btn-ghost btn-sm mark-applied-btn" data-id="' + escapeAttr(item.id) + '">' + (status === 'Applied' ? 'Applied ✓' : 'Mark Applied') + '</button>' +
          '<button class="btn btn-ghost btn-sm prep-intern-btn" data-id="' + escapeAttr(item.id) + '">Prepare for this</button>' +
          '<button class="btn btn-ghost btn-sm delete-saved-intern-btn" data-id="' + escapeAttr(item.id) + '" style="color:var(--error);">Remove</button>' +
        '</div>' +
      '</div>';
    }).join("");

    customInternshipGrid.querySelectorAll(".mark-applied-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var item = savedInternships.find(function (x) { return x.id === btn.dataset.id; }); if (item) markInternshipApplied(item);
      });
    });
    customInternshipGrid.querySelectorAll(".prep-intern-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var item = savedInternships.find(function (x) { return x.id === btn.dataset.id; }); if (!item) return;
        data.activeInternshipId = item.id; saveData();
        showToast("Roadmap focus set to " + item.role + "."); renderAll();
      });
    });
    customInternshipGrid.querySelectorAll(".delete-saved-intern-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var idx = savedInternships.findIndex(function (x) { return x.id === btn.dataset.id; });
        if (idx < 0) return;
        var item = savedInternships[idx];
        if (!confirm("Remove " + item.role + " at " + item.company + " from your shortlist?")) return;
        savedInternships.splice(idx, 1);
        if (data.activeInternshipId === item.id) { delete data.activeInternshipId; saveData(); }
        updateSavedInternshipsStorage();
        showToast("Internship removed from shortlist."); renderAll();
      });
    });
  }

  /* ---------------- curated internships directory ---------------- */
  var currentInternshipFilter = "all";
  var internshipGrid = document.getElementById("internshipGrid");
  var filterButtons = document.querySelectorAll("#internshipFilterBar .filter-btn");

  filterButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      filterButtons.forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      currentInternshipFilter = btn.dataset.filter;
      renderInternshipsDirectory();
    });
  });

  function renderInternshipsDirectory() {
    if (!internshipGrid) return;
    var interests = getInterests();

    // calculate match for each internship
    internshipDatabase.forEach(function (item) {
      var haveCount = item.requiredSkills.filter(function (s) { return userHas(s); }).length;
      item.matchScore = Math.round((haveCount / item.requiredSkills.length) * 100);
    });

    var filtered = internshipDatabase.filter(function (item) {
      if (currentInternshipFilter === "matching") {
        return interests.indexOf(item.interestCategory) !== -1;
      }
      if (currentInternshipFilter === "high") {
        return item.matchScore >= 70;
      }
      if (currentInternshipFilter === "remote") {
        return item.workMode.toLowerCase().indexOf("remote") !== -1;
      }
      return true;
    });

    if (filtered.length === 0) {
      internshipGrid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:30px; color:var(--ink-soft); font-style:italic;">No internship roles match this filter right now. Try "All Opportunities".</div>';
      return;
    }

    internshipGrid.innerHTML = filtered.map(function (item) {
      var isHigh = item.matchScore >= 70;
      var alreadyTracked = applications.some(function (a) { return norm(a.company) === norm(item.company) && norm(a.role) === norm(item.title); });

      return (
        '<div class="internship-card">' +
          '<div>' +
            '<div class="internship-top">' +
              '<div>' +
                '<div class="internship-title">' + escapeHtml(item.title) + '</div>' +
                '<div class="internship-company">' + escapeHtml(item.company) + ' • ' + escapeHtml(item.location) + '</div>' +
              '</div>' +
              '<span class="match-badge ' + (isHigh ? '' : 'moderate') + '">' + item.matchScore + '% Match</span>' +
            '</div>' +
            '<div class="internship-details">' +
              '<span><b>Stipend:</b> ' + escapeHtml(item.stipend) + '</span>' +
              '<span><b>Duration:</b> ' + escapeHtml(item.duration) + '</span>' +
            '</div>' +
            '<div class="internship-skills">' +
              item.requiredSkills.map(function (s) {
                var hasIt = userHas(s);
                return '<span class="tag ' + (hasIt ? 'have' : 'gap') + '" style="font-size:11.5px; padding:3px 8px;">' + (hasIt ? '✓ ' : '') + escapeHtml(s) + '</span>';
              }).join("") +
            '</div>' +
          '</div>' +
          '<div class="internship-actions">' +
            '<button class="btn btn-sm ' + (alreadyTracked ? 'btn-ghost' : 'btn-solid') + ' save-intern-btn" data-id="' + item.id + '">' +
              (alreadyTracked ? '✓ In Tracker' : '+ Save to Tracker') +
            '</button>' +
            '<button class="btn btn-sm btn-ghost view-intern-btn" data-id="' + item.id + '">View Details</button>' +
          '</div>' +
        '</div>'
      );
    }).join("");

    internshipGrid.querySelectorAll(".save-intern-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.dataset.id;
        var intern = internshipDatabase.find(function (x) { return x.id === id; });
        if (!intern) return;

        var existing = applications.find(function (a) { return norm(a.company) === norm(intern.company) && norm(a.role) === norm(intern.title); });
        if (existing) {
          showToast("Already tracking " + intern.title + " at " + intern.company);
          return;
        }

        var newApp = {
          id: "app-" + Date.now(),
          company: intern.company,
          role: intern.title,
          date: new Date().toISOString().split("T")[0],
          status: "Wishlist",
          notes: "Demo role saved from PathNotes curated examples (" + intern.stipend + ")"
        };
        applications.unshift(newApp);
        saveApplications();
        showToast("Saved " + intern.title + " at " + intern.company + " to Tracker!");
        renderAll();
      });
    });

    internshipGrid.querySelectorAll(".view-intern-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.dataset.id;
        var intern = internshipDatabase.find(function (x) { return x.id === id; });
        if (!intern) return;

        openModal(
          '<h3>' + escapeHtml(intern.title) + ' — ' + escapeHtml(intern.company) + '</h3>' +
          '<div style="font-size:13.5px; color:var(--ink-soft); margin-bottom:14px;">' + escapeHtml(intern.location) + ' • ' + escapeHtml(intern.stipend) + ' • ' + escapeHtml(intern.duration) + '</div>' +
          '<p>' + escapeHtml(intern.description) + '</p>' +
          '<div style="margin-bottom:16px;"><b>Required Technical Skills:</b></div>' +
          '<div class="tag-list" style="margin-bottom:20px;">' +
            intern.requiredSkills.map(function (s) {
              return '<span class="tag ' + (userHas(s) ? 'have' : 'gap') + '">' + escapeHtml(s) + '</span>';
            }).join("") +
          '</div>' +
          '<div class="modal-actions">' +
            '<button class="btn btn-ghost btn-sm" onclick="document.getElementById(\'modalOverlay\').click();">Close</button>' +
            '<button class="btn btn-solid btn-sm" id="modalTrackBtn">+ Save to Tracker</button>' +
          '</div>'
        );

        var modalTrackBtn = document.getElementById("modalTrackBtn");
        if (modalTrackBtn) {
          modalTrackBtn.addEventListener("click", function () {
            closeModal();
            var existing = applications.find(function (a) { return norm(a.company) === norm(intern.company) && norm(a.role) === norm(intern.title); });
            if (!existing) {
              applications.unshift({
                id: "app-" + Date.now(),
                company: intern.company,
                role: intern.title,
                date: new Date().toISOString().split("T")[0],
                status: "Wishlist",
                notes: "Demo role saved from PathNotes curated examples"
              });
              saveApplications();
              showToast("Saved to application tracker!");
              renderAll();
            } else {
              showToast("Already in tracker.");
            }
          });
        }
      });
    });
  }

  /* ---------------- resume keyword analyzer ---------------- */
  var sampleResumeText =
    "Rahul Sharma\n" +
    "Bengaluru, India | +91 9876543210 | rahul.sharma@example.com\n" +
    "GitHub: https://github.com/rahul-dev | LinkedIn: https://linkedin.com/in/rahul-sharma\n\n" +
    "EDUCATION\n" +
    "B.Tech in Computer Science and Engineering | 2023 - 2027\n" +
    "CGPA: 8.4 / 10\n\n" +
    "TECHNICAL SKILLS\n" +
    "Languages: Python, Java, C++, JavaScript\n" +
    "Web Technologies: HTML, CSS, React, Node.js, REST APIs\n" +
    "Databases: SQL, MySQL, MongoDB\n" +
    "Tools & Concepts: Git, GitHub, Linux, Docker, DSA, OOP, Problem solving\n\n" +
    "PROJECTS\n" +
    "1. Campus Placement & Internship Planner\n" +
    "- Built responsive web dashboard using HTML, CSS, and modern JavaScript.\n" +
    "- Implemented role-matching algorithms and gap analysis against industry requirements.\n" +
    "- Managed state persistence with localStorage for offline reliability.\n\n" +
    "2. Distributed Task Queue\n" +
    "- Implemented in Python and Redis with asynchronous worker threads.\n" +
    "- Handled task retries, error logging, and REST API monitoring endpoints.\n\n" +
    "EXPERIENCE & CERTIFICATIONS\n" +
    "- Hackathon Finalist, National College Hackathon 2025\n" +
    "- Certified in Data Structures & Algorithms (NPTEL)";

  var resumeInput = document.getElementById("resumeText");
  var analyzeBtn = document.getElementById("analyzeResumeBtn");
  var sampleBtn = document.getElementById("loadSampleResumeBtn");
  var clearBtn = document.getElementById("clearResumeBtn");
  var resumeFileInput = document.getElementById("resumeFileInput");
  var chooseResumeFileBtn = document.getElementById("chooseResumeFileBtn");
  var resumeDropZone = document.getElementById("resumeDropZone");
  var resumeFileMeta = document.getElementById("resumeFileMeta");

  if (typeof pdfjsLib !== "undefined" && pdfjsLib.GlobalWorkerOptions) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  }

  if (chooseResumeFileBtn && resumeFileInput) {
    chooseResumeFileBtn.addEventListener("click", function () { resumeFileInput.click(); });
  }
  if (resumeDropZone && resumeFileInput) {
    ["dragenter", "dragover"].forEach(function (eventName) {
      resumeDropZone.addEventListener(eventName, function (e) { e.preventDefault(); resumeDropZone.classList.add("dragging"); });
    });
    ["dragleave", "drop"].forEach(function (eventName) {
      resumeDropZone.addEventListener(eventName, function (e) { e.preventDefault(); resumeDropZone.classList.remove("dragging"); });
    });
    resumeDropZone.addEventListener("drop", function (e) {
      var files = e.dataTransfer && e.dataTransfer.files;
      if (files && files[0]) loadResumeFile(files[0]);
    });
  }
  if (resumeFileInput) resumeFileInput.addEventListener("change", function () {
    if (resumeFileInput.files && resumeFileInput.files[0]) loadResumeFile(resumeFileInput.files[0]);
  });

  function setResumeFileMeta(file, status) {
    if (!resumeFileMeta) return;
    resumeFileMeta.style.display = "flex";
    resumeFileMeta.innerHTML = '<span>📄 ' + escapeHtml(file.name) + '</span><span>' + escapeHtml(status) + '</span>';
  }

  function loadResumeFile(file) {
    var name = String(file.name || "");
    var ext = name.split(".").pop().toLowerCase();
    var allowed = ["pdf", "docx", "txt", "md"];
    if (allowed.indexOf(ext) === -1) {
      showToast("Use PDF, Word (.docx), TXT or Markdown files.");
      return;
    }
    setResumeFileMeta(file, "Reading…");
    if (ext === "pdf") extractPdfResume(file);
    else if (ext === "docx") extractDocxResume(file);
    else extractTextResume(file);
  }

  function finishResumeExtraction(file, text) {
    text = String(text || "").replace(/\u0000/g, "").trim();
    if (!text) {
      setResumeFileMeta(file, "No readable text found");
      showToast("The file did not contain readable text. Try a text-based PDF/DOCX or paste the resume.");
      return;
    }
    if (resumeInput) resumeInput.value = text;
    setResumeFileMeta(file, "Ready to analyze");
    showToast("Resume text extracted from " + file.name + ".");
  }

  function extractTextResume(file) {
    var reader = new FileReader();
    reader.onload = function (e) { finishResumeExtraction(file, e.target.result || ""); };
    reader.onerror = function () { setResumeFileMeta(file, "Could not read file"); showToast("Could not read that file."); };
    reader.readAsText(file);
  }

  function extractDocxResume(file) {
    if (typeof mammoth === "undefined") {
      setResumeFileMeta(file, "Word parser unavailable");
      showToast("Word parsing library could not load. Check your internet connection or paste the text instead.");
      return;
    }
    var reader = new FileReader();
    reader.onload = function (e) {
      mammoth.extractRawText({ arrayBuffer: e.target.result })
        .then(function (result) { finishResumeExtraction(file, result.value || ""); })
        .catch(function () { setResumeFileMeta(file, "Could not parse DOCX"); showToast("Could not parse this Word file."); });
    };
    reader.onerror = function () { setResumeFileMeta(file, "Could not read file"); showToast("Could not read that file."); };
    reader.readAsArrayBuffer(file);
  }

  function extractPdfResume(file) {
    if (typeof pdfjsLib === "undefined") {
      setResumeFileMeta(file, "PDF parser unavailable");
      showToast("PDF parser could not load. Check your internet connection or paste the text instead.");
      return;
    }
    var reader = new FileReader();
    reader.onload = function (e) {
      var typed = new Uint8Array(e.target.result);
      pdfjsLib.getDocument({ data: typed }).promise.then(function (pdf) {
        var pages = [];
        var jobs = [];
        for (var i = 1; i <= pdf.numPages; i++) {
          jobs.push(pdf.getPage(i).then(function (page) {
            return page.getTextContent().then(function (content) {
              return content.items.map(function (item) { return item.str; }).join(" ");
            });
          }));
        }
        Promise.all(jobs).then(function (texts) {
          finishResumeExtraction(file, texts.join("\n\n"));
        });
      }).catch(function () {
        setResumeFileMeta(file, "Could not parse PDF");
        showToast("Could not read this PDF. If it is scanned/image-only, paste or OCR the text first.");
      });
    };
    reader.onerror = function () { setResumeFileMeta(file, "Could not read file"); showToast("Could not read that file."); };
    reader.readAsArrayBuffer(file);
  }

  if (sampleBtn) {
    sampleBtn.addEventListener("click", function () {
      if (resumeInput) {
        resumeInput.value = sampleResumeText;
        showToast("Loaded sample engineering resume.");
      }
    });
  }
  if (clearBtn) {
    clearBtn.addEventListener("click", function () {
      if (resumeInput) resumeInput.value = "";
      if (resumeFileInput) resumeFileInput.value = "";
      if (resumeFileMeta) resumeFileMeta.style.display = "none";
      document.getElementById("resumePlaceholder").style.display = "block";
      document.getElementById("resumeAnalysisContent").style.display = "none";
    });
  }
  if (analyzeBtn) {
    analyzeBtn.addEventListener("click", function () {
      var text = (resumeInput ? resumeInput.value : "").trim();
      if (!text) {
        showToast("Please paste your resume text first.");
        return;
      }
      runResumeAnalysis(text);
    });
  }

  function runResumeAnalysis(text) {
    var lower = text.toLowerCase();
    var primary = roles.find(function (r) { return r.name === activeRoleName; }) || roles[0];

    document.getElementById("analyzedRoleName").textContent = primary.name;

    var matched = [];
    var missing = [];
    primary.required.forEach(function (skill) {
      if (lower.indexOf(skill.toLowerCase()) !== -1) {
        matched.push(skill);
      } else {
        missing.push(skill);
      }
    });

    var keywordScore = primary.required.length ? Math.round((matched.length / primary.required.length) * 100) : 0;

    // Check sections
    var checks = [
      { name: "Contact Info / Profile Links", pass: /github|linkedin|http|@|\.com/i.test(text) },
      { name: "Education Section", pass: /education|b\.tech|b\.e\.|college|university|cgpa|gpa/i.test(text) },
      { name: "Technical Skills List", pass: /skills|languages|technologies|tools/i.test(text) },
      { name: "Projects Listed", pass: /project|developed|built|created|implemented/i.test(text) },
      { name: "Experience or Certifications", pass: /experience|internship|certified|certification|hackathon/i.test(text) }
    ];

    var sectionPassCount = checks.filter(function (c) { return c.pass; }).length;
    var overallResumeScore = Math.round((keywordScore * 0.7) + ((sectionPassCount / checks.length) * 100 * 0.3));

    document.getElementById("resumePlaceholder").style.display = "none";
    document.getElementById("resumeAnalysisContent").style.display = "block";

    document.getElementById("resumeScoreBadge").textContent = overallResumeScore + "% Match";

    var matchedEl = document.getElementById("resumeMatchedKeywords");
    matchedEl.innerHTML = matched.length
      ? matched.map(function (k) { return '<span class="tag have">✓ ' + escapeHtml(k) + '</span>'; }).join("")
      : '<span class="empty-note">No keywords matched for this role.</span>';

    var missingEl = document.getElementById("resumeMissingKeywords");
    missingEl.innerHTML = missing.length
      ? missing.map(function (k) { return '<span class="tag gap">+ ' + escapeHtml(k) + '</span>'; }).join("")
      : '<span class="empty-note">All essential keywords are present!</span>';

    var checkEl = document.getElementById("resumeChecklist");
    checkEl.innerHTML = checks.map(function (c) {
      return (
        '<div class="checklist-item ' + (c.pass ? 'pass' : 'fail') + '">' +
          '<span>' + (c.pass ? '✓' : '○') + '</span> ' +
          '<span>' + escapeHtml(c.name) + ' (' + (c.pass ? 'Detected' : 'Missing or weak') + ')</span>' +
        '</div>'
      );
    }).join("");

    showToast("Resume scan complete (" + overallResumeScore + "% match)");
  }

  /* ---------------- application tracker ---------------- */
  var currentTrackerStatus = "all";
  var trackerFilterButtons = document.querySelectorAll("#trackerFilterBar .filter-btn");

  trackerFilterButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      trackerFilterButtons.forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      currentTrackerStatus = btn.dataset.status;
      renderTrackerTable();
    });
  });

  function saveApplications() {
    try {
      localStorage.setItem("pathnotes_applications", JSON.stringify(applications));
      if (accounts) accounts.updateApplications(applications);
    } catch (e) {
      console.error("Could not save applications:", e);
    }
  }

  function renderTrackerTable() {
    var tbody = document.getElementById("trackerTableBody");
    var empty = document.getElementById("trackerEmptyState");
    if (!tbody) return;

    // update counters
    var total = applications.length;
    var wishlist = applications.filter(function (a) { return a.status === "Wishlist"; }).length;
    var applied = applications.filter(function (a) { return a.status === "Applied"; }).length;
    var interview = applications.filter(function (a) { return a.status === "Interview" || a.status === "OA"; }).length;
    var offer = applications.filter(function (a) { return a.status === "Offer"; }).length;

    document.getElementById("pillTotalApps").textContent = total + " Total";
    document.getElementById("pillWishlistApps").textContent = wishlist + " Wishlist";
    document.getElementById("pillAppliedApps").textContent = applied + " Applied";
    document.getElementById("pillInterviewApps").textContent = interview + " Interview/OA";
    document.getElementById("pillOfferApps").textContent = offer + " Offers";

    var filtered = applications.filter(function (a) {
      if (currentTrackerStatus === "all") return true;
      return a.status === currentTrackerStatus;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = "";
      if (empty) empty.style.display = "block";
      return;
    }

    if (empty) empty.style.display = "none";
    tbody.innerHTML = filtered.map(function (app) {
      var statuses = ["Wishlist", "Applied", "OA", "Interview", "Offer", "Rejected"];
      var options = statuses.map(function (st) {
        return '<option value="' + st + '" ' + (app.status === st ? 'selected' : '') + '>' + st + '</option>';
      }).join("");

      return (
        '<tr>' +
          '<td><b>' + escapeHtml(app.company) + '</b></td>' +
          '<td>' + escapeHtml(app.role) + '</td>' +
          '<td style="color:var(--ink-soft); font-size:12.5px;">' + escapeHtml(app.date || "—") + '</td>' +
          '<td>' +
            '<select class="app-status-select" data-id="' + app.id + '" style="font-family:\'Space Grotesk\'; font-size:12px; padding:4px 8px; border-radius:4px; border:1px solid var(--line); background:var(--paper);">' +
              options +
            '</select>' +
          '</td>' +
          '<td style="font-size:12.5px; color:var(--ink-soft); max-width:200px;">' + escapeHtml(app.notes || "—") + '</td>' +
          '<td style="text-align:right;">' +
            '<span class="app-del-btn" data-id="' + app.id + '" style="cursor:pointer; color:var(--error); font-size:12.5px; border-bottom:1px dashed var(--error);">Delete</span>' +
          '</td>' +
        '</tr>'
      );
    }).join("");

    tbody.querySelectorAll(".app-status-select").forEach(function (sel) {
      sel.addEventListener("change", function () {
        var id = sel.dataset.id;
        var app = applications.find(function (a) { return a.id === id; });
        if (app) {
          app.status = sel.value;
          saveApplications();
          showToast("Updated " + app.company + " status to " + app.status);
          renderTrackerTable();
        }
      });
    });

    tbody.querySelectorAll(".app-del-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.dataset.id;
        var app = applications.find(function (a) { return a.id === id; });
        if (app && confirm("Delete tracked application for " + app.company + "?")) {
          applications = applications.filter(function (a) { return a.id !== id; });
          saveApplications();
          showToast("Application deleted.");
          renderAll();
        }
      });
    });
  }

  // Add application modal
  var openAddAppModalBtn = document.getElementById("openAddAppModalBtn");
  if (openAddAppModalBtn) {
    openAddAppModalBtn.addEventListener("click", function () {
      openModal(
        '<h3>+ Track New Internship Application</h3>' +
        '<div style="margin-top:16px;">' +
          '<div class="field" style="margin-bottom:14px;"><label style="display:block; font-size:13px; margin-bottom:4px;">Company Name</label><input type="text" id="modalAppCompany" class="proj-name" placeholder="e.g. Google, Flipkart, Startup" style="width:100%; border:none; border-bottom:2px solid var(--line); background:transparent; padding:6px 0; font-size:14px;"></div>' +
          '<div class="field" style="margin-bottom:14px;"><label style="display:block; font-size:13px; margin-bottom:4px;">Role Title</label><input type="text" id="modalAppRole" placeholder="e.g. SDE Intern" style="width:100%; border:none; border-bottom:2px solid var(--line); background:transparent; padding:6px 0; font-size:14px;"></div>' +
          '<div class="field" style="margin-bottom:14px;"><label style="display:block; font-size:13px; margin-bottom:4px;">Date</label><input type="date" id="modalAppDate" value="' + new Date().toISOString().split("T")[0] + '" style="width:100%; border:none; border-bottom:2px solid var(--line); background:transparent; padding:6px 0; font-size:14px;"></div>' +
          '<div class="field" style="margin-bottom:14px;"><label style="display:block; font-size:13px; margin-bottom:4px;">Initial Status</label>' +
            '<select id="modalAppStatus" style="width:100%; border:none; border-bottom:2px solid var(--line); background:transparent; padding:6px 0; font-size:14px;">' +
              '<option>Wishlist</option>' +
              '<option selected>Applied</option>' +
              '<option>OA</option>' +
              '<option>Interview</option>' +
              '<option>Offer</option>' +
              '<option>Rejected</option>' +
            '</select>' +
          '</div>' +
          '<div class="field" style="margin-bottom:14px;"><label style="display:block; font-size:13px; margin-bottom:4px;">Notes</label><textarea id="modalAppNotes" placeholder="Application link, contact person, or referral info" style="width:100%; height:60px; border:1px solid var(--line); padding:8px; font-size:13px;"></textarea></div>' +
        '</div>' +
        '<div class="modal-actions">' +
          '<button class="btn btn-ghost btn-sm" onclick="document.getElementById(\'modalOverlay\').click();">Cancel</button>' +
          '<button class="btn btn-solid btn-sm" id="modalSaveAppBtn">Save Application</button>' +
        '</div>'
      );

      var modalSaveAppBtn = document.getElementById("modalSaveAppBtn");
      if (modalSaveAppBtn) {
        modalSaveAppBtn.addEventListener("click", function () {
          var company = document.getElementById("modalAppCompany").value.trim();
          var role = document.getElementById("modalAppRole").value.trim();
          var date = document.getElementById("modalAppDate").value;
          var status = document.getElementById("modalAppStatus").value;
          var notes = document.getElementById("modalAppNotes").value.trim();

          if (!company || !role) {
            alert("Please enter both Company and Role.");
            return;
          }

          applications.unshift({
            id: "app-" + Date.now(),
            company: company,
            role: role,
            date: date,
            status: status,
            notes: notes
          });
          saveApplications();
          closeModal();
          showToast("Application for " + company + " added!");
          renderAll();
        });
      }
    });
  }

  /* ---------------- student profile view & project CRUD ---------------- */
  function renderProfileView(personal, levels, projects, interests) {
    var detailsGrid = document.getElementById("profileDetailsGrid");
    if (!detailsGrid) return;

    var levelNames = { dsa: "DSA", dev: "Development", cs: "Core CS", comm: "Communication", apt: "Aptitude" };
    var levelBadges = Object.keys(levelNames).map(function (k) {
      return '<span class="badge" style="margin-right:4px;">' + levelNames[k] + ': ' + (levels[k] || "—") + '</span>';
    }).join("");

    var fields = [
      { lbl: "Full Name", val: personal.fullName || "—" },
      { lbl: "College", val: personal.collegeName || "—" },
      { lbl: "Degree & Branch", val: (personal.degree || "") + " " + (personal.branch || "") },
      { lbl: "Year & Graduation", val: (personal.yearSem || "") + " • Graduating " + (personal.gradYear || "") },
      { lbl: "Location", val: personal.location || "Not specified" },
      { lbl: "Primary Career Goal", val: getGoal() },
      { lbl: "Weekly Commitment", val: data.hoursPerWeek ? data.hoursPerWeek + " / week" : "Not specified" },
      { lbl: "GitHub Link", val: (data.experience && data.experience.githubLink) ? '<a href="' + escapeAttr(data.experience.githubLink) + '" target="_blank" style="color:var(--marker); border-bottom:1px dashed var(--marker);">' + escapeHtml(data.experience.githubLink) + '</a>' : "Not linked" },
      { lbl: "LinkedIn Link", val: (data.experience && data.experience.linkedinLink) ? '<a href="' + escapeAttr(data.experience.linkedinLink) + '" target="_blank" style="color:var(--marker); border-bottom:1px dashed var(--marker);">' + escapeHtml(data.experience.linkedinLink) + '</a>' : "Not linked" },
      { lbl: "Certifications", val: (data.experience && data.experience.certifications) || "None listed" },
      { lbl: "Preparation Levels", val: levelBadges }
    ];

    detailsGrid.innerHTML = fields.map(function (f) {
      return (
        '<div class="profile-field-item">' +
          '<div class="lbl">' + escapeHtml(f.lbl) + '</div>' +
          '<div class="val">' + f.val + '</div>' +
        '</div>'
      );
    }).join("");

    // Projects list
    var pCount = document.getElementById("profileProjectCount");
    if (pCount) pCount.textContent = projects.length;

    var projListEl = document.getElementById("profileProjectList");
    if (projListEl) {
      if (projects.length === 0) {
        projListEl.innerHTML = '<div style="text-align:center; padding:24px; color:var(--ink-soft); font-style:italic;">No projects added yet. Add a project to increase your project factor (25% of readiness).</div>';
      } else {
        projListEl.innerHTML = projects.map(function (p, idx) {
          return (
            '<div class="project-card-item">' +
              '<div class="project-card-actions">' +
                '<span class="project-action-btn edit-proj-btn" data-idx="' + idx + '">Edit</span>' +
                '<span class="project-action-btn del del-proj-btn" data-idx="' + idx + '">Delete</span>' +
              '</div>' +
              '<div style="font-family:\'Space Grotesk\'; font-weight:700; font-size:15.5px;">' + escapeHtml(p.name || "Untitled Project") + '</div>' +
              '<div style="font-size:12.5px; color:var(--ink-soft); margin:4px 0 8px;"><b>Tech:</b> ' + escapeHtml(p.tech || "—") + '</div>' +
              '<p style="font-size:13.5px; margin:0; color:var(--ink);">' + escapeHtml(p.description || "No description provided.") + '</p>' +
            '</div>'
          );
        }).join("");

        projListEl.querySelectorAll(".del-proj-btn").forEach(function (btn) {
          btn.addEventListener("click", function () {
            var idx = parseInt(btn.dataset.idx, 10);
            var p = projects[idx];
            if (p && confirm("Remove project '" + (p.name || "Untitled") + "'?")) {
              data.experience.projects.splice(idx, 1);
              saveData();
              showToast("Project removed. Readiness score updated.");
              renderAll();
            }
          });
        });

        projListEl.querySelectorAll(".edit-proj-btn").forEach(function (btn) {
          btn.addEventListener("click", function () {
            var idx = parseInt(btn.dataset.idx, 10);
            var p = projects[idx];
            if (!p) return;

            openModal(
              '<h3>Edit Project</h3>' +
              '<div style="margin-top:14px;">' +
                '<div class="field" style="margin-bottom:12px;"><label style="display:block; font-size:13px; margin-bottom:4px;">Project Name</label><input type="text" id="editProjName" value="' + escapeAttr(p.name || '') + '" style="width:100%; border:none; border-bottom:2px solid var(--line); background:transparent; padding:6px 0; font-size:14px;"></div>' +
                '<div class="field" style="margin-bottom:12px;"><label style="display:block; font-size:13px; margin-bottom:4px;">Tech Stack</label><input type="text" id="editProjTech" value="' + escapeAttr(p.tech || '') + '" style="width:100%; border:none; border-bottom:2px solid var(--line); background:transparent; padding:6px 0; font-size:14px;"></div>' +
                '<div class="field" style="margin-bottom:12px;"><label style="display:block; font-size:13px; margin-bottom:4px;">Description</label><textarea id="editProjDesc" style="width:100%; height:70px; border:1px solid var(--line); padding:8px; font-size:13px;">' + escapeHtml(p.description || '') + '</textarea></div>' +
              '</div>' +
              '<div class="modal-actions">' +
                '<button class="btn btn-ghost btn-sm" onclick="document.getElementById(\'modalOverlay\').click();">Cancel</button>' +
                '<button class="btn btn-solid btn-sm" id="saveEditProjBtn">Save Changes</button>' +
              '</div>'
            );

            var saveEditBtn = document.getElementById("saveEditProjBtn");
            if (saveEditBtn) {
              saveEditBtn.addEventListener("click", function () {
                p.name = document.getElementById("editProjName").value.trim();
                p.tech = document.getElementById("editProjTech").value.trim();
                p.description = document.getElementById("editProjDesc").value.trim();
                saveData();
                closeModal();
                showToast("Project updated!");
                renderAll();
              });
            }
          });
        });
      }
    }
  }

  // Add project modal
  var profileAddProjectBtn = document.getElementById("profileAddProjectBtn");
  if (profileAddProjectBtn) {
    profileAddProjectBtn.addEventListener("click", function () {
      openModal(
        '<h3>+ Add Project to Portfolio</h3>' +
        '<div style="margin-top:14px;">' +
          '<div class="field" style="margin-bottom:12px;"><label style="display:block; font-size:13px; margin-bottom:4px;">Project Name</label><input type="text" id="newProjName" placeholder="e.g. Chat application" style="width:100%; border:none; border-bottom:2px solid var(--line); background:transparent; padding:6px 0; font-size:14px;"></div>' +
          '<div class="field" style="margin-bottom:12px;"><label style="display:block; font-size:13px; margin-bottom:4px;">Tech Stack</label><input type="text" id="newProjTech" placeholder="e.g. Node.js, Socket.io, React" style="width:100%; border:none; border-bottom:2px solid var(--line); background:transparent; padding:6px 0; font-size:14px;"></div>' +
          '<div class="field" style="margin-bottom:12px;"><label style="display:block; font-size:13px; margin-bottom:4px;">Description</label><textarea id="newProjDesc" placeholder="Briefly describe what it does and your role" style="width:100%; height:70px; border:1px solid var(--line); padding:8px; font-size:13px;"></textarea></div>' +
        '</div>' +
        '<div class="modal-actions">' +
          '<button class="btn btn-ghost btn-sm" onclick="document.getElementById(\'modalOverlay\').click();">Cancel</button>' +
          '<button class="btn btn-solid btn-sm" id="saveNewProjBtn">Add Project</button>' +
        '</div>'
      );

      var saveNewBtn = document.getElementById("saveNewProjBtn");
      if (saveNewBtn) {
        saveNewBtn.addEventListener("click", function () {
          var name = document.getElementById("newProjName").value.trim();
          var tech = document.getElementById("newProjTech").value.trim();
          var desc = document.getElementById("newProjDesc").value.trim();

          if (!name) {
            alert("Please enter a project name.");
            return;
          }

          if (!data.experience) data.experience = {};
          if (!data.experience.projects) data.experience.projects = [];
          data.experience.projects.push({ name: name, tech: tech, description: desc });
          saveData();
          closeModal();
          showToast("Project added! Readiness recalculated.");
          renderAll();
        });
      }
    });
  }

  /* ---------------- inline add skill on dashboard ---------------- */
  var inlineSkillInput = document.getElementById("inlineSkillInput");
  var inlineSkillBtn = document.getElementById("inlineSkillBtn");

  function handleAddInlineSkill() {
    if (!inlineSkillInput) return;
    var val = inlineSkillInput.value.trim();
    if (!val) return;
    if (userHas(val)) {
      showToast("Skill '" + val + "' already in your profile.");
      inlineSkillInput.value = "";
      return;
    }
    if (!data.skills) data.skills = [];
    data.skills.push(val);
    saveData();
    inlineSkillInput.value = "";
    showToast("Added " + val + " to your skills!");
    renderAll();
  }

  if (inlineSkillBtn) inlineSkillBtn.addEventListener("click", handleAddInlineSkill);
  if (inlineSkillInput) {
    inlineSkillInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAddInlineSkill();
      }
    });
  }

  /* ---------------- recommended actions ---------------- */
  function renderActionCards(projects, levels, gaps) {
    var actionsEl = document.getElementById("actionCards");
    if (!actionsEl) return;

    var githubLink = (data.experience && data.experience.githubLink) || "";
    var actions = [];

    var resumeReadinessSignal = (data.experience && data.experience.projects && data.experience.projects.length > 0) && githubLink;
    actions.push(!resumeReadinessSignal
      ? { title: "Complete your resume pieces", body: "Add your GitHub link and projects to your profile so recruiters can evaluate your technical background directly." }
      : { title: "Keep your resume current", body: "Your resume fundamentals are linked. Make sure your latest project is deployed live." });

    var dsaWeak = (levels.dsa === "Beginner" || levels.dsa === "Intermediate") || gaps.indexOf("DSA") !== -1;
    actions.push(dsaWeak
      ? { title: "Improve DSA skills daily", body: "Data structures & algorithms show up as a gap for your top target role. Consistent daily practice of 1-2 problems compounds fast." }
      : { title: "Keep DSA sharp", body: "You have rated yourself strong here. Maintain speed by taking timed online coding challenges." });

    actions.push(projects.length < 2
      ? { title: "Build one more solid project", body: "Having at least 2 full projects lifts your project-strength factor and gives you plenty to discuss in technical rounds." }
      : { title: "Polish your best project", body: "You have " + projects.length + " projects listed. Add a comprehensive README, clean architecture diagram, and live demo link." });

    actions.push(!githubLink
      ? { title: "Link your GitHub account", body: "A GitHub profile provides undeniable proof of code commits and projects for tech recruiters." }
      : { title: "Keep GitHub active", body: "Your GitHub is linked. Regular commit activity is a strong positive signal." });

    actionsEl.innerHTML = actions.map(function (a) {
      return (
        '<div class="pin-card"><span class="pin-dot"></span>' +
          '<h3>' + escapeHtml(a.title) + '</h3>' +
          '<p>' + escapeHtml(a.body) + '</p>' +
        '</div>'
      );
    }).join("");
  }

  /* ---------------- settings, export, logout, reset ---------------- */
  var exportBtn = document.getElementById("exportDataBtn");
  if (exportBtn) {
    exportBtn.addEventListener("click", function () {
      var exportPayload = {
        profile: data,
        applications: applications,
        roadmapProgress: completedWeeks,
        savedInternships: savedInternships,
        exportedAt: new Date().toISOString()
      };
      var blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: "application/json" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = "pathnotes_career_backup.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast("Profile data exported successfully.");
    });
  }

  function handleLogoutFlow() {
    openModal(
      '<h3>Log out of PathNotes?</h3>' +
      '<p>Are you sure you want to log out? Your career profile, roadmap, and tracked applications will remain securely saved on this computer.</p>' +
      '<div class="modal-actions">' +
        '<button class="btn btn-ghost btn-sm" onclick="document.getElementById(\'modalOverlay\').click();">Cancel</button>' +
        '<button class="btn btn-solid btn-sm" id="confirmLogoutBtn">Log Out</button>' +
      '</div>'
    );

    var confirmLogoutBtn = document.getElementById("confirmLogoutBtn");
    if (confirmLogoutBtn) {
      confirmLogoutBtn.addEventListener("click", function () {
        if (accounts) accounts.logout();
        else localStorage.removeItem("pathnotes_session");
        closeModal();
        window.location.href = "index.html";
      });
    }
  }

  var logoutSidebarBtn = document.getElementById("logoutSidebarBtn");
  if (logoutSidebarBtn) {
    logoutSidebarBtn.addEventListener("click", function (e) {
      e.preventDefault();
      handleLogoutFlow();
    });
  }

  var logoutSettingsBtn = document.getElementById("logoutSettingsBtn");
  if (logoutSettingsBtn) {
    logoutSettingsBtn.addEventListener("click", function () {
      handleLogoutFlow();
    });
  }

  var resetProfileBtn = document.getElementById("resetProfileBtn");
  if (resetProfileBtn) {
    resetProfileBtn.addEventListener("click", function () {
      openModal(
        '<h3 style="color:var(--error);">Reset Profile & Start Over?</h3>' +
        '<p>Are you sure you want to reset your profile? This will permanently erase your onboarding answers, skills, and projects.<br><br><b>This action cannot be undone.</b></p>' +
        '<div class="modal-actions">' +
          '<button class="btn btn-ghost btn-sm" onclick="document.getElementById(\'modalOverlay\').click();">Cancel</button>' +
          '<button class="btn btn-danger btn-sm" id="confirmResetBtn">Yes, Reset Everything</button>' +
        '</div>'
      );

      var confirmResetBtn = document.getElementById("confirmResetBtn");
      if (confirmResetBtn) {
        confirmResetBtn.addEventListener("click", function () {
          if (accounts) accounts.resetCurrent();
          else {
            localStorage.removeItem("pathnotes_onboarding");
            localStorage.removeItem("pathnotes_session");
            localStorage.removeItem("pathnotes_roadmap_progress");
            localStorage.removeItem("pathnotes_onboarding_draft");
          }
          closeModal();
          window.location.href = "onboarding.html?new=1";
        });
      }
    });
  }

  /* ---------------- storage sync helper ---------------- */
  function saveData() {
    try {
      localStorage.setItem("pathnotes_onboarding", JSON.stringify(data));
      if (accounts) accounts.updateProfile(data);
    } catch (e) {
      console.error("Could not save profile data:", e);
    }
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function escapeAttr(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /* ---------------- initial render ---------------- */
  renderAll();

})();

