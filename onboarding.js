(function () {
  "use strict";

  var steps = ["1", "2", "3", "4", "5", "6", "final"];
  var stepTitles = {
    1: "Step 1 of 6 — Personal & academic info",
    2: "Step 2 of 6 — Career interests",
    3: "Step 3 of 6 — Technical skills",
    4: "Step 4 of 6 — Experience & projects",
    5: "Step 5 of 6 — Current preparation level",
    6: "Step 6 of 6 — Final goals",
    final: "All done — your profile is ready"
  };
  var current = 0; // index into steps

  var progressLabel = document.getElementById("progressLabel");
  var progressSegs = document.querySelectorAll(".progress-seg");
  var backBtn = document.getElementById("backBtn");
  var continueBtn = document.getElementById("continueBtn");
  var generateBtn = document.getElementById("generateBtn");

  var projectCount = 0;
  var projects = [];
  var customSkills = [];

  /* ---------- generic single/multi select chip toggles ---------- */
  function wireMultiToggle(container) {
    if (!container) return;
    container.querySelectorAll("li").forEach(function (li) {
      li.addEventListener("click", function () {
        li.classList.toggle("on");
        clearFieldError(container.closest(".field"));
      });
    });
  }

  function wireSingleToggle(container) {
    if (!container) return;
    container.querySelectorAll("li").forEach(function (li) {
      li.addEventListener("click", function () {
        container.querySelectorAll("li").forEach(function (o) { o.classList.remove("on"); });
        li.classList.add("on");
        clearFieldError(container.closest(".field"));
      });
    });
  }

  wireMultiToggle(document.getElementById("careerInterests"));
  wireSingleToggle(document.getElementById("primaryGoal"));
  wireMultiToggle(document.getElementById("companyTypes"));
  wireSingleToggle(document.getElementById("hoursPerWeek"));
  document.querySelectorAll(".skill-chip-list:not(#customSkillList)").forEach(wireMultiToggle);

  /* ---------- preparation levels ---------- */
  document.querySelectorAll(".level-row").forEach(function (row) {
    var opts = row.querySelectorAll(".level-opt");
    opts.forEach(function (opt) {
      opt.addEventListener("click", function () {
        opts.forEach(function (o) { o.classList.remove("on"); });
        opt.classList.add("on");
        clearFieldError(document.getElementById("levelsError"));
      });
    });
  });

  /* ---------- custom skills ---------- */
  var customSkillList = document.getElementById("customSkillList");
  var customSkillInput = document.getElementById("customSkillInput");
  document.getElementById("addSkillBtn").addEventListener("click", addCustomSkill);
  customSkillInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") { e.preventDefault(); addCustomSkill(); }
  });
  function addCustomSkill() {
    var val = customSkillInput.value.trim();
    if (!val) return;
    if (customSkills.indexOf(val) !== -1) { customSkillInput.value = ""; return; }
    customSkills.push(val);
    var li = document.createElement("li");
    li.textContent = val;
    li.classList.add("on");
    li.addEventListener("click", function () { li.classList.toggle("on"); });
    customSkillList.appendChild(li);
    customSkillInput.value = "";
    clearFieldError(document.getElementById("skillsError"));
  }

  /* ---------- projects ---------- */
  var projectList = document.getElementById("projectList");
  document.getElementById("addProjectBtn").addEventListener("click", addProject);

  function addProject() {
    projectCount++;
    var id = projectCount;
    var item = document.createElement("div");
    item.className = "project-item";
    item.dataset.id = id;
    item.innerHTML =
      '<span class="remove-project">Remove</span>' +
      '<div class="field"><label>Project name</label><input type="text" class="proj-name" placeholder="e.g. Expense tracker app"></div>' +
      '<div class="field"><label>Technology used</label><input type="text" class="proj-tech" placeholder="e.g. React, Node.js, MongoDB"></div>' +
      '<div class="field"><label>Short description</label><textarea class="proj-desc" placeholder="One or two lines on what it does"></textarea></div>';
    projectList.appendChild(item);
    item.querySelector(".remove-project").addEventListener("click", function () {
      projectList.removeChild(item);
    });
  }
  // start with one project row so the step doesn't look empty
  addProject();

  /* ---------- field error helpers ---------- */
  function showFieldError(input, msgEl) {
    if (input) input.classList.add("field-error");
    if (msgEl) msgEl.classList.add("show");
  }
  function clearFieldError(scope) {
    if (!scope) return;
    var msg = scope.classList && scope.classList.contains("field-error-msg") ? scope : scope.querySelector(".field-error-msg");
    if (msg) msg.classList.remove("show");
    var input = scope.querySelector && scope.querySelector("input, select");
    if (input) input.classList.remove("field-error");
  }
  function clearAllErrorsInStep(stepEl) {
    stepEl.querySelectorAll(".field-error-msg").forEach(function (m) { m.classList.remove("show"); });
    stepEl.querySelectorAll(".field-error").forEach(function (i) { i.classList.remove("field-error"); });
  }

  document.querySelectorAll('.onboard-shell input, .onboard-shell select').forEach(function (el) {
    el.addEventListener("input", function () {
      el.classList.remove("field-error");
      var msg = el.closest(".field") && el.closest(".field").querySelector(".field-error-msg");
      if (msg) msg.classList.remove("show");
    });
  });

  /* ---------- validation per step ---------- */
  function validateStep(stepKey) {
    var stepEl = document.querySelector('.step-content[data-step="' + stepKey + '"]');
    clearAllErrorsInStep(stepEl);
    var ok = true;

    if (stepKey === "1") {
      var required = ["fullName", "collegeName", "degree", "branch", "yearSem", "gradYear"];
      required.forEach(function (id) {
        var el = document.getElementById(id);
        if (!el.value || !el.value.trim()) {
          showFieldError(el, el.closest(".field").querySelector(".field-error-msg"));
          ok = false;
        }
      });
    }

    if (stepKey === "2") {
      var interestsOn = document.querySelectorAll("#careerInterests li.on");
      if (interestsOn.length === 0) {
        document.getElementById("interestsError").classList.add("show");
        ok = false;
      }
      var goalOn = document.querySelectorAll("#primaryGoal li.on");
      if (goalOn.length === 0) {
        document.getElementById("goalError").classList.add("show");
        ok = false;
      }
    }

    if (stepKey === "3") {
      var anySkill = document.querySelectorAll(".skill-chip-list li.on").length;
      if (anySkill === 0) {
        document.getElementById("skillsError").classList.add("show");
        ok = false;
      }
    }

    if (stepKey === "5") {
      var rows = document.querySelectorAll(".level-row");
      var allRated = true;
      rows.forEach(function (row) {
        if (!row.querySelector(".level-opt.on")) allRated = false;
      });
      if (!allRated) {
        document.getElementById("levelsError").classList.add("show");
        ok = false;
      }
      var hoursOn = document.querySelectorAll("#hoursPerWeek li.on");
      if (hoursOn.length === 0) {
        document.getElementById("hoursError").classList.add("show");
        ok = false;
      }
    }

    if (stepKey === "6") {
      var companyOn = document.querySelectorAll("#companyTypes li.on");
      if (companyOn.length === 0) {
        document.getElementById("companyError").classList.add("show");
        ok = false;
      }
    }

    return ok;
  }

  /* ---------- step navigation ---------- */
  function showStep(index) {
    var key = steps[index];
    document.querySelectorAll(".step-content").forEach(function (el) {
      el.classList.toggle("active", el.dataset.step === key);
    });
    progressLabel.textContent = stepTitles[key];

    progressSegs.forEach(function (seg, i) {
      seg.classList.remove("current", "done");
      if (i < index) seg.classList.add("done");
      else if (i === index) { seg.classList.add("current"); seg.querySelector(".fill").style.width = "50%"; }
      else seg.querySelector(".fill").style.width = "0%";
    });

    backBtn.style.visibility = index === 0 ? "hidden" : "visible";

    if (key === "final") {
      continueBtn.style.display = "none";
      generateBtn.style.display = "inline-block";
      renderSummary();
    } else {
      continueBtn.style.display = "inline-block";
      generateBtn.style.display = "none";
      continueBtn.textContent = index === steps.length - 2 ? "See my profile" : "Continue";
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  backBtn.addEventListener("click", function () {
    if (current > 0) {
      current--;
      showStep(current);
    }
  });

  continueBtn.addEventListener("click", function () {
    var key = steps[current];
    if (!validateStep(key)) return;
    if (current < steps.length - 1) {
      current++;
      showStep(current);
    }
  });

  generateBtn.addEventListener("click", function () {
    saveAndRedirect();
  });

  /* ---------- data collection ---------- */
  function collectData() {
    function onValues(sel) {
      return Array.prototype.map.call(document.querySelectorAll(sel + " li.on"), function (li) { return li.textContent.trim(); });
    }
    function onValue(sel) {
      var el = document.querySelector(sel + " li.on");
      return el ? el.textContent.trim() : "";
    }

    var levels = {};
    document.querySelectorAll(".level-row").forEach(function (row) {
      var key = row.dataset.levelKey;
      var opt = row.querySelector(".level-opt.on");
      levels[key] = opt ? opt.textContent.trim() : "";
    });

    var projectData = [];
    projectList.querySelectorAll(".project-item").forEach(function (item) {
      var name = item.querySelector(".proj-name").value.trim();
      var tech = item.querySelector(".proj-tech").value.trim();
      var desc = item.querySelector(".proj-desc").value.trim();
      if (name || tech || desc) projectData.push({ name: name, tech: tech, description: desc });
    });

    var skills = Array.prototype.map.call(
      document.querySelectorAll(".skill-chip-list li.on"),
      function (li) { return li.textContent.trim(); }
    );

    return {
      personal: {
        fullName: document.getElementById("fullName").value.trim(),
        collegeName: document.getElementById("collegeName").value.trim(),
        degree: document.getElementById("degree").value,
        branch: document.getElementById("branch").value.trim(),
        yearSem: document.getElementById("yearSem").value,
        gradYear: document.getElementById("gradYear").value,
        location: document.getElementById("location").value.trim()
      },
      careerInterests: onValues("#careerInterests"),
      primaryGoal: onValue("#primaryGoal"),
      skills: skills,
      experience: {
        internshipExp: document.getElementById("internshipExp").value,
        hackathons: document.getElementById("hackathons").value,
        certifications: document.getElementById("certifications").value.trim(),
        githubLink: document.getElementById("githubLink").value.trim(),
        linkedinLink: document.getElementById("linkedinLink").value.trim(),
        projects: projectData
      },
      preparationLevels: levels,
      hoursPerWeek: onValue("#hoursPerWeek"),
      targetCompanyTypes: onValues("#companyTypes"),
      completedAt: new Date().toISOString()
    };
  }

  function renderSummary() {
    var data = collectData();
    document.getElementById("sumInterests").textContent = data.careerInterests.length;
    document.getElementById("sumSkills").textContent = data.skills.length;
    document.getElementById("sumProjects").textContent = data.experience.projects.length;
    document.getElementById("sumGoal").textContent = data.primaryGoal || "—";
  }

  function saveAndRedirect() {
    var data = collectData();
    try {
      localStorage.setItem("pathnotes_onboarding", JSON.stringify(data));
    } catch (e) {
      console.error("Could not save onboarding data:", e);
    }
    window.location.href = "dashboard.html";
  }

  showStep(current);
})();
