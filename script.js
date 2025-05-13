let leagues = {};

// DOM elements
const leagueSelect = document.getElementById("league");
const statInputs = document.getElementById("statInputs");
const bonusSection = document.getElementById("bonusSection");
const bonusOptions = document.getElementById("bonusOptions");
const calculateBtn = document.getElementById("calculateBtn");
const clearBtn = document.getElementById("clearBtn");
const totalScore = document.getElementById("totalScore");
const breakdown = document.getElementById("breakdown");
const hideZeros = document.getElementById("hideZeros");
const copyBtn = document.getElementById("copyBtn");

// Load league data
fetch("leagues.json")
  .then(res => res.json())
  .then(data => {
    leagues = data;
    populateLeagueDropdown();
    const firstLeagueKey = Object.keys(leagues)[0];
    leagueSelect.value = leagues[firstLeagueKey].name;
    renderInputs(leagueSelect.value);
  })
  .catch(err => {
    console.error("Error loading league data:", err);
    statInputs.innerHTML = "<p style='color: red;'>Error loading league data.</p>";
  });

// Populate league dropdown
function populateLeagueDropdown() {
  leagueSelect.innerHTML = "";
  Object.values(leagues).forEach(league => {
    const option = document.createElement("option");
    option.value = league.name;
    option.textContent = league.name;
    leagueSelect.appendChild(option);
  });
}

// Retrieve league by name
function getLeagueByName(name) {
  return Object.values(leagues).find(l => l.name === name);
}

// Render input fields and bonuses
function renderInputs(leagueName) {
  const league = getLeagueByName(leagueName);
  if (!league) return;

  statInputs.innerHTML = "";
  bonusOptions.innerHTML = "";
  bonusSection.style.display = "none";

  const stats = Array.isArray(league.stats)
    ? league.stats
    : Object.entries(league.stats).map(([label, points]) => ({ label, points }));

  // Render stat fields
  stats.forEach(stat => {
    const row = document.createElement("div");
    row.className = "stat-row";

    const label = document.createElement("label");
    const isYard = stat.label.toLowerCase().includes("yard");
    label.innerHTML = `${stat.label} <span class="points">(${stat.points} pts${isYard ? "/yd" : ""})</span>`;

    const input = document.createElement("input");
    input.type = "number";
    input.id = stat.label;
    input.placeholder = " ";

    row.appendChild(label);
    row.appendChild(input);
    statInputs.appendChild(row);
  });

  // Render bonus options
  if (Array.isArray(league.bonuses) && league.bonuses.length > 0) {
    bonusSection.style.display = "block";

    league.bonuses.forEach((bonus, i) => {
      const label = document.createElement("label");
      label.style.display = "block";
      label.className = "bonus-label";

      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = "bonus";
      radio.value = bonus.points;
      radio.id = `bonus_${i}`;
      if (i === 0) radio.checked = true;

      label.appendChild(radio);
      label.append(` ${bonus.label} (+${bonus.points})`);
      bonusOptions.appendChild(label);
    });
  }
}

// Handle league change
leagueSelect.addEventListener("change", () => {
  renderInputs(leagueSelect.value);
  resetOutput();
});

// Calculate total score
calculateBtn.addEventListener("click", () => {
  const league = getLeagueByName(leagueSelect.value);
  if (!league) return;

  const stats = Array.isArray(league.stats)
    ? league.stats
    : Object.entries(league.stats).map(([label, points]) => ({ label, points }));

  let total = 0;
  let details = "";

  stats.forEach(stat => {
    const input = document.getElementById(stat.label);
    const val = parseFloat(input?.value) || 0;
    const score = val * stat.points;
    total += score;

    if (!hideZeros.checked || val !== 0) {
      details += `${stat.label}: ${stat.points} x ${val} = ${score.toFixed(2)}\n`;
    }
  });

  const bonus = document.querySelector('input[name="bonus"]:checked');
  if (bonus) {
    const bonusVal = parseFloat(bonus.value);
    total += bonusVal;
    details += `Bonus: +${bonusVal}\n`;
  }

  totalScore.innerText = total.toFixed(2);
  breakdown.value = `${details}\nTOTAL FS = ${total.toFixed(2)}`;
});

// Clear inputs
clearBtn.addEventListener("click", () => {
  const league = getLeagueByName(leagueSelect.value);
  if (!league) return;

  const stats = Array.isArray(league.stats)
    ? league.stats
    : Object.entries(league.stats).map(([label]) => ({ label }));

  stats.forEach(stat => {
    const input = document.getElementById(stat.label);
    if (input) input.value = "";
  });

  document.querySelectorAll('input[name="bonus"]').forEach(radio => {
    radio.checked = false;
  });

  resetOutput();
});

// Copy to clipboard
copyBtn.addEventListener("click", () => {
  breakdown.select();
  document.execCommand("copy");
});

// Reset total and breakdown
function resetOutput() {
  totalScore.innerText = "0";
  breakdown.value = "";
}
let leagues = {};

// DOM elements
const leagueSelect = document.getElementById("league");
const statInputs = document.getElementById("statInputs");
const bonusSection = document.getElementById("bonusSection");
const bonusOptions = document.getElementById("bonusOptions");
const calculateBtn = document.getElementById("calculateBtn");
const clearBtn = document.getElementById("clearBtn");
const totalScore = document.getElementById("totalScore");
const breakdown = document.getElementById("breakdown");
const hideZeros = document.getElementById("hideZeros");
const copyBtn = document.getElementById("copyBtn");

// Load league data
fetch("leagues.json")
  .then(res => res.json())
  .then(data => {
    leagues = data;
    populateLeagueDropdown();
    const firstLeagueKey = Object.keys(leagues)[0];
    leagueSelect.value = leagues[firstLeagueKey].name;
    renderInputs(leagueSelect.value);
  })
  .catch(err => {
    console.error("Error loading league data:", err);
    statInputs.innerHTML = "<p style='color: red;'>Error loading league data.</p>";
  });

// Populate league dropdown
function populateLeagueDropdown() {
  leagueSelect.innerHTML = "";
  Object.values(leagues).forEach(league => {
    const option = document.createElement("option");
    option.value = league.name;
    option.textContent = league.name;
    leagueSelect.appendChild(option);
  });
}

// Retrieve league by name
function getLeagueByName(name) {
  return Object.values(leagues).find(l => l.name === name);
}

// Render input fields and bonuses
function renderInputs(leagueName) {
  const league = getLeagueByName(leagueName);
  if (!league) return;

  statInputs.innerHTML = "";
  bonusOptions.innerHTML = "";
  bonusSection.style.display = "none";

  const stats = Array.isArray(league.stats)
    ? league.stats
    : Object.entries(league.stats).map(([label, points]) => ({ label, points }));

  // Render stat fields
  stats.forEach(stat => {
    const row = document.createElement("div");
    row.className = "stat-row";

    const label = document.createElement("label");
    const isYard = stat.label.toLowerCase().includes("yard");
    label.innerHTML = `${stat.label} <span class="points">(${stat.points} pts${isYard ? "/yd" : ""})</span>`;

    const input = document.createElement("input");
    input.type = "number";
    input.id = stat.label;
    input.placeholder = " ";

    row.appendChild(label);
    row.appendChild(input);
    statInputs.appendChild(row);
  });

  // Render bonus options
  if (Array.isArray(league.bonuses) && league.bonuses.length > 0) {
    bonusSection.style.display = "block";

    league.bonuses.forEach((bonus, i) => {
      const label = document.createElement("label");
      label.style.display = "block";
      label.className = "bonus-label";

      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = "bonus";
      radio.value = bonus.points;
      radio.id = `bonus_${i}`;
      if (i === 0) radio.checked = true;

      label.appendChild(radio);
      label.append(` ${bonus.label} (+${bonus.points})`);
      bonusOptions.appendChild(label);
    });
  }
}

// Handle league change
leagueSelect.addEventListener("change", () => {
  renderInputs(leagueSelect.value);
  resetOutput();
});

// Calculate total score
calculateBtn.addEventListener("click", () => {
  const league = getLeagueByName(leagueSelect.value);
  if (!league) return;

  const stats = Array.isArray(league.stats)
    ? league.stats
    : Object.entries(league.stats).map(([label, points]) => ({ label, points }));

  let total = 0;
  let details = "";

  stats.forEach(stat => {
    const input = document.getElementById(stat.label);
    const val = parseFloat(input?.value) || 0;
    const score = val * stat.points;
    total += score;

    if (!hideZeros.checked || val !== 0) {
      details += `${stat.label}: ${stat.points} x ${val} = ${score.toFixed(2)}\n`;
    }
  });

  const bonus = document.querySelector('input[name="bonus"]:checked');
  if (bonus) {
    const bonusVal = parseFloat(bonus.value);
    total += bonusVal;
    details += `Bonus: +${bonusVal}\n`;
  }

  totalScore.innerText = total.toFixed(2);
  breakdown.value = `${details}\nTOTAL FS = ${total.toFixed(2)}`;
});

// Clear inputs
clearBtn.addEventListener("click", () => {
  const league = getLeagueByName(leagueSelect.value);
  if (!league) return;

  const stats = Array.isArray(league.stats)
    ? league.stats
    : Object.entries(league.stats).map(([label]) => ({ label }));

  stats.forEach(stat => {
    const input = document.getElementById(stat.label);
    if (input) input.value = "";
  });

  document.querySelectorAll('input[name="bonus"]').forEach(radio => {
    radio.checked = false;
  });

  resetOutput();
});

// Copy to clipboard
copyBtn.addEventListener("click", () => {
  breakdown.select();
  document.execCommand("copy");
});

// Reset total and breakdown
function resetOutput() {
  totalScore.innerText = "0";
  breakdown.value = "";
}
