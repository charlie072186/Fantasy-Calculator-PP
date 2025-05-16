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
      "Return TDs": [
        "Punt/Kickoff/FG Return for TD",
        "Interception Return TD",
        "Fumble Recovery TD",
        "Blocked Punt or FG Return TD"
      ],
      "Special Teams / Misc": [
        "Safety",
        "Blocked Kick",
        "2pt/XP Return"
      ]
    };
    renderGroupedStats(container, league.stats, dstGroups);
    return;
  }

  if (leagueKey === "nascar") {
    const custom = document.createElement("div");
    custom.className = "stat-group";
    custom.innerHTML = `
      <div class="stat-row"><div class="stat-label">Starting Position</div><input type="text" class="stat-input" id="stat-Starting Position"></div>
      <div class="stat-row"><div class="stat-label">Finishing Position</div><input type="text" class="stat-input" id="stat-Finishing Position"></div>
      <div class="stat-row"><div class="stat-label">Fastest Laps × 0.45</div><input type="text" class="stat-input" id="stat-Fastest Laps"></div>
      <div class="stat-row"><div class="stat-label">Laps Led × 0.25</div><input type="text" class="stat-input" id="stat-Laps Led"></div>
    `;
    container.appendChild(custom);
    return;
  }

  if (leagueKey === "nascar") {
  // NASCAR custom rendering
  const nascarGroup = document.createElement("div");
  nascarGroup.className = "stat-group";

  const title = document.createElement("div");
  title.className = "group-title";
  title.textContent = "NASCAR Stats";
  nascarGroup.appendChild(title);

  ["Starting Position", "Finishing Position", "Fastest Laps", "Laps Led"].forEach(label => {
    const points = league.stats[label];
    const row = document.createElement("div");
    row.className = "stat-row";
    row.innerHTML = `
      <div class="stat-label">${label}${(label === "Fastest Laps" || label === "Laps Led") ? ` — ${points} pts` : ""}</div>
      <input type="text" class="stat-input" id="stat-${label}" />
    `;
    nascarGroup.appendChild(row);
  });

  container.appendChild(nascarGroup);
  return;
}

  
  stats.forEach(([label, points]) => {
    const row = document.createElement("div");
    row.className = "stat-row";

    if (leagueKey === "mlb_pitcher") {
      if (label === "Innings Pitched") {
        row.innerHTML = `
          <div class="stat-label">${label}
            <span class="tooltip">ℹ️
              <span class="tooltiptext">1 IP = 3 outs; 0.1 IP = 1 out</span>
            </span>
          </div>
          <input type="text" class="stat-input" id="stat-${label}" />
        `;
        container.appendChild(row);
        return;
      }
      if (label === "Quality Start") {
        row.innerHTML = `
          <div class="stat-label">${label}
            <span class="tooltip">ℹ️
              <span class="tooltiptext">Pitch 6+ innings and allow ≤ 3 earned runs</span>
            </span>
          </div>
        `; 
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

  if (league.bonuses && league.bonuses.length > 0) {
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

if (leagueKey === "nascar") {
  let sp = parseInt(document.getElementById("stat-Starting Position")?.value || 0);
  let fp = parseInt(document.getElementById("stat-Finishing Position")?.value || 0);
  let fastestLaps = parseFloat(document.getElementById("stat-Fastest Laps")?.value || 0);
  let lapsLed = parseFloat(document.getElementById("stat-Laps Led")?.value || 0);

  const placeDiff = sp - fp;
  const flPts = fastestLaps * 0.45;
  const llPts = lapsLed * 0.25;

  const finishPointsMap = {
    1: 45, 2: 42, 3: 41, 4: 40, 5: 39, 6: 38, 7: 37, 8: 36, 9: 35, 10: 34,
    11: 32, 12: 31, 13: 30, 14: 29, 15: 28, 16: 27, 17: 26, 18: 25, 19: 24, 20: 23,
    21: 21, 22: 20, 23: 19, 24: 18, 25: 17, 26: 16, 27: 15, 28: 14, 29: 13, 30: 12,
    31: 10, 32: 9, 33: 8, 34: 7, 35: 6, 36: 5, 37: 4, 38: 3, 39: 2, 40: 1
  };
  const finishPts = finishPointsMap[fp] ?? 0;

  breakdown += `Place Differential: ${sp} - ${fp} = ${placeDiff}\n`;
  breakdown += `Fastest Laps: ${fastestLaps} × 0.45 = ${flPts.toFixed(2)}\n`;
  breakdown += `Laps Led: ${lapsLed} × 0.25 = ${llPts.toFixed(2)}\n`;
  breakdown += `Finishing Place Points: ${fp} = ${finishPts} pts\n`;

  total += placeDiff + flPts + llPts + finishPts;
  document.getElementById("breakdown").value = breakdown + `\nTotal: ${total.toFixed(2)}`;
  return;
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
  let innings = 0;
  let earnedRuns = 0;

  stats.forEach(([label, points]) => {
    const input = document.getElementById(`stat-${label}`);
    if (!input) return;

    let val;
    if (input.type === "checkbox") {
      val = input.checked ? 1 : 0;
    } else {
      val = parseFloat(input.value);
    }
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

      if (label === "Earned Run") {
        earnedRuns = val;
      }

      if (label === "Quality Start") {
        return; // Auto-computed
      }
    }

    if (val !== 0 || !document.getElementById("hideZero").checked) {
      breakdown += `${label}: ${val} × ${points} = ${(val * points).toFixed(2)}\n`;
    }
    total += val * points;
  });


  if (leagueKey === "mlb_pitcher" && innings >= 6 && earnedRuns <= 3) {
    let qsPoints = 0;
    if (Array.isArray(league.stats)) {
      const qsStat = league.stats.find(s => s.label === "Quality Start");
      qsPoints = qsStat?.points || 0;
    } else {
      qsPoints = league.stats["Quality Start"] || 0;
    }
    breakdown += `Quality Start: 1 × ${qsPoints} = ${qsPoints.toFixed(2)}\n`;
    total += qsPoints;
  }
  
  if (leagueKey === "nascar") {
    const startInput = parseInt(document.getElementById("stat-Starting Position")?.value);
    const finishInput = parseInt(document.getElementById("stat-Finishing Position")?.value);
    const fastestLaps = parseFloat(document.getElementById("stat-Fastest Laps")?.value) || 0;
    const lapsLed = parseFloat(document.getElementById("stat-Laps Led")?.value) || 0;

    if (!isNaN(startInput) && !isNaN(finishInput)) {
      const placeDiff = startInput - finishInput;
      total += placeDiff;
      breakdown += `Place Differential: ${placeDiff} pts\n`;

      const finishingPoints = finishInput >= 1 && finishInput <= 40
        ? [45, 42, 41, 40, 39, 38, 37, 36, 35, 34, 32, 31, 30, 29, 28, 27, 26, 25, 24, 23,
           21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1][finishInput - 1]
        : 0;
      total += finishingPoints;
      breakdown += `Finishing Position (${finishInput}): ${finishingPoints} pts\n`;
    }

    const flPoints = fastestLaps * 0.45;
    const ledPoints = lapsLed * 0.25;
    if (fastestLaps) breakdown += `Fastest Laps: ${fastestLaps} × 0.45 = ${flPoints.toFixed(2)}\n`;
    if (lapsLed) breakdown += `Laps Led: ${lapsLed} × 0.25 = ${ledPoints.toFixed(2)}\n`;

    total += flPoints + ledPoints;
  }

  
  const bonus = document.querySelector('input[name="bonus"]:checked');
  if (bonus) {
    const bonusVal = parseFloat(bonus.value);
    breakdown += `Bonus: +${bonusVal}\n`;
    total += bonusVal;
  }

  document.getElementById("breakdown").value = breakdown + `\nTotal: ${total.toFixed(2)}`;
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

window.onload = loadLeagues;
