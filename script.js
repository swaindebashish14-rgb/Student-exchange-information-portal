/* ==========================================================================
   script.js  -  Passage: Student Exchange Information Portal

   One script is shared by every page. Each page's <body> has a
   data-page="..." attribute, and the code at the very bottom of this file
   runs the function that belongs to that page.

   Sections
     1. Settings
     2. Storage helpers (localStorage)
     3. Small helper functions (dates, text, eligibility)
     4. Shared page parts (toast, nav counter, ticket card, save button)
     5. Home page
     6. Programs page (search, filters, sorting)
     7. Program detail page (eligibility, document checklist, apply)
     8. Saved page
     9. My applications page
    10. Admin page (login, add/edit/delete programs, update statuses)
    11. Start-up
   ========================================================================== */


/* ---------- 1. Settings ---------------------------------------------------- */

// Demo login for the admin page. A real site would check this on a server;
// anything written in front-end JavaScript can be read by any visitor.
const ADMIN_USER = "admin";
const ADMIN_PASS = "exchange@123";

// Names of the things we keep in the browser's localStorage.
const KEYS = {
  programs: "passage_programs",   // list of all programs (sample + admin changes)
  saved: "passage_saved",         // ids of programs the student has saved
  apps: "passage_apps",           // applications: { programId: { status, updated } }
  checks: "passage_checks",       // ticked documents: { programId: [document names] }
  profile: "passage_profile"      // student's CGPA and semesters completed
};

// Student accounts (a list) and the id of the student logged in (kept until they log out).
const STUDENTS_KEY = "passage_students";
const STUDENT_SESSION = "passage_student";

// The order an application moves through.
const STATUSES = ["Draft", "Submitted", "Under review", "Accepted", "Rejected"];


/* ---------- 2. Storage helpers --------------------------------------------- */

// Reads a value from localStorage. If nothing is stored (or it is damaged),
// the fallback is returned instead.
function readStore(key, fallback) {
  try {
    const text = localStorage.getItem(key);
    return text ? JSON.parse(text) : fallback;
  } catch (error) {
    return fallback;
  }
}

// Writes a value to localStorage as text.
function writeStore(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    showToast("Your browser blocked saving. Allow site data and try again.");
  }
}

// Programs: the first visit copies the sample data into localStorage so the
// admin page can change it later.
function getPrograms() {
  let list = readStore(KEYS.programs, null);
  if (!list) {
    list = DEFAULT_PROGRAMS;
    writeStore(KEYS.programs, list);
  }
  return list;
}
function setPrograms(list) { writeStore(KEYS.programs, list); }
function findProgram(id) { return getPrograms().find(function (p) { return p.id === id; }); }

// Each student has their own saved list, applications, ticked documents and
// details. Their data is stored under the same name plus ":" and their id,
// for example "passage_saved:s1700000000000". Passing an id lets the admin page
// read another student's data; leaving it out means "the student logged in now".
function currentStudentId() {
  try { return localStorage.getItem(STUDENT_SESSION) || null; } catch (error) { return null; }
}
function keyFor(name, studentId) {
  const id = studentId === undefined ? currentStudentId() : studentId;
  return id ? KEYS[name] + ":" + id : KEYS[name];
}

// Student accounts.
function getStudents() { return readStore(STUDENTS_KEY, []); }
function setStudents(list) { writeStore(STUDENTS_KEY, list); }
function currentStudent() {
  const id = currentStudentId();
  return getStudents().find(function (s) { return s.id === id; }) || null;
}

// Saved programs (a list of ids).
function getSaved(studentId) { return readStore(keyFor("saved", studentId), []); }
function setSaved(list, studentId) { writeStore(keyFor("saved", studentId), list); }
function toggleSaved(id) {
  const saved = getSaved();
  const index = saved.indexOf(id);
  if (index === -1) { saved.push(id); } else { saved.splice(index, 1); }
  setSaved(saved);
  return index === -1;            // true if the program is saved now
}

// Applications (an object keyed by program id) and ticked documents.
function getApps(studentId) { return readStore(keyFor("apps", studentId), {}); }
function setApps(apps, studentId) { writeStore(keyFor("apps", studentId), apps); }
function getChecks(studentId) { return readStore(keyFor("checks", studentId), {}); }
function setChecks(checks, studentId) { writeStore(keyFor("checks", studentId), checks); }

// The student's own details, used for the eligibility check.
function getProfile() { return readStore(keyFor("profile"), { cgpa: null, semester: null }); }
function setProfile(profile) { writeStore(keyFor("profile"), profile); }

// Every place student data can live: each student, plus the logged-out copy.
function allStudentIds() { return getStudents().map(function (s) { return s.id; }).concat([null]); }


/* ---------- 3. Small helper functions -------------------------------------- */

// Shortcuts for finding elements.
function $(selector, root) { return (root || document).querySelector(selector); }
function $$(selector, root) { return Array.from((root || document).querySelectorAll(selector)); }

// Makes text safe to place inside HTML, so a program name like <b> cannot
// break the page.
function esc(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// "2026-11-20" -> a Date object for that day (midnight, local time).
function parseDate(text) {
  const parts = text.split("-").map(Number);
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

// How many days from today until the deadline (negative if it has passed).
function daysLeft(deadline) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((parseDate(deadline) - today) / 86400000);
}

function formatDate(text) {
  return parseDate(text).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function deadlineLabel(days) {
  if (days < 0) { return "Closed"; }
  if (days === 0) { return "Closes today"; }
  if (days === 1) { return "1 day left"; }
  return days + " days left";
}

// "" -> null, "7.5" -> 7.5
function toNumber(value) {
  return value === "" || value === null ? null : Number(value);
}

// Unique, sorted values (used to fill the country and field dropdowns).
function uniqueSorted(values) {
  return Array.from(new Set(values)).sort();
}

// Adds <option> tags to a <select>, keeping the first "All ..." option.
function fillSelect(select, values, allLabel) {
  select.innerHTML = '<option value="">' + esc(allLabel) + "</option>" +
    values.map(function (v) { return '<option value="' + esc(v) + '">' + esc(v) + "</option>"; }).join("");
}

// Compares a student's details with a program's requirements.
function checkEligibility(program, profile) {
  if (profile.cgpa === null || profile.semester === null) {
    return { known: false, eligible: false };
  }
  const cgpaOk = profile.cgpa >= program.minCgpa;
  const semesterOk = profile.semester >= program.minSemester;
  return { known: true, cgpaOk: cgpaOk, semesterOk: semesterOk, eligible: cgpaOk && semesterOk };
}

// How many of a program's documents the student has ticked.
function documentsReady(program) {
  const ticked = getChecks()[program.id] || [];
  return program.documents.filter(function (name) { return ticked.indexOf(name) !== -1; }).length;
}

// Sorts open programs by soonest deadline first; closed programs go last.
function byDeadline(a, b) {
  const aClosed = daysLeft(a.deadline) < 0;
  const bClosed = daysLeft(b.deadline) < 0;
  if (aClosed !== bClosed) { return aClosed ? 1 : -1; }
  return a.deadline.localeCompare(b.deadline);
}


// Turns a password into text we can store instead of the password itself
// (SHA-256). Returns a promise because the browser does this work asynchronously.
function hashPassword(password) {
  if (window.crypto && window.crypto.subtle) {
    return window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(password)).then(function (buffer) {
      return Array.from(new Uint8Array(buffer)).map(function (b) { return b.toString(16).padStart(2, "0"); }).join("");
    });
  }
  return Promise.resolve("plain:" + password);   // very old browsers only
}

// Sends a logged-out visitor to the login page and comes back afterwards.
function goToLogin() {
  location.href = "login.html?next=" + encodeURIComponent(location.pathname.split("/").pop() + location.search);
}

// The last item of the top menu: "Log in", or "Hi, Name" with a Log out button.
function updateAuthMenu() {
  const item = $("#authItem");
  if (!item) { return; }
  const student = currentStudent();
  if (!student) {
    item.innerHTML = '<a href="login.html"' + (document.body.dataset.page === "login" ? ' aria-current="page"' : "") + ">Log in</a>";
    return;
  }
  item.innerHTML = '<span class="who">Hi, ' + esc(student.name.split(" ")[0]) + '</span> ' +
    '<button type="button" class="link-btn" id="studentLogout">Log out</button>';
  $("#studentLogout").addEventListener("click", function () {
    localStorage.removeItem(STUDENT_SESSION);
    location.href = "index.html";
  });
}


/* ---------- 4. Shared page parts ------------------------------------------- */

// A small message that appears at the bottom of the screen for a moment.
let toastTimer = null;
function showToast(message) {
  let toast = $("#toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "toast";
    toast.setAttribute("role", "status");
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { toast.classList.remove("show"); }, 2600);
}

// The number next to "Saved" in the top menu.
function updateNavCount() {
  const badge = $("#savedCount");
  if (!badge) { return; }
  const count = getSaved().length;
  badge.textContent = count;
  badge.hidden = count === 0;
}

// The ticket card used for every program in lists.
// compact = true gives the smaller version used on the home page.
function ticketHTML(program, compact) {
  const left = daysLeft(program.deadline);
  const closed = left < 0;
  const urgent = !closed && left <= 14;
  const saved = getSaved().indexOf(program.id) !== -1;
  const app = getApps()[program.id];
  const date = parseDate(program.deadline);
  const month = date.toLocaleDateString("en-IN", { month: "short" }) + " " + date.getFullYear();
  const link = "program.html?id=" + encodeURIComponent(program.id);

  let extra = "";
  if (!compact) {
    extra =
      '<dl class="ticket-facts">' +
        "<div><dt>Field</dt><dd>" + esc(program.field) + "</dd></div>" +
        "<div><dt>Duration</dt><dd>" + esc(program.duration) + "</dd></div>" +
        "<div><dt>Intake</dt><dd>" + esc(program.intake) + "</dd></div>" +
        "<div><dt>Minimum CGPA</dt><dd>" + program.minCgpa + "</dd></div>" +
      "</dl>" +
      '<div class="ticket-actions">' +
        '<a class="btn btn-primary btn-small" href="' + link + '">View details</a>' +
        '<button type="button" class="btn btn-outline btn-small save-btn" data-id="' + esc(program.id) + '"' +
          ' aria-pressed="' + saved + '" aria-label="Save ' + esc(program.title) + '">' + (saved ? "Saved" : "Save") + "</button>" +
        (app ? '<span class="ticket-note">Application: ' + esc(app.status) + "</span>" : "") +
      "</div>";
  }

  return (
    '<article class="ticket' + (closed ? " is-closed" : "") + (compact ? " ticket--compact" : "") + '">' +
      '<div class="ticket-main">' +
        '<p class="ticket-code">' + esc(program.code) + "</p>" +
        '<p class="ticket-place">' + esc(program.city) + ", " + esc(program.country) + "</p>" +
        '<h3 class="ticket-title"><a href="' + link + '">' + esc(program.title) + "</a></h3>" +
        '<p class="ticket-inst">' + esc(program.institution) + "</p>" +
        extra +
      "</div>" +
      '<div class="ticket-stub">' +
        '<p class="stub-label">Apply by</p>' +
        '<p class="stub-date"><span class="stub-day">' + date.getDate() + '</span><span class="stub-month">' + month + "</span></p>" +
        '<p class="stub-left' + (urgent ? " is-urgent" : "") + '">' + deadlineLabel(left) + "</p>" +
      "</div>" +
    "</article>"
  );
}

// Makes every Save button match what is stored.
function syncSaveButtons() {
  const saved = getSaved();
  $$(".save-btn").forEach(function (button) {
    const isSaved = saved.indexOf(button.dataset.id) !== -1;
    button.setAttribute("aria-pressed", isSaved);
    button.textContent = isSaved ? "Saved" : "Save";
  });
}

// One click listener for ALL Save buttons on the page (event delegation),
// so buttons added later by JavaScript work too.
document.addEventListener("click", function (event) {
  const button = event.target.closest(".save-btn");
  if (!button) { return; }
  if (!currentStudent()) {
    showToast("Log in to save programs");
    setTimeout(goToLogin, 900);
    return;
  }
  const nowSaved = toggleSaved(button.dataset.id);
  showToast(nowSaved ? "Program saved" : "Program removed from saved");
  syncSaveButtons();
  updateNavCount();
  if (document.body.dataset.page === "saved") { renderSaved(); }
});


/* ---------- 5. Home page --------------------------------------------------- */

function initHome() {
  const programs = getPrograms();

  // The three open programs with the nearest deadlines.
  const soon = programs
    .filter(function (p) { return daysLeft(p.deadline) >= 0; })
    .sort(byDeadline)
    .slice(0, 3);
  $("#heroTickets").innerHTML = soon.length
    ? soon.map(function (p) { return ticketHTML(p, true); }).join("")
    : '<p class="hint">No programs are open for applications right now.</p>';

  // Search form: the form itself sends the choices to programs.html.
  fillSelect($("#homeCountry"), uniqueSorted(programs.map(function (p) { return p.country; })), "Any country");
  fillSelect($("#homeField"), uniqueSorted(programs.map(function (p) { return p.field; })), "Any field");

  // Partner institutions: group the programs by institution.
  const partners = {};
  programs.forEach(function (p) {
    if (!partners[p.institution]) {
      partners[p.institution] = { name: p.institution, city: p.city, country: p.country, count: 0 };
    }
    partners[p.institution].count += 1;
  });
  const rows = Object.values(partners)
    .sort(function (a, b) { return a.name.localeCompare(b.name); })
    .map(function (partner) {
      return "<tr>" +
        '<th scope="row"><a href="programs.html?q=' + encodeURIComponent(partner.name) + '">' + esc(partner.name) + "</a></th>" +
        "<td>" + esc(partner.city) + "</td>" +
        "<td>" + esc(partner.country) + "</td>" +
        "<td>" + partner.count + "</td>" +
      "</tr>";
    });
  $("#partnerRows").innerHTML = rows.join("");
}


/* ---------- 6. Programs page ----------------------------------------------- */

// Reads every filter control into one object.
function readFilters() {
  return {
    q: $("#q").value.trim(),
    country: $("#country").value,
    field: $("#fieldSelect").value,
    openOnly: $("#openOnly").checked,
    cgpa: toNumber($("#cgpa").value),
    semester: toNumber($("#semester").value),
    eligibleOnly: $("#eligibleOnly").checked,
    sort: $("#sort").value
  };
}

// Keeps only the programs that match the filters, then sorts them.
function applyFilters(programs, filters) {
  const hasProfile = filters.cgpa !== null && filters.semester !== null;

  const result = programs.filter(function (p) {
    const text = (p.institution + " " + p.city + " " + p.country + " " + p.title + " " + p.field).toLowerCase();
    if (filters.q && text.indexOf(filters.q.toLowerCase()) === -1) { return false; }
    if (filters.country && p.country !== filters.country) { return false; }
    if (filters.field && p.field !== filters.field) { return false; }
    if (filters.openOnly && daysLeft(p.deadline) < 0) { return false; }
    if (filters.eligibleOnly && hasProfile) {
      const check = checkEligibility(p, { cgpa: filters.cgpa, semester: filters.semester });
      if (!check.eligible) { return false; }
    }
    return true;
  });

  result.sort(function (a, b) {
    if (filters.sort === "name") { return a.institution.localeCompare(b.institution); }
    if (filters.sort === "cgpa") { return a.minCgpa - b.minCgpa; }
    return byDeadline(a, b);
  });
  return result;
}

function renderPrograms() {
  const filters = readFilters();
  const hasProfile = filters.cgpa !== null && filters.semester !== null;
  const matches = applyFilters(getPrograms(), filters);

  // Remind the student to fill in their details if they ticked the box first.
  $("#eligHint").hidden = !(filters.eligibleOnly && !hasProfile);

  $("#resultCount").textContent = matches.length === 1 ? "1 program found" : matches.length + " programs found";

  if (matches.length === 0) {
    $("#results").innerHTML =
      '<div class="empty">' +
        "<h3>No programs match these filters</h3>" +
        "<p>Try a different country or field, or clear the filters to see every program.</p>" +
        '<button type="button" class="btn btn-outline" id="emptyClear">Clear filters</button>' +
      "</div>";
    $("#emptyClear").addEventListener("click", clearFilters);
    return;
  }
  $("#results").innerHTML = matches.map(function (p) { return ticketHTML(p, false); }).join("");
}

function clearFilters() {
  $("#q").value = "";
  $("#country").value = "";
  $("#fieldSelect").value = "";
  $("#openOnly").checked = false;
  $("#eligibleOnly").checked = false;
  $("#sort").value = "deadline";
  renderPrograms();
}

function initPrograms() {
  const programs = getPrograms();
  fillSelect($("#country"), uniqueSorted(programs.map(function (p) { return p.country; })), "All countries");
  fillSelect($("#fieldSelect"), uniqueSorted(programs.map(function (p) { return p.field; })), "All fields");

  // Start with the choices that came from the home page search, if any.
  const params = new URLSearchParams(location.search);
  $("#q").value = params.get("q") || "";
  $("#country").value = params.get("country") || "";
  $("#fieldSelect").value = params.get("field") || "";

  // Fill in the student's saved details.
  const profile = getProfile();
  $("#cgpa").value = profile.cgpa === null ? "" : profile.cgpa;
  $("#semester").value = profile.semester === null ? "" : profile.semester;

  const form = $("#filters");
  // Re-draw the list whenever any control changes.
  form.addEventListener("input", function (event) {
    if (event.target.id === "cgpa" || event.target.id === "semester") {
      setProfile({ cgpa: toNumber($("#cgpa").value), semester: toNumber($("#semester").value) });
    }
    renderPrograms();
  });
  // Pressing Enter in the search box should not reload the page.
  form.addEventListener("submit", function (event) { event.preventDefault(); });
  $("#clearFilters").addEventListener("click", clearFilters);

  renderPrograms();
}


/* ---------- 7. Program detail page ----------------------------------------- */

// The "Meets / Does not meet" list shown under the eligibility check.
function eligibilityHTML(program, profile) {
  const result = checkEligibility(program, profile);
  if (!result.known) {
    return '<p class="hint">Enter your CGPA and semesters completed to see whether you qualify.</p>';
  }
  function line(ok, text) {
    return '<li class="' + (ok ? "is-met" : "is-unmet") + '">' +
      '<span class="mark" aria-hidden="true">' + (ok ? "&#10003;" : "&#10005;") + "</span>" +
      "<span>" + text + " <strong>" + (ok ? "Meets the requirement." : "Does not meet the requirement.") + "</strong></span></li>";
  }
  return '<ul class="criteria">' +
    line(result.cgpaOk, "CGPA: you have " + profile.cgpa + ", the program asks for " + program.minCgpa + " or more.") +
    line(result.semesterOk, "Semesters completed: you have " + profile.semester + ", the program asks for " + program.minSemester + " or more.") +
    "</ul>" +
    '<p class="verdict ' + (result.eligible ? "is-met" : "is-unmet") + '">' +
      (result.eligible ? "You meet the academic requirements for this program." : "You do not meet every academic requirement for this program.") +
    "</p>";
}

// The box with the application button and status stamp.
function applyPanelHTML(program) {
  const app = getApps()[program.id];
  const closed = daysLeft(program.deadline) < 0;
  const total = program.documents.length;
  const ready = documentsReady(program);

  if (!app) {
    if (closed) {
      return '<p class="note">Applications for this program have closed.</p>';
    }
    if (!currentStudent()) {
      return '<p class="note">Log in to start an application and track your documents.</p>' +
        '<a class="btn btn-primary" href="login.html?next=' + encodeURIComponent("program.html?id=" + program.id) + '">Log in</a>';
    }
    return '<p class="note">Start an application to track your documents and status.</p>' +
      '<button type="button" class="btn btn-primary" data-action="start">Start application</button>';
  }

  let body = '<p class="stamp-line"><span class="stamp stamp-' + app.status.toLowerCase().replace(" ", "-") + '">' + esc(app.status) + "</span></p>";
  if (app.status === "Draft") {
    const canSubmit = ready === total && !closed;
    body += '<p class="note">' +
      (closed ? "The deadline has passed, so this draft can no longer be submitted."
        : canSubmit ? "All documents are ready. You can submit your application."
        : "Tick all " + total + " documents to enable submitting. " + ready + " of " + total + " are ready.") +
      "</p>" +
      '<button type="button" class="btn btn-primary" data-action="submit"' + (canSubmit ? "" : " disabled") + ">Submit application</button>";
  } else {
    body += '<p class="note">The exchange office updates this status after your application is submitted.</p>';
  }
  body += ' <button type="button" class="btn btn-ghost" data-action="withdraw">Withdraw application</button>';
  return body;
}

function programDetailHTML(program) {
  const left = daysLeft(program.deadline);
  const saved = getSaved().indexOf(program.id) !== -1;
  const profile = getProfile();
  const ticked = getChecks()[program.id] || [];

  const documents = program.documents.map(function (name, index) {
    return '<li><label><input type="checkbox" data-doc="' + esc(name) + '"' + (ticked.indexOf(name) !== -1 ? " checked" : "") + "> " + esc(name) + "</label></li>";
  }).join("");

  return (
    '<a class="back-link" href="programs.html">Back to programs</a>' +
    '<header class="detail-head">' +
      "<div>" +
        '<p class="detail-code">' + esc(program.code) + "</p>" +
        "<h1>" + esc(program.title) + "</h1>" +
        '<p class="detail-inst">' + esc(program.institution) + ", " + esc(program.city) + ", " + esc(program.country) + "</p>" +
      "</div>" +
      '<aside class="apply-box" aria-label="Deadline and application">' +
        '<p class="apply-deadline">Apply by <strong>' + formatDate(program.deadline) + "</strong></p>" +
        '<p class="stub-left' + (left >= 0 && left <= 14 ? " is-urgent" : "") + '">' + deadlineLabel(left) + "</p>" +
        '<div id="applyPanel">' + applyPanelHTML(program) + "</div>" +
        '<button type="button" class="btn btn-outline save-btn" data-id="' + esc(program.id) + '" aria-pressed="' + saved + '" aria-label="Save ' + esc(program.title) + '">' + (saved ? "Saved" : "Save") + "</button>" +
      "</aside>" +
    "</header>" +

    '<div class="detail-grid">' +
      '<section aria-labelledby="aboutHeading">' +
        '<h2 id="aboutHeading">About this program</h2>' +
        "<p>" + esc(program.about) + "</p>" +
        "<h3>Key courses</h3>" +
        '<ul class="plain-list">' + program.courses.map(function (c) { return "<li>" + esc(c) + "</li>"; }).join("") + "</ul>" +
      "</section>" +

      '<section aria-labelledby="detailsHeading">' +
        '<h2 id="detailsHeading">Program details</h2>' +
        '<dl class="detail-list">' +
          "<div><dt>Field of study</dt><dd>" + esc(program.field) + "</dd></div>" +
          "<div><dt>Duration</dt><dd>" + esc(program.duration) + "</dd></div>" +
          "<div><dt>Intake</dt><dd>" + esc(program.intake) + "</dd></div>" +
          "<div><dt>Seats for LPU students</dt><dd>" + program.seats + "</dd></div>" +
          "<div><dt>Language</dt><dd>" + esc(program.language) + "</dd></div>" +
          "<div><dt>Fees and costs</dt><dd>" + esc(program.fees) + "</dd></div>" +
        "</dl>" +
      "</section>" +

      '<section aria-labelledby="eligHeading">' +
        '<h2 id="eligHeading">Eligibility</h2>' +
        "<p>You need a CGPA of <strong>" + program.minCgpa + "</strong> or more and at least <strong>" + program.minSemester + "</strong> completed semesters.</p>" +
        '<form class="inline-form" id="eligForm">' +
          '<div class="field"><label for="eligCgpa">Your CGPA (out of 10)</label>' +
            '<input id="eligCgpa" type="number" min="0" max="10" step="0.01" value="' + (profile.cgpa === null ? "" : profile.cgpa) + '"></div>' +
          '<div class="field"><label for="eligSemester">Semesters completed</label>' +
            '<input id="eligSemester" type="number" min="0" max="12" step="1" value="' + (profile.semester === null ? "" : profile.semester) + '"></div>' +
        "</form>" +
        '<div id="eligResult" aria-live="polite">' + eligibilityHTML(program, profile) + "</div>" +
      "</section>" +

      '<section aria-labelledby="docsHeading">' +
        '<h2 id="docsHeading">Document checklist</h2>' +
        '<p id="docProgressText" class="progress-text"></p>' +
        '<progress id="docProgress" max="' + program.documents.length + '" value="0"></progress>' +
        '<ul class="checklist" id="docList">' + documents + "</ul>" +
      "</section>" +
    "</div>"
  );
}

function initProgram() {
  const id = new URLSearchParams(location.search).get("id");
  const program = findProgram(id);
  const view = $("#programView");

  if (!program) {
    view.innerHTML =
      '<div class="empty">' +
        "<h1>Program not found</h1>" +
        "<p>This program may have been removed. Go back to the list to pick another one.</p>" +
        '<a class="btn btn-primary" href="programs.html">Browse programs</a>' +
      "</div>";
    return;
  }

  document.title = program.title + " - Passage";
  view.innerHTML = programDetailHTML(program);

  // Updates the "3 of 7 documents ready" text and bar.
  function refreshProgress() {
    const ready = documentsReady(program);
    $("#docProgressText").textContent = ready + " of " + program.documents.length + " documents ready";
    $("#docProgress").value = ready;
  }
  function refreshApplyPanel() { $("#applyPanel").innerHTML = applyPanelHTML(program); }
  refreshProgress();

  // Eligibility check updates while the student types.
  $("#eligForm").addEventListener("input", function () {
    const profile = { cgpa: toNumber($("#eligCgpa").value), semester: toNumber($("#eligSemester").value) };
    setProfile(profile);
    $("#eligResult").innerHTML = eligibilityHTML(program, profile);
  });
  $("#eligForm").addEventListener("submit", function (event) { event.preventDefault(); });

  // Ticking a document is saved straight away.
  $("#docList").addEventListener("change", function (event) {
    const box = event.target;
    const checks = getChecks();
    let list = checks[program.id] || [];
    if (box.checked) {
      if (list.indexOf(box.dataset.doc) === -1) { list.push(box.dataset.doc); }
    } else {
      list = list.filter(function (name) { return name !== box.dataset.doc; });
    }
    checks[program.id] = list;
    setChecks(checks);
    refreshProgress();
    refreshApplyPanel();
  });

  // Start / submit / withdraw buttons.
  $("#applyPanel").addEventListener("click", function (event) {
    const button = event.target.closest("button[data-action]");
    if (!button) { return; }
    const apps = getApps();
    const action = button.dataset.action;

    if (action === "start") {
      apps[program.id] = { status: "Draft", updated: toInputDate(new Date()) };
      showToast("Application started");
    } else if (action === "submit") {
      apps[program.id] = { status: "Submitted", updated: toInputDate(new Date()) };
      showToast("Application submitted");
    } else if (action === "withdraw") {
      if (!confirm("Withdraw your application to " + program.institution + "?")) { return; }
      delete apps[program.id];
      showToast("Application withdrawn");
    }
    setApps(apps);
    refreshApplyPanel();
  });
}


/* ---------- 8. Saved page -------------------------------------------------- */

// Shown instead of a student's list when nobody is logged in.
function loginNeededHTML(what) {
  return '<div class="empty">' +
    "<h2>Log in to see your " + what + "</h2>" +
    "<p>Your saved programs and applications are kept per student. Log in or create a free account to see yours.</p>" +
    '<a class="btn btn-primary" href="login.html?next=' + encodeURIComponent(location.pathname.split("/").pop()) + '">Log in or create account</a>' +
    "</div>";
}

function renderSaved() {
  if (!currentStudent()) { $("#savedList").innerHTML = loginNeededHTML("saved programs"); return; }
  const savedIds = getSaved();
  const programs = savedIds.map(findProgram).filter(Boolean);   // ignore removed programs

  if (programs.length === 0) {
    $("#savedList").innerHTML =
      '<div class="empty">' +
        "<h2>You have not saved any programs yet</h2>" +
        "<p>Choose Save on a program to keep it here and compare it later.</p>" +
        '<a class="btn btn-primary" href="programs.html">Browse programs</a>' +
      "</div>";
    return;
  }
  programs.sort(byDeadline);
  $("#savedList").innerHTML = programs.map(function (p) { return ticketHTML(p, false); }).join("");
}


/* ---------- 9. My applications page ---------------------------------------- */

// The four-step track: Draft, Submitted, Under review, Decision.
function trackHTML(status) {
  const decided = status === "Accepted" || status === "Rejected";
  const steps = ["Draft", "Submitted", "Under review", decided ? status : "Decision"];
  const current = decided ? 3 : STATUSES.indexOf(status);
  return '<ol class="track" aria-label="Application progress">' +
    steps.map(function (label, index) {
      const state = index < current ? "done" : index === current ? "current" : "";
      const extra = decided && index === 3 ? " decision-" + status.toLowerCase() : "";
      return '<li class="' + state + extra + '"' + (index === current ? ' aria-current="step"' : "") + "><span>" + esc(label) + "</span></li>";
    }).join("") +
  "</ol>";
}

function renderApplications() {
  const apps = getApps();
  const ids = Object.keys(apps);

  if (ids.length === 0) {
    $("#appList").innerHTML =
      '<div class="empty">' +
        "<h2>You have not started an application</h2>" +
        "<p>Open a program and choose Start application. Your documents and status will show up here.</p>" +
        '<a class="btn btn-primary" href="programs.html">Browse programs</a>' +
      "</div>";
    return;
  }

  $("#appList").innerHTML = ids.map(function (id) {
    const app = apps[id];
    const program = findProgram(id);
    if (!program) {
      return '<article class="app-row"><div><h2 class="app-title">Program removed</h2>' +
        "<p>This program is no longer offered.</p></div>" +
        '<div class="app-side"><button type="button" class="btn btn-ghost btn-small" data-withdraw="' + esc(id) + '">Remove</button></div></article>';
    }
    const total = program.documents.length;
    const ready = documentsReady(program);
    return (
      '<article class="app-row">' +
        '<div class="app-info">' +
          '<p class="app-code">' + esc(program.code) + "</p>" +
          '<h2 class="app-title"><a href="program.html?id=' + encodeURIComponent(id) + '">' + esc(program.title) + "</a></h2>" +
          '<p class="app-inst">' + esc(program.institution) + ", " + esc(program.country) + "</p>" +
        "</div>" +
        '<div class="app-progress">' +
          trackHTML(app.status) +
          '<p class="app-docs">' + ready + " of " + total + " documents ready. Apply by " + formatDate(program.deadline) + ".</p>" +
        "</div>" +
        '<div class="app-side">' +
          '<span class="stamp stamp-' + app.status.toLowerCase().replace(" ", "-") + '">' + esc(app.status) + "</span>" +
          '<button type="button" class="btn btn-ghost btn-small" data-withdraw="' + esc(id) + '">Withdraw</button>' +
        "</div>" +
      "</article>"
    );
  }).join("");
}

function initApplications() {
  if (!currentStudent()) { $("#appList").innerHTML = loginNeededHTML("applications"); return; }
  renderApplications();
  $("#appList").addEventListener("click", function (event) {
    const button = event.target.closest("button[data-withdraw]");
    if (!button) { return; }
    if (!confirm("Withdraw this application?")) { return; }
    const apps = getApps();
    delete apps[button.dataset.withdraw];
    setApps(apps);
    showToast("Application withdrawn");
    renderApplications();
  });
}


/* ---------- 10. Admin page ------------------------------------------------- */

// Label text used in error messages.
const FIELD_LABELS = {
  institution: "Institution", city: "City", country: "Country", code: "City code", title: "Program title",
  duration: "Duration", intake: "Intake", seats: "Seats", language: "Language requirement", fees: "Fees and costs",
  minCgpa: "Minimum CGPA", minSemester: "Minimum semesters", deadline: "Apply-by date", about: "About",
  courses: "Key courses", documents: "Required documents"
};

let editingId = null;     // id of the program being edited, or null when adding a new one

function isAdmin() { return sessionStorage.getItem("passage_admin") === "yes"; }

function showAdminView() {
  const admin = isAdmin();
  $("#loginPanel").hidden = admin;
  $("#adminPanel").hidden = !admin;
  if (admin) {
    renderAdminPrograms();
    renderAdminApps();
  }
}

function renderAdminPrograms() {
  const rows = getPrograms().map(function (p) {
    return "<tr>" +
      '<th scope="row">' + esc(p.title) + '<span class="cell-sub">' + esc(p.institution) + "</span></th>" +
      "<td>" + esc(p.city) + ", " + esc(p.country) + "</td>" +
      "<td>" + formatDate(p.deadline) + "</td>" +
      "<td>" + p.seats + "</td>" +
      "<td>" + p.minCgpa + "</td>" +
      '<td class="row-actions">' +
        '<button type="button" class="btn btn-outline btn-small" data-edit="' + esc(p.id) + '">Edit</button> ' +
        '<button type="button" class="btn btn-danger btn-small" data-delete="' + esc(p.id) + '">Delete</button>' +
      "</td>" +
    "</tr>";
  });
  $("#programRows").innerHTML = rows.join("");
  $("#programCount").textContent = rows.length + (rows.length === 1 ? " program" : " programs");
}

function renderAdminApps() {
  // Collect every student's applications into one list.
  const rows = [];
  getStudents().forEach(function (student) {
    const apps = getApps(student.id);
    Object.keys(apps).forEach(function (programId) {
      rows.push({ student: student, programId: programId, app: apps[programId] });
    });
  });
  $("#noApps").hidden = rows.length > 0;
  $("#appTable").hidden = rows.length === 0;

  $("#appRows").innerHTML = rows.map(function (row) {
    const app = row.app;
    const program = findProgram(row.programId);
    const key = row.student.id + "|" + row.programId;
    const name = program ? esc(program.title) + '<span class="cell-sub">' + esc(program.institution) + "</span>" : "Program removed";
    let control;
    if (app.status === "Draft") {
      control = "Draft (not submitted yet)";
    } else {
      control = '<label class="visually-hidden" for="status-' + esc(key) + '">Status for ' + (program ? esc(program.title) : "removed program") + "</label>" +
        '<select id="status-' + esc(key) + '" data-status="' + esc(key) + '">' +
        STATUSES.slice(1).map(function (s) {
          return '<option value="' + s + '"' + (s === app.status ? " selected" : "") + ">" + s + "</option>";
        }).join("") + "</select>";
    }
    return "<tr><td>" + esc(row.student.name) + '<span class="cell-sub">' + esc(row.student.email) + "</span></td>" +
      '<th scope="row">' + name + "</th><td>" + control + "</td><td>" + formatDate(app.updated) + "</td></tr>";
  }).join("");
}

// Reads the add/edit form into a program object (all values still as text).
function readProgramForm() {
  function value(name) { return $("#f-" + name).value.trim(); }
  function lines(name) {
    return value(name).split("\n").map(function (l) { return l.trim(); }).filter(function (l) { return l !== ""; });
  }
  return {
    institution: value("institution"), city: value("city"), country: value("country"),
    code: value("code").toUpperCase(), title: value("title"), field: value("field"),
    duration: value("duration"), intake: value("intake"), seats: value("seats"),
    language: value("language"), fees: value("fees"), minCgpa: value("minCgpa"),
    minSemester: value("minSemester"), deadline: value("deadline"), about: value("about"),
    courses: lines("courses"), documents: lines("documents")
  };
}

// Returns an object like { code: "message" } for every field that is not valid.
function validateProgram(v) {
  const errors = {};
  ["institution", "city", "country", "title", "duration", "intake", "language", "fees", "about", "deadline"].forEach(function (key) {
    if (!v[key]) { errors[key] = FIELD_LABELS[key] + " is required."; }
  });
  if (!/^[A-Z]{3}$/.test(v.code)) { errors.code = "Enter a three-letter city code, for example YVR."; }
  if (!(Number(v.seats) >= 1 && Number.isInteger(Number(v.seats)))) { errors.seats = "Enter a whole number of 1 or more."; }
  if (v.minCgpa === "" || Number(v.minCgpa) < 0 || Number(v.minCgpa) > 10) { errors.minCgpa = "Enter a CGPA between 0 and 10."; }
  if (v.minSemester === "" || !Number.isInteger(Number(v.minSemester)) || Number(v.minSemester) < 0 || Number(v.minSemester) > 12) {
    errors.minSemester = "Enter a whole number between 0 and 12.";
  }
  if (v.courses.length === 0) { errors.courses = "Add at least one course, one per line."; }
  if (v.documents.length === 0) { errors.documents = "Add at least one required document, one per line."; }
  return errors;
}

function showFormErrors(errors) {
  $$(".field-error").forEach(function (el) { el.textContent = ""; });
  $$("#programForm [aria-invalid]").forEach(function (el) { el.removeAttribute("aria-invalid"); });
  const keys = Object.keys(errors);
  keys.forEach(function (key) {
    $("#err-" + key).textContent = errors[key];
    $("#f-" + key).setAttribute("aria-invalid", "true");
  });
  if (keys.length) { $("#f-" + keys[0]).focus(); }
}

function resetProgramForm() {
  editingId = null;
  $("#programForm").reset();
  showFormErrors({});
  $("#formHeading").textContent = "Add a program";
  $("#saveProgram").textContent = "Add program";
  $("#cancelEdit").hidden = true;
}

function startEdit(id) {
  const p = findProgram(id);
  if (!p) { return; }
  editingId = id;
  ["institution", "city", "country", "code", "title", "field", "duration", "intake", "seats",
   "language", "fees", "minCgpa", "minSemester", "deadline", "about"].forEach(function (key) {
    $("#f-" + key).value = p[key];
  });
  $("#f-courses").value = p.courses.join("\n");
  $("#f-documents").value = p.documents.join("\n");
  showFormErrors({});
  $("#formHeading").textContent = "Edit program";
  $("#saveProgram").textContent = "Save changes";
  $("#cancelEdit").hidden = false;
  $("#programForm").scrollIntoView({ behavior: "smooth", block: "start" });
  $("#f-institution").focus();
}

function deleteProgram(id) {
  const p = findProgram(id);
  if (!p) { return; }
  if (!confirm('Delete "' + p.title + '"? Saved items and applications for it will be removed too.')) { return; }
  setPrograms(getPrograms().filter(function (x) { return x.id !== id; }));
  allStudentIds().forEach(function (studentId) {
    setSaved(getSaved(studentId).filter(function (x) { return x !== id; }), studentId);
    const apps = getApps(studentId); delete apps[id]; setApps(apps, studentId);
    const checks = getChecks(studentId); delete checks[id]; setChecks(checks, studentId);
  });
  if (editingId === id) { resetProgramForm(); }
  renderAdminPrograms();
  renderAdminApps();
  showToast("Program deleted");
}

function initAdmin() {
  // Fill the field-of-study dropdown in the form.
  $("#f-field").innerHTML = FIELDS.map(function (f) { return "<option>" + esc(f) + "</option>"; }).join("");

  // Login form.
  $("#loginForm").addEventListener("submit", function (event) {
    event.preventDefault();
    const user = $("#loginUser").value.trim();
    const pass = $("#loginPass").value;
    if (user === ADMIN_USER && pass === ADMIN_PASS) {
      sessionStorage.setItem("passage_admin", "yes");
      $("#loginError").textContent = "";
      $("#loginPass").value = "";
      showAdminView();
    } else {
      $("#loginError").textContent = "The username or password is not correct. Check the demo login shown below the form.";
      $("#loginPass").focus();
    }
  });

  $("#logoutBtn").addEventListener("click", function () {
    sessionStorage.removeItem("passage_admin");
    resetProgramForm();
    showAdminView();
  });

  // Edit and Delete buttons in the programs table.
  $("#programRows").addEventListener("click", function (event) {
    const edit = event.target.closest("[data-edit]");
    const del = event.target.closest("[data-delete]");
    if (edit) { startEdit(edit.dataset.edit); }
    if (del) { deleteProgram(del.dataset.delete); }
  });

  // Add / edit form.
  $("#programForm").addEventListener("submit", function (event) {
    event.preventDefault();
    const values = readProgramForm();
    const errors = validateProgram(values);
    showFormErrors(errors);
    if (Object.keys(errors).length > 0) { return; }

    const program = {
      id: editingId || "p" + Date.now(),
      institution: values.institution, city: values.city, country: values.country, code: values.code,
      title: values.title, field: values.field, duration: values.duration, intake: values.intake,
      seats: Number(values.seats), language: values.language, fees: values.fees,
      minCgpa: Number(values.minCgpa), minSemester: Number(values.minSemester), deadline: values.deadline,
      about: values.about, courses: values.courses, documents: values.documents
    };

    const list = getPrograms();
    if (editingId) {
      const index = list.findIndex(function (p) { return p.id === editingId; });
      list[index] = program;
    } else {
      list.push(program);
    }
    setPrograms(list);
    showToast(editingId ? "Program updated" : "Program added");
    resetProgramForm();
    renderAdminPrograms();
  });
  $("#cancelEdit").addEventListener("click", resetProgramForm);

  // Changing a status in the applications table.
  $("#appRows").addEventListener("change", function (event) {
    const select = event.target.closest("select[data-status]");
    if (!select) { return; }
    const parts = select.dataset.status.split("|");      // [student id, program id]
    const apps = getApps(parts[0]);
    apps[parts[1]].status = select.value;
    apps[parts[1]].updated = toInputDate(new Date());
    setApps(apps, parts[0]);
    showToast("Status updated");
    renderAdminApps();
  });

  // Put the sample data back and clear everything the student did.
  $("#resetData").addEventListener("click", function () {
    if (!confirm("Reset all programs, saved items and applications to the sample data?")) { return; }
    // Remove programs and every student's saved items, applications, checklists and details
    // (their keys all start with the same name). Student accounts are kept.
    Object.keys(localStorage).forEach(function (key) {
      if (Object.keys(KEYS).some(function (name) { return key === KEYS[name] || key.indexOf(KEYS[name] + ":") === 0; })) {
        localStorage.removeItem(key);
      }
    });
    resetProgramForm();
    getPrograms();
    renderAdminPrograms();
    renderAdminApps();
    updateNavCount();
    showToast("Sample data restored");
  });

  showAdminView();
}


/* ---------- 10b. Student login page ---------------------------------------- */

// Where to go after logging in: the page the student came from, if it is one of ours.
function nextPage() {
  const next = new URLSearchParams(location.search).get("next") || "";
  return /^[\w-]+\.html(\?[\w=&%.-]*)?$/.test(next) ? next : "programs.html";
}

// If the visitor typed their CGPA and semesters before logging in, keep them.
function adoptGuestProfile(studentId) {
  const guest = readStore(KEYS.profile, null);
  const own = keyFor("profile", studentId);
  if (guest && guest.cgpa !== null && localStorage.getItem(own) === null) { writeStore(own, guest); }
}

function initLogin() {
  if (currentStudent()) { location.href = nextPage(); return; }

  // Explain why the visitor landed here.
  const why = { "saved.html": "Log in to see your saved programs.", "applications.html": "Log in to see your applications." }[new URLSearchParams(location.search).get("next")];
  if (why) { $("#loginNotice").textContent = why; $("#loginNotice").hidden = false; }

  $("#signupForm").addEventListener("submit", function (event) {
    event.preventDefault();
    const name = $("#suName").value.trim();
    const email = $("#suEmail").value.trim().toLowerCase();
    const pass = $("#suPass").value;
    const error = $("#suError");
    if (!name || !email || !pass) { error.textContent = "Fill in your name, email and password."; return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { error.textContent = "Enter a valid email address."; return; }
    if (pass.length < 6) { error.textContent = "The password needs at least 6 characters."; return; }
    if (getStudents().some(function (s) { return s.email === email; })) {
      error.textContent = "An account with this email already exists. Log in instead.";
      return;
    }
    hashPassword(pass).then(function (hash) {
      const student = { id: "s" + Date.now(), name: name, email: email, hash: hash };
      const list = getStudents(); list.push(student); setStudents(list);
      adoptGuestProfile(student.id);
      localStorage.setItem(STUDENT_SESSION, student.id);
      location.href = nextPage();
    });
  });

  $("#studentLoginForm").addEventListener("submit", function (event) {
    event.preventDefault();
    const email = $("#slEmail").value.trim().toLowerCase();
    const pass = $("#slPass").value;
    const student = getStudents().find(function (s) { return s.email === email; });
    hashPassword(pass).then(function (hash) {
      if (student && student.hash === hash) {
        adoptGuestProfile(student.id);
        localStorage.setItem(STUDENT_SESSION, student.id);
        location.href = nextPage();
      } else {
        $("#slError").textContent = "The email or password is not correct. New here? Create an account on the right.";
        $("#slPass").value = "";
        $("#slPass").focus();
      }
    });
  });
}


/* ---------- 11. Start-up ---------------------------------------------------- */

document.addEventListener("DOMContentLoaded", function () {
  updateNavCount();
  updateAuthMenu();
  const page = document.body.dataset.page;
  if (page === "home") { initHome(); }
  if (page === "programs") { initPrograms(); }
  if (page === "program") { initProgram(); }
  if (page === "saved") { renderSaved(); }
  if (page === "applications") { initApplications(); }
  if (page === "admin") { initAdmin(); }
  if (page === "login") { initLogin(); }
});
