let leagues = {};

async function loadLeagues() {
  const res = await fetch("leagues.json");
  leagues = await res.json();
  const select = document.getElementById("league");
  select.innerHTML = "";
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
  const bonusContainer = document.getElementById("bonus-container");
  container.innerHTML = "";
  bonusContainer.innerHTML = "";

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

  if (league.bonuses && league.bonuses.length > 0) {
    const title = document.createElement("h3");
    title.textContent = "Bonus:";
    bonusContainer.appendChild(title);

    league.bonuses.forEach((bonus, index) => {
      const row = document.createElement("div");
      row.className = "bonus-option";
      row.innerHTML = `
        <label>
          <input type="radio" name="bonus" value="${bonus.points}" />
          ${bonus.label} — ${bonus.points} pts
        </label>
      `;
      bonusContainer.appendChild(row);
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

  const bonus = document.querySelector('input[name="bonus"]:checked');
  if (bonus) {
    const bonusVal = parseFloat(bonus.value);
    total += bonusVal;
    breakdown += `Bonus: +${bonusVal}\n`;
  }

  document.getElementById("breakdown").value = breakdown + `\nTotal: ${total.toFixed(2)}`;
}

function clearInputs() {
  document.querySelectorAll(".stat-input").forEach(input => input.value = "");
  document.getElementById("breakdown").value = "";
  const selectedBonus = document.querySelector('input[name="bonus"]:checked');
  if (selectedBonus) selectedBonus.checked = false;
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

  // Special UI for Tennis
  if (leagueKey === "tennis") {
    const customTennisHTML = `
      <div class="tennis-grid">
        <div><strong>PLAYER</strong></div>
        <div><input type="text" placeholder="Name" /></div>
        <div><strong>Set 1</strong></div>
        <div><input type="text" class="stat-input" id="set1" /></div>
        <div><strong>Set 2</strong></div>
        <div><input type="text" class="stat-input" id="set2" /></div>
        <div><strong>Set 3</strong></div>
        <div><input type="text" class="stat-input" id="set3" /></div>
        <div><strong>Aces</strong></div>
        <div><input type="text" class="stat-input" id="Ace" /></div>
        <div><strong>Double Faults</strong></div>
        <div><input type="text" class="stat-input" id="Double Fault" /></div>
      </div>
      <p class="note">Note: Input 3 for set won, 0 for set lost</p>
    `;
    container.innerHTML = customTennisHTML;
    return;
  }

  // Default stat layout for all other leagues
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


window.onload = loadLeagues;
