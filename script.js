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

  if (leagueKey === "nfl_cfb") {
    const groups = {
      "Passing": ["Passing Yards", "Passing TDs", "Interceptions"],
      "Rushing": ["Rushing Yards", "Rushing TDs"],
      "Receiving": ["Receiving Yards", "Receiving TDs", "Receptions"],
      "Turnovers": ["Fumbles Lost"],
      "Misc": ["2 Point Conversions", "Offensive Fumble Recovery TD", "Kick/Punt/Field Goal Return TD"]
    };
    renderGroupedStats(container, league.stats, groups);
    return;
  }

  if (leagueKey === "dst") {
    const dstGroups = {
      "Standard Defensive Stats": ["Sack", "Interception", "Fumble Recovery"],
      "Return TDs": ["Punt/Kickoff/FG Return for TD", "Interception Return TD", "Fumble Recovery TD", "Blocked Punt or FG Return TD"],
      "Special Teams / Misc": ["Safety", "Blocked Kick", "2pt/XP Return"]
    };
    renderGroupedStats(container, league.stats, dstGroups);
    return;
  }

  if (leagueKey === "mlb_hitter") {
    const hitterGroups = {
      "Hitting Stats": ["Single", "Double", "Triple", "Home Run"],
      "Run/RBI Stats": ["Run", "RBI"],
      "Other Stats": ["BB", "HBP", "SB"]
    };
    renderGroupedStats(container, league.stats, hitterGroups);
    return;
  }

  if (leagueKey === "tennis") {
    const matchDiv = document.createElement("div");
    matchDiv.className = "stat-group";
    matchDiv.innerHTML = `
      <label>Player Name:</label>
      <input type="text" class="stat-input" id="player-name" placeholder="Player Name" />
      <div class="group-title">Match Info</div>
      <div class="stat-row">
        <div class="stat-label">Match Played — 10 pts</div>
        <input type="checkbox" class="stat-input" id="stat-Match Played" />
      </div>
    `;
    container.appendChild(matchDiv);

    const gameSetDiv = document.createElement("div");
    gameSetDiv.className = "stat-group";
    gameSetDiv.innerHTML = `
      <label>Player Name:</label>
      <input type="text" class="stat-input" disabled />
      <div class="group-title">Game & Set</div>
    `;
    ["Game Won", "Game Loss", "Set Won", "Set Loss"].forEach(stat => {
      const points = league.stats[stat];
      gameSetDiv.innerHTML += `
        <div class="stat-row">
          <div class="stat-label">${stat} — ${points} pts</div>
          <input type="text" class="stat-input" id="stat-${stat}" />
        </div>
      `;
    });
    container.appendChild(gameSetDiv);

    const serveDiv = document.createElement("div");
    serveDiv.className = "stat-group";
    serveDiv.innerHTML = `
      <label>Player Name:</label>
      <input type="text" class="stat-input" disabled />
      <div class="group-title">Serve Stats</div>
    `;
    ["Ace", "Double Fault"].forEach(stat => {
      const points = league.stats[stat];
      serveDiv.innerHTML += `
        <div class="stat-row">
          <div class="stat-label">${stat} — ${points} pts</div>
          <input type="text" class="stat-input" id="stat-${stat}" />
        </div>
      `;
    });
    container.appendChild(serveDiv);

    return;
  }

  if (leagueKey === "nascar") {
    const custom = document.createElement("div");
    custom.className = "stat-group";
    custom.innerHTML = `
      <div class="stat-row"><div class="stat-label">Starting Position</div><input type="text" class="stat-input" id="stat-Starting Position" /></div>
      <div class="stat-row"><div class="stat-label">Finishing Position</div><input type="text" class="stat-input" id="stat-Finishing Position" /></div>
      <div class="stat-row"><div class="stat-label">Fastest Laps × 0.45</div><input type="text" class="stat-input" id="stat-Fastest Laps" /></div>
      <div class="stat-row"><div class="stat-label">Laps Led × 0.25</div><input type="text" class="stat-input" id="stat-Laps Led" /></div>
    `;
    container.appendChild(custom);
    return;
  }

  stats.forEach(([label, points]) => {
    const row = document.createElement("div");
    row.className = "stat-row";

    if (leagueKey === "mlb_pitcher") {
      if (label === "Innings Pitched") {
        row.innerHTML = `
          <div class="stat-label">${label}
            <span class="tooltip">ℹ️<span class="tooltiptext">1 IP = 3 outs; 0.1 IP = 1 out</span></span>
          </div>
          <input type="text" class="stat-input" id="stat-${label}" />
        `;
        container.appendChild(row);
        return;
      }
      if (label === "Quality Start") {
        row.innerHTML = `
          <div class="stat-label">${label}
            <span class="tooltip">ℹ️<span class="tooltiptext">Pitch 6+ innings and allow ≤ 3 earned runs</span></span>
          </div>`;
        container.appendChild(row);
        return;
      }
      if (label === "Win") {
        row.innerHTML = `
          <div class="stat-label">${label} — ${points} pts</div>
          <input type="checkbox" class="stat-input" id="stat-${label}" />
        `;
        container.appendChild(row);
        return;
      }
    }

    row.innerHTML = `
      <div class="stat-label">${label} — ${points} pts</div>
      <input type="text" class="stat-input" id="stat-${label}" />
    `;
    container.appendChild(row);
  });

  if (league.bonuses?.length) {
    const title = document.createElement("h3");
    title.textContent = "Bonus:";
    bonusContainer.appendChild(title);

    league.bonuses.forEach(bonus => {
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

function renderGroupedStats(container, stats, groupMap) {
  for (const [groupName, labels] of Object.entries(groupMap)) {
    const groupDiv = document.createElement("div");
    groupDiv.className = "stat-group";

    const groupTitle = document.createElement("div");
    groupTitle.className = "group-title";
    groupTitle.textContent = groupName;
    groupDiv.appendChild(groupTitle);

    labels.forEach(label => {
      const points = Array.isArray(stats)
        ? stats.find(s => s.label === label)?.points
        : stats[label];
      if (points === undefined) return;
      const row = document.createElement("div");
      row.className = "stat-row";
      row.innerHTML = `
        <div class="stat-label">${label} — ${points} pts</div>
        <input type="text" class="stat-input" id="stat-${label}" />
      `;
      groupDiv.appendChild(row);
    });

    container.appendChild(groupDiv);
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
  let innings = 0, earnedRuns = 0;

  const hideZero = document.getElementById("hideZero")?.checked;

  stats.forEach(([label, points]) => {
    const input = document.getElementById(`stat-${label}`);
    if (!input) return;

    let val = input.type === "checkbox" ? (input.checked ? 1 : 0) : parseFloat(input.value);
    if (isNaN(val)) return;

    if (leagueKey === "mlb_pitcher") {
      if (label === "Innings Pitched") {
        innings = val;
        const full = Math.floor(val);
        const decimal = val - full;
        const outs = full * 3 + Math.round(decimal * 10);
        breakdown += `${label}: ${val} IP (${outs} outs) = ${outs.toFixed(2)}\n`;
        total += outs;
        return;
      }
      if (label === "Earned Run") earnedRuns = val;
      if (label === "Quality Start") return;
    }

    if (!hideZero || val !== 0) {
      breakdown += `${label}: ${val} × ${points} = ${(val * points).toFixed(2)}\n`;
    }
    total += val * points;
  });

  if (leagueKey === "mlb_pitcher" && innings >= 6 && earnedRuns <= 3) {
    const qsPoints = Array.isArray(league.stats)
      ? league.stats.find(s => s.label === "Quality Start")?.points || 0
      : league.stats["Quality Start"] || 0;
    breakdown += `Quality Start: 1 × ${qsPoints} = ${qsPoints.toFixed(2)}\n`;
    total += qsPoints;
  }

  const bonus = document.querySelector('input[name="bonus"]:checked');
  if (bonus) {
    const bonusVal = parseFloat(bonus.value);
    breakdown += `Bonus: +${bonusVal}\n`;
    total += bonusVal;
  }

  breakdown += `\nTotal: ${total.toFixed(2)}`;
  document.getElementById("breakdown").value = breakdown;
}

function clearInputs() {
  document.querySelectorAll(".stat-input").forEach(input => {
    if (input.type === "checkbox") input.checked = false;
    else input.value = "";
  });
  document.getElementById("breakdown").value = "";
  const selectedBonus = document.querySelector('input[name="bonus"]:checked');
  if (selectedBonus) selectedBonus.checked = false;
}

function copyBreakdown() {
  const breakdown = document.getElementById("breakdown");
  breakdown.select();
  document.execCommand("copy");
}

// Allow Enter key to calculate score
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    calculateScore();
  }
});

window.onload = loadLeagues;
