let leagues = {};

async function loadLeagues() {
  const res = await fetch("leagues.json");
  leagues = await res.json();
  const select = document.getElementById("league");
  Object.entries(leagues).forEach(([key, val]) => {
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = val.name;
    select.appendChild(opt);
  });
  loadStats();
}

function loadStats() {
  const leagueKey = document.getElementById("league").value;
  const league = leagues[leagueKey];
  const container = document.getElementById("stats-container");
  container.innerHTML = "";
  const stats = Array.isArray(league.stats)
    ? league.stats.map(s => [s.label, s.points])
    : Object.entries(league.stats);

  stats.forEach(([label, points]) => {
    const row = document.createElement("div");
    row.className = "stat-row";
    row.innerHTML = `
      <div class="stat-label">${label} — ${points} pts</div>
      <input type="text" class="stat-input" id="stat-${label}" />
    `;
    container.appendChild(row);
  });
}

function calculateScore() {
  const leagueKey = document.getElementById("league").value;
  const league = leagues[leagueKey];
  const stats = Array.isArray(league.stats)
    ? league.stats.map(s => [s.label, s.points])
    : Object.entries(league.stats);
  let total = 0;
  let breakdown = "";

  stats.forEach(([label, points]) => {
    const val = parseFloat(document.getElementById(`stat-${label}`)?.value) || 0;
    if (val !== 0 || !document.getElementById("hideZero").checked) {
      breakdown += `${label}: ${val} × ${points} = ${(val * points).toFixed(2)}\n`;
    }
    total += val * points;
  });

  document.getElementById("breakdown").value = breakdown + `\nTotal: ${total.toFixed(2)}`;
}

function clearInputs() {
  document.querySelectorAll(".stat-input").forEach(input => input.value = "");
  document.getElementById("breakdown").value = "";
}

function copyBreakdown() {
  const breakdown = document.getElementById("breakdown");
  breakdown.select();
  document.execCommand("copy");
}

function loadStats() {
  const leagueKey = document.getElementById("league").value;
  const league = leagues[leagueKey];
  const container = document.getElementById("stats-container");
  container.innerHTML = "";

  // Load standard stats
  const stats = Array.isArray(league.stats)
    ? league.stats.map(s => [s.label, s.points])
    : Object.entries(league.stats);

  stats.forEach(([label, points]) => {
    const row = document.createElement("div");
    row.className = "stat-row";
    row.innerHTML = `
      <div class="stat-label">${label} — ${points} pts</div>
      <input type="text" class="stat-input" id="stat-${label}" />
    `;
    container.appendChild(row);
  });

  // Load bonuses if they exist
  if (league.bonuses) {
    const bonusGroup = document.createElement("div");
    bonusGroup.className = "stat-row";
    bonusGroup.innerHTML = `<div class="stat-label">Bonus:</div>`;
    container.appendChild(bonusGroup);

    league.bonuses.forEach((bonus, idx) => {
      const bonusRow = document.createElement("div");
      bonusRow.className = "stat-row";
      bonusRow.innerHTML = `
        <label style="display: flex; align-items: center;">
          <input type="radio" name="bonus" value="${bonus.points}" />
          <span style="margin-left: 8px;">${bonus.label} — ${bonus.points} pts</span>
        </label>
      `;
      container.appendChild(bonusRow);
    });
  }
}

function calculateScore() {
  const leagueKey = document.getElementById("league").value;
  const league = leagues[leagueKey];
  const stats = Array.isArray(league.stats)
    ? league.stats.map(s => [s.label, s.points])
    : Object.entries(league.stats);

  let total = 0;
  let breakdown = "";

  stats.forEach(([label, points]) => {
    const val = parseFloat(document.getElementById(`stat-${label}`)?.value) || 0;
    if (val !== 0 || !document.getElementById("hideZero").checked) {
      breakdown += `${label}: ${val} × ${points} = ${(val * points).toFixed(2)}\n`;
    }
    total += val * points;
  });

  // Handle selected bonus
  const selectedBonus = document.querySelector('input[name="bonus"]:checked');
  if (selectedBonus) {
    const bonusPoints = parseFloat(selectedBonus.value);
    total += bonusPoints;
    breakdown += `Bonus: ${bonusPoints.toFixed(2)}\n`;
  }

  document.getElementById("breakdown").value = breakdown + `\nTotal: ${total.toFixed(2)}`;
}

window.onload = loadLeagues;
