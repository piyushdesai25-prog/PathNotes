(function () {
  "use strict";

  var raw = null;
  try { raw = localStorage.getItem("pathnotes_onboarding"); } catch (e) { raw = null; }

  var emptyState = document.getElementById("emptyState");
  var content = document.getElementById("dashboardContent");

  if (!raw) {
    emptyState.style.display = "block";
    content.style.display = "none";
    return;
  }

  var data;
  try { data = JSON.parse(raw); } catch (e) {
    emptyState.style.display = "block";
    content.style.display = "none";
    return;
  }

  emptyState.style.display = "none";
  content.style.display = "block";

  /* ---------------- mobile nav ---------------- */
  var sidebar = document.getElementById("sidebar");
  document.getElementById("navToggle").addEventListener("click", function () {
    sidebar.classList.toggle("open");
  });

  /* ---------------- normalize incoming data ---------------- */
  var personal = data.personal || {};
  var skills = data.skills || [];
  var interests = data.careerInterests || [];
  var primaryGoal = data.primaryGoal || "Exploring career options";
  var levels = data.preparationLevels || {};
  var projects = (data.experience && data.experience.projects) || [];
  var githubLink = (data.experience && data.experience.githubLink) || "";
  var linkedinLink = (data.experience && data.experience.linkedinLink) || "";
  var certifications = (data.experience && data.experience.certifications) || "";
  var hoursPerWeek = data.hoursPerWeek || "";

  function norm(s) { return s.trim().toLowerCase(); }
  var userSkillsNorm = skills.map(norm);
  function userHas(skillName) { return userSkillsNorm.indexOf(norm(skillName)) !== -1; }

  /* ---------------- welcome + meta ---------------- */
  var firstName = (personal.fullName || "there").split(" ")[0];
  document.getElementById("welcomeHeading").textContent = "Welcome back, " + firstName;
  document.getElementById("profileChipName").textContent = personal.fullName || "Your profile";
  document.getElementById("avatarInitial").textContent = (personal.fullName || "?").trim().charAt(0).toUpperCase() || "?";

  var metaRow = document.getElementById("metaRow");
  var metaPills = [];
  if (personal.branch) metaPills.push(personal.branch);
  if (personal.yearSem) metaPills.push(personal.yearSem);
  if (primaryGoal) metaPills.push("Goal: " + primaryGoal);
  metaRow.innerHTML = metaPills.map(function (m) { return '<span class="meta-pill">' + escapeHtml(m) + "</span>"; }).join("");

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

  function matchPct(role) {
    var have = role.required.filter(function (r) { return userHas(r); }).length;
    return role.required.length ? Math.round((have / role.required.length) * 100) : 0;
  }
  roles.forEach(function (r) { r.score = matchPct(r); r.interestMatch = interests.indexOf(r.interest) !== -1; });

  roles.sort(function (a, b) {
    if (a.interestMatch !== b.interestMatch) return a.interestMatch ? -1 : 1;
    return b.score - a.score;
  });
  var topRoles = roles.slice(0, 4);
  var primaryRole = topRoles[0] || roles[0];

  var pathList = document.getElementById("pathList");
  pathList.innerHTML = topRoles.map(function (role, i) {
    var why = role.interestMatch ? "Matches your interest in " + role.interest : "Closest match to your current skills";
    return (
      '<div class="path-row">' +
        '<div class="path-rank">' + (i + 1) + '</div>' +
        '<div class="path-info"><div class="name">' + escapeHtml(role.name) + '</div><div class="why">' + escapeHtml(why) + '</div></div>' +
        '<div class="path-score"><div class="pct-label">' + role.score + '% Match</div>' +
          '<div class="mini-bar"><div class="fill" style="width:' + role.score + '%;"></div></div>' +
        '</div>' +
      '</div>'
    );
  }).join("") || '<p class="empty-note">Add a few skills in onboarding to see career matches here.</p>';

  /* ---------------- skill gaps (vs primary role) ---------------- */
  var haveSkillsEl = document.getElementById("haveSkills");
  var gapSkillsEl = document.getElementById("gapSkills");

  haveSkillsEl.innerHTML = skills.length
    ? skills.map(function (s) { return '<span class="tag have">' + escapeHtml(s) + '</span>'; }).join("")
    : '<span class="empty-note">No skills added yet.</span>';

  var gaps = primaryRole ? primaryRole.required.filter(function (r) { return !userHas(r); }) : [];
  gapSkillsEl.innerHTML = gaps.length
    ? gaps.map(function (s) { return '<span class="tag gap">' + escapeHtml(s) + '</span>'; }).join("")
    : '<span class="empty-note">You cover every skill this role needs — nice.</span>';

  /* ---------------- readiness score ---------------- */
  var levelValues = { "Beginner": 33, "Intermediate": 66, "Advanced": 100 };
  var levelKeys = ["dsa", "dev", "cs", "comm", "apt"];
  var levelScores = levelKeys.map(function (k) { return levelValues[levels[k]] || 0; });
  var levelAvg = levelScores.length ? levelScores.reduce(function (a, b) { return a + b; }, 0) / levelScores.length : 0;

  var projectFactor = Math.min(projects.length / 3, 1) * 100;

  var overallReadiness = Math.round((primaryRole ? primaryRole.score : 0) * 0.4 + levelAvg * 0.35 + projectFactor * 0.25);
  overallReadiness = Math.max(0, Math.min(100, overallReadiness));

  document.getElementById("readinessPct").textContent = overallReadiness + "%";
  var radius = 82, circumference = 2 * Math.PI * radius;
  var ringFill = document.getElementById("ringFill");
  ringFill.style.strokeDasharray = circumference;
  ringFill.style.strokeDashoffset = circumference;
  setTimeout(function () {
    ringFill.style.strokeDashoffset = circumference * (1 - overallReadiness / 100);
  }, 100);

  document.getElementById("readinessBlurb").textContent =
    "Built from your match with " + (primaryRole ? primaryRole.name : "your top role") +
    ", your self-rated preparation, and " + projects.length + " project" + (projects.length === 1 ? "" : "s") + " listed.";

  var badgesEl = document.getElementById("readinessBadges");
  var badgeText = [];
  if (interests[0]) badgeText.push(interests[0]);
  if (hoursPerWeek) badgeText.push(hoursPerWeek + "/week");
  if (primaryGoal) badgeText.push(primaryGoal);
  badgesEl.innerHTML = badgeText.map(function (b) { return '<span class="badge">' + escapeHtml(b) + '</span>'; }).join("");

  /* ---------------- roadmap ---------------- */
  var roadmapList = document.getElementById("roadmapList");
  var roadmapItems = buildRoadmap(gaps, levels, projects, interests);
  roadmapList.innerHTML = roadmapItems.map(function (item) {
    return (
      '<div class="roadmap-item">' +
        '<div class="roadmap-week">Week ' + item.week + '</div>' +
        '<div class="roadmap-body"><h3>' + escapeHtml(item.title) + '</h3><p>' + escapeHtml(item.body) + '</p></div>' +
      '</div>'
    );
  }).join("");

  function buildRoadmap(gaps, levels, projects, interests) {
    var items = [];
    var g = gaps.slice();

    var w1 = pickGap(g, ["Git", "GitHub"]) || pickAny(g) || "the basics you're weakest on";
    items.push({ week: 1, title: "Improve " + w1, body: "Spend the week getting comfortable with " + w1 + " through short, daily practice rather than one long session." });

    var dsaWeak = (levels.dsa === "Beginner") || g.indexOf("DSA") !== -1;
    var w2 = dsaWeak ? "arrays and linked lists" : (pickAny(g) || "your next weakest topic");
    items.push({ week: 2, title: "Practice " + w2, body: dsaWeak ? "Work through problems on arrays and linked lists daily — aim for consistency over difficulty this week." : "Focus problem-solving time on " + w2 + " to close the gap before it shows up in an interview." });

    var interestArea = interests[0] || "your target area";
    items.push({ week: 3, title: "Build a project", body: "Put what you practiced into one small project in " + interestArea + " — something you can talk through in an interview." });

    items.push({ week: 4, title: "Deploy and share it", body: "Deploy the project, push clean commits to GitHub, and add it to your resume with a short write-up of what it does." });

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
  var totalFields = 18;
  var filledFields = 0;
  ["fullName","collegeName","degree","branch","yearSem","gradYear","location"].forEach(function (k) { if (personal[k]) filledFields++; });
  if (interests.length) filledFields++;
  if (primaryGoal) filledFields++;
  if (skills.length) filledFields++;
  if (githubLink) filledFields++;
  if (linkedinLink) filledFields++;
  if (certifications) filledFields++;
  if (projects.length) filledFields++;
  if (hoursPerWeek) filledFields++;
  if (levelKeys.every(function (k) { return levels[k]; })) filledFields++;
  if (data.targetCompanyTypes && data.targetCompanyTypes.length) filledFields++;
  var profileCompletion = Math.round((filledFields / totalFields) * 100);

  var resumeSignals = [githubLink, linkedinLink, certifications, projects.length > 0, skills.length >= 5];
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

  /* ---------------- recommended actions ---------------- */
  var actions = [];
  actions.push(resumeReadiness < 70
    ? { title: "Complete your resume", body: "Add the missing pieces — " + missingResumePieces() + " — so recruiters get the full picture." }
    : { title: "Keep your resume current", body: "Your resume basics are covered. Revisit it after your next project or certification." });

  var dsaWeak = (levels.dsa === "Beginner" || levels.dsa === "Intermediate") || gaps.indexOf("DSA") !== -1;
  actions.push(dsaWeak
    ? { title: "Improve DSA skills", body: "This shows up as a gap for your top-matched role — a little daily practice compounds fast." }
    : { title: "Keep DSA sharp", body: "You've rated yourself strong here — a weekly problem or two keeps it that way." });

  actions.push(projects.length < 2
    ? { title: "Build one more project", body: "One more solid project would meaningfully lift your project-strength score." }
    : { title: "Polish your strongest project", body: "You've got " + projects.length + " projects listed — make sure your best one has a clear write-up." });

  actions.push(!githubLink
    ? { title: "Update your GitHub profile", body: "Add a GitHub link in your profile so your projects and commits are easy to find." }
    : { title: "Keep GitHub active", body: "Your GitHub is linked — regular commits keep it a useful signal for recruiters." });

  document.getElementById("actionCards").innerHTML = actions.map(function (a) {
    return (
      '<div class="pin-card"><span class="pin-dot"></span>' +
        '<h3>' + escapeHtml(a.title) + '</h3>' +
        '<p>' + escapeHtml(a.body) + '</p>' +
      '</div>'
    );
  }).join("");

  function missingResumePieces() {
    var missing = [];
    if (!githubLink) missing.push("GitHub link");
    if (!linkedinLink) missing.push("LinkedIn link");
    if (!certifications) missing.push("certifications");
    if (!projects.length) missing.push("at least one project");
    return missing.length ? missing.join(", ") : "a few more details";
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
})();
