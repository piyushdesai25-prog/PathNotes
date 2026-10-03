(function () {
  'use strict';

  var USERS_KEY = 'pathnotes_users_v2';
  var SESSION_KEY = 'pathnotes_session';
  var PROFILE_KEY = 'pathnotes_onboarding';
  var APPS_KEY = 'pathnotes_applications';
  var ROADMAP_KEY = 'pathnotes_roadmap_progress';

  function safeParse(value, fallback) {
    try { return value ? JSON.parse(value) : fallback; } catch (e) { return fallback; }
  }

  function readUsers() {
    var users = safeParse(localStorage.getItem(USERS_KEY), null);
    return users && typeof users === 'object' ? users : {};
  }

  function writeUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  function profileName(profile) {
    return profile && profile.personal && profile.personal.fullName
      ? profile.personal.fullName.trim()
      : 'Student';
  }

  function makeId(name) {
    var base = String(name || 'student').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 28) || 'student';
    var id = base;
    var users = readUsers();
    var n = 2;
    while (users[id]) id = base + '-' + n++;
    return id;
  }

  function normalizeUser(id, user) {
    user = user || {};
    return {
      id: id,
      profile: user.profile || {},
      applications: Array.isArray(user.applications) ? user.applications : [],
      roadmapProgress: Array.isArray(user.roadmapProgress) ? user.roadmapProgress : [],
      savedInternships: Array.isArray(user.savedInternships) ? user.savedInternships : [],
      createdAt: user.createdAt || new Date().toISOString(),
      lastLogin: user.lastLogin || null
    };
  }

  function migrateLegacy() {
    var users = readUsers();
    if (Object.keys(users).length) return users;

    var profile = safeParse(localStorage.getItem(PROFILE_KEY), null);
    if (!profile || !profile.personal || !profile.personal.fullName) return users;

    var id = makeId(profile.personal.fullName);
    var legacyApps = safeParse(localStorage.getItem(APPS_KEY), []);
    var demoIds = ["app-1", "app-2"];
    if (Array.isArray(legacyApps) && legacyApps.length === 2 && legacyApps.every(function (a) { return demoIds.indexOf(a.id) !== -1; })) legacyApps = [];
    users[id] = normalizeUser(id, {
      profile: profile,
      applications: legacyApps,
      roadmapProgress: safeParse(localStorage.getItem(ROADMAP_KEY), []),
      savedInternships: [],
      createdAt: new Date().toISOString()
    });
    writeUsers(users);
    return users;
  }

  function getSession() {
    return safeParse(localStorage.getItem(SESSION_KEY), null);
  }

  function getCurrentUserId() {
    var session = getSession();
    return session && session.loggedIn ? session.userId : null;
  }

  function getCurrentUser() {
    var users = migrateLegacy();
    var id = getCurrentUserId();
    return id && users[id] ? normalizeUser(id, users[id]) : null;
  }

  function syncLegacy(user) {
    if (!user) return;
    localStorage.setItem(PROFILE_KEY, JSON.stringify(user.profile || {}));
    localStorage.setItem(APPS_KEY, JSON.stringify(user.applications || []));
    localStorage.setItem(ROADMAP_KEY, JSON.stringify(user.roadmapProgress || []));
  }

  function login(id) {
    var users = migrateLegacy();
    if (!users[id]) return false;
    var user = normalizeUser(id, users[id]);
    user.lastLogin = new Date().toISOString();
    users[id] = user;
    writeUsers(users);
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      loggedIn: true,
      userId: id,
      user: profileName(user.profile),
      lastLogin: user.lastLogin
    }));
    syncLegacy(user);
    return true;
  }

  function create(profile) {
    var users = migrateLegacy();
    var id = makeId(profileName(profile));
    var user = normalizeUser(id, { profile: profile, applications: [], roadmapProgress: [] });
    user.lastLogin = new Date().toISOString();
    users[id] = user;
    writeUsers(users);
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      loggedIn: true,
      userId: id,
      user: profileName(profile),
      lastLogin: user.lastLogin
    }));
    syncLegacy(user);
    return id;
  }

  function updateProfile(profile) {
    var users = migrateLegacy();
    var id = getCurrentUserId();
    if (!id || !users[id]) return false;
    users[id] = normalizeUser(id, {
      profile: profile,
      applications: users[id].applications,
      roadmapProgress: users[id].roadmapProgress,
      savedInternships: users[id].savedInternships,
      createdAt: users[id].createdAt,
      lastLogin: users[id].lastLogin
    });
    writeUsers(users);
    syncLegacy(users[id]);
    return true;
  }

  function updateApplications(applications) {
    var users = migrateLegacy();
    var id = getCurrentUserId();
    if (!id || !users[id]) return false;
    users[id].applications = Array.isArray(applications) ? applications : [];
    writeUsers(users);
    localStorage.setItem(APPS_KEY, JSON.stringify(users[id].applications));
    return true;
  }

  function updateRoadmap(progress) {
    var users = migrateLegacy();
    var id = getCurrentUserId();
    if (!id || !users[id]) return false;
    users[id].roadmapProgress = Array.isArray(progress) ? progress : [];
    writeUsers(users);
    localStorage.setItem(ROADMAP_KEY, JSON.stringify(users[id].roadmapProgress));
    return true;
  }

  function updateSavedInternships(items) {
    var users = migrateLegacy();
    var id = getCurrentUserId();
    if (!id || !users[id]) return false;
    users[id].savedInternships = Array.isArray(items) ? items : [];
    writeUsers(users);
    return true;
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
  }

  function resetCurrent() {
    var users = migrateLegacy();
    var id = getCurrentUserId();
    if (!id || !users[id]) return false;
    delete users[id];
    writeUsers(users);
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(PROFILE_KEY);
    localStorage.removeItem(APPS_KEY);
    localStorage.removeItem(ROADMAP_KEY);
    localStorage.removeItem('pathnotes_onboarding_draft');
    return true;
  }

  function listUsers() {
    var users = migrateLegacy();
    return Object.keys(users).map(function (id) {
      var user = normalizeUser(id, users[id]);
      return { id: id, name: profileName(user.profile), profile: user.profile, lastLogin: user.lastLogin };
    });
  }

  window.PathNotesAccounts = {
    USERS_KEY: USERS_KEY,
    migrateLegacy: migrateLegacy,
    getSession: getSession,
    getCurrentUserId: getCurrentUserId,
    getCurrentUser: getCurrentUser,
    listUsers: listUsers,
    login: login,
    create: create,
    updateProfile: updateProfile,
    updateApplications: updateApplications,
    updateRoadmap: updateRoadmap,
    updateSavedInternships: updateSavedInternships,
    logout: logout,
    resetCurrent: resetCurrent,
    syncLegacy: syncLegacy
  };
})();
