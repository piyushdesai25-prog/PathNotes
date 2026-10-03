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
  var exitLink = document.getElementById("exitLink");
  var editBanner = document.getElementById("editBanner");

  var projectCount = 0;
  var customSkills = [];

  var urlParams = new URLSearchParams(window.location.search);
  var isEditMode = urlParams.get("mode") === "edit";
  var isNewUser = urlParams.get("new") === "1" || !isEditMode;
  var accounts = window.PathNotesAccounts;
  if (isEditMode) {
    if (editBanner) editBanner.style.display = "block";
    if (exitLink) {
      exitLink.textContent = "← Back to dashboard";
      exitLink.href = "dashboard.html";
    }
  }

  /* ---------- generic single/multi select chip toggles ---------- */
  function wireMultiToggle(container) {
    if (!container) return;
    container.querySelectorAll("li").forEach(function (li) {
      li.addEventListener("click", function () {
        li.classList.toggle("on");
        clearFieldError(container.closest(".field"));
        saveDraftDebounced();
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
        saveDraftDebounced();
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
        saveDraftDebounced();
      });
    });
  });

  /* ---------- custom skills ---------- */
  var customSkillList = document.getElementById("customSkillList");
  var customSkillInput = document.getElementById("customSkillInput");
  var addSkillBtn = document.getElementById("addSkillBtn");
  if (addSkillBtn) addSkillBtn.addEventListener("click", addCustomSkill);
  if (customSkillInput) {
    customSkillInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); addCustomSkill(); }
    });
  }

  function addCustomSkillWithVal(val) {
    val = (val || "").trim();
    if (!val) return;
    if (customSkills.indexOf(val) !== -1) return;
    customSkills.push(val);
    var li = document.createElement("li");
    li.textContent = val;
    li.classList.add("on");
    li.addEventListener("click", function () {
      li.classList.toggle("on");
      saveDraftDebounced();
    });
    if (customSkillList) customSkillList.appendChild(li);
  }

  function addCustomSkill() {
    var val = customSkillInput.value.trim();
    if (!val) return;
    addCustomSkillWithVal(val);
    customSkillInput.value = "";
    clearFieldError(document.getElementById("skillsError"));
    saveDraftDebounced();
  }

  /* ---------- projects ---------- */
  var projectList = document.getElementById("projectList");
  var addProjectBtn = document.getElementById("addProjectBtn");
  if (addProjectBtn) addProjectBtn.addEventListener("click", function () { addProject(); });

  function addProject(initialData) {
    projectCount++;
    var id = projectCount;
    var item = document.createElement("div");
    item.className = "project-item";
    item.dataset.id = id;

    var initName = (initialData && initialData.name) || "";
    var initTech = (initialData && initialData.tech) || "";
    var initDesc = (initialData && initialData.description) || "";

    item.innerHTML =
      '<span class="remove-project">Remove</span>' +
      '<div class="field"><label>Project name</label><input type="text" class="proj-name" placeholder="e.g. Expense tracker app" value="' + escapeAttr(initName) + '"></div>' +
      '<div class="field"><label>Technology used</label><input type="text" class="proj-tech" placeholder="e.g. React, Node.js, MongoDB" value="' + escapeAttr(initTech) + '"></div>' +
      '<div class="field"><label>Short description</label><textarea class="proj-desc" placeholder="One or two lines on what it does">' + escapeHtml(initDesc) + '</textarea></div>';

    if (projectList) projectList.appendChild(item);

    item.querySelectorAll("input, textarea").forEach(function (input) {
      input.addEventListener("input", saveDraftDebounced);
    });

    item.querySelector(".remove-project").addEventListener("click", function () {
      var nameVal = item.querySelector(".proj-name").value.trim();
      var techVal = item.querySelector(".proj-tech").value.trim();
      var descVal = item.querySelector(".proj-desc").value.trim();
      if (nameVal || techVal || descVal) {
        if (!confirm("Are you sure you want to remove this project?")) {
          return;
        }
      }
      if (projectList && item.parentNode === projectList) {
        projectList.removeChild(item);
        saveDraftDebounced();
      }
    });
  }

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
      generateBtn.textContent = isEditMode ? "Save changes & return to dashboard" : "Generate my career dashboard";
      renderSummary();
    } else {
      continueBtn.style.display = "inline-block";
      generateBtn.style.display = "none";
      continueBtn.textContent = index === steps.length - 2 ? "See my profile summary" : "Continue";
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

  if (exitLink) {
    exitLink.addEventListener("click", function (e) {
      saveDraft();
    });
  }

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
    if (projectList) {
      projectList.querySelectorAll(".project-item").forEach(function (item) {
        var name = (item.querySelector(".proj-name").value || "").trim();
        var tech = (item.querySelector(".proj-tech").value || "").trim();
        var desc = (item.querySelector(".proj-desc").value || "").trim();
        if (name || tech || desc) projectData.push({ name: name, tech: tech, description: desc });
      });
    }

    var skills = Array.prototype.map.call(
      document.querySelectorAll(".skill-chip-list li.on"),
      function (li) { return li.textContent.trim(); }
    );

    var getVal = function (id) {
      var el = document.getElementById(id);
      return el ? el.value.trim() : "";
    };

    return {
      personal: {
        fullName: getVal("fullName"),
        collegeName: getVal("collegeName"),
        degree: getVal("degree"),
        branch: getVal("branch"),
        yearSem: getVal("yearSem"),
        gradYear: getVal("gradYear"),
        location: getVal("location")
      },
      careerInterests: onValues("#careerInterests"),
      primaryGoal: onValue("#primaryGoal"),
      skills: skills,
      experience: {
        internshipExp: getVal("internshipExp") || "None",
        hackathons: getVal("hackathons") || "0",
        certifications: getVal("certifications"),
        githubLink: getVal("githubLink"),
        linkedinLink: getVal("linkedinLink"),
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
    var setTxt = function (id, txt) {
      var el = document.getElementById(id);
      if (el) el.textContent = txt;
    };
    setTxt("sumInterests", data.careerInterests.length);
    setTxt("sumSkills", data.skills.length);
    setTxt("sumProjects", data.experience.projects.length);
    setTxt("sumGoal", data.primaryGoal || "—");
  }

  /* ---------- persistence & drafts ---------- */
  var draftTimer = null;
  function saveDraft() {
    try {
      var data = collectData();
      localStorage.setItem("pathnotes_onboarding_draft", JSON.stringify(data));
    } catch (e) {
      console.warn("Could not save draft:", e);
    }
  }

  function saveDraftDebounced() {
    clearTimeout(draftTimer);
    draftTimer = setTimeout(saveDraft, 400);
  }

  function populateForm(saved) {
    if (!saved) return;
    try {
      // Step 1: Personal
      var p = saved.personal || {};
      var setVal = function (id, v) {
        var el = document.getElementById(id);
        if (el && v !== undefined && v !== null) el.value = v;
      };
      setVal("fullName", p.fullName);
      setVal("collegeName", p.collegeName);
      setVal("degree", p.degree);
      setVal("branch", p.branch);
      setVal("yearSem", p.yearSem);
      setVal("gradYear", p.gradYear);
      setVal("location", p.location);

      // Step 2: Interests & goal
      var interests = saved.careerInterests || [];
      document.querySelectorAll("#careerInterests li").forEach(function (li) {
        if (interests.indexOf(li.textContent.trim()) !== -1) {
          li.classList.add("on");
        }
      });
      if (saved.primaryGoal) {
        document.querySelectorAll("#primaryGoal li").forEach(function (li) {
          if (li.textContent.trim() === saved.primaryGoal) {
            li.classList.add("on");
          }
        });
      }

      // Step 3: Skills
      var skills = saved.skills || [];
      var presetMap = {};
      document.querySelectorAll(".skill-chip-list:not(#customSkillList) li").forEach(function (li) {
        var txt = li.textContent.trim();
        presetMap[txt] = li;
        if (skills.indexOf(txt) !== -1) {
          li.classList.add("on");
        }
      });
      // Add custom skills that were saved but aren't in preset
      skills.forEach(function (s) {
        if (!presetMap[s]) {
          addCustomSkillWithVal(s);
        }
      });

      // Step 4: Experience & projects
      var exp = saved.experience || {};
      setVal("internshipExp", exp.internshipExp);
      setVal("hackathons", exp.hackathons);
      setVal("certifications", exp.certifications);
      setVal("githubLink", exp.githubLink);
      setVal("linkedinLink", exp.linkedinLink);

      // Rebuild projects list
      if (projectList) {
        projectList.innerHTML = "";
        var projs = exp.projects || [];
        if (projs.length > 0) {
          projs.forEach(function (proj) {
            addProject(proj);
          });
        } else {
          addProject();
        }
      }

      // Step 5: Levels & hours
      var levels = saved.preparationLevels || {};
      document.querySelectorAll(".level-row").forEach(function (row) {
        var key = row.dataset.levelKey;
        var savedLevel = levels[key];
        if (savedLevel) {
          row.querySelectorAll(".level-opt").forEach(function (opt) {
            if (opt.textContent.trim() === savedLevel) opt.classList.add("on");
          });
        }
      });
      if (saved.hoursPerWeek) {
        document.querySelectorAll("#hoursPerWeek li").forEach(function (li) {
          if (li.textContent.trim() === saved.hoursPerWeek) li.classList.add("on");
        });
      }

      // Step 6: Target companies
      var companies = saved.targetCompanyTypes || [];
      document.querySelectorAll("#companyTypes li").forEach(function (li) {
        if (companies.indexOf(li.textContent.trim()) !== -1) {
          li.classList.add("on");
        }
      });

    } catch (err) {
      console.error("Error populating onboarding form:", err);
    }
  }

  function saveAndRedirect() {
    var data = collectData();
    try {
      if (accounts) {
        if (isEditMode && accounts.getCurrentUserId()) {
          accounts.updateProfile(data);
        } else {
          accounts.create(data);
        }
      } else {
        localStorage.setItem("pathnotes_onboarding", JSON.stringify(data));
        localStorage.setItem("pathnotes_session", JSON.stringify({
          loggedIn: true,
          user: data.personal.fullName || "Student",
          lastLogin: new Date().toISOString()
        }));
      }
      localStorage.removeItem("pathnotes_onboarding_draft");
    } catch (e) {
      console.error("Could not save onboarding data:", e);
    }
    window.location.href = "dashboard.html";
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

  // Initialization: edit uses the signed-in account; new-user mode starts blank.
  var existingProfile = null;
  if (isEditMode && accounts) {
    var currentAccount = accounts.getCurrentUser();
    if (currentAccount) existingProfile = currentAccount.profile;
  }
  if (!existingProfile && isEditMode) {
    try {
      var rawSaved = localStorage.getItem("pathnotes_onboarding");
      if (rawSaved) existingProfile = JSON.parse(rawSaved);
    } catch (e) {}
  }

  var existingDraft = null;
  try {
    var rawDraft = localStorage.getItem("pathnotes_onboarding_draft");
    if (rawDraft) existingDraft = JSON.parse(rawDraft);
  } catch (e) {}

  if (isEditMode && existingProfile) {
    populateForm(existingProfile);
  } else if (!isNewUser && existingDraft) {
    populateForm(existingDraft);
  } else {
    // start with one blank project row
    addProject();
  }

  showStep(current);
})();
