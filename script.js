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
    const groupDiv = document.createElement("div");
    groupDiv.className = "stat-group";

    const inputs = [
      { label: "Starting Position", id: "Starting Position" },
      { label: "Finishing Position", id: "Finishing Position" },
      { label: "Fastest Laps × 0.45", id: "Fastest Laps" },
      { label: "Laps Led × 0.25", id: "Laps Led" }
    ];

    inputs.forEach(stat => {
      const row = document.createElement("div");
      row.className = "stat-row";
      row.innerHTML = `
        <div class="stat-label">${stat.label}</div>
        <input type="text" class="stat-input" id="stat-${stat.id}" />
      `;
      groupDiv.appendChild(row);
    });

    container.appendChild(groupDiv);
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

  if (league.bonuses?.length > 0) {
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
  let innings = 0;
  let earnedRuns = 0;

  if (leagueKey === "nascar") {
    const getVal = id => parseFloat(document.getElementById(`stat-${id}`)?.value) || 0;
    const start = getVal("Starting Position");
    const finish = getVal("Finishing Position");
    const fastest = getVal("Fastest Laps");
    const led = getVal("Laps Led");

    const diff = start - finish;
    const fastestScore = fastest * 0.45;
    const ledScore = led * 0.25;

    const placePointsMap = [
      45, 42, 41, 40, 39, 38, 37, 36, 35, 34, 32, 31, 30, 29, 28, 27, 26, 25, 24, 23,
      21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1
    ];
    const finishPoints = finish >= 1 && finish <= 40 ? placePointsMap[finish - 1] : 0;

    breakdown += `Place Differential: ${diff} pts\n`;
    breakdown += `Finishing Position (${finish}): ${finishPoints} pts\n`;
    breakdown += `Fastest Laps: ${fastest} × 0.45 = ${fastestScore.toFixed(2)}\n`;
    breakdown += `Laps Led: ${led} × 0.25 = ${ledScore.toFixed(2)}\n`;

    total += diff + finishPoints + fastestScore + ledScore;
    document.getElementById("breakdown").value = breakdown + `\nTotal: ${total.toFixed(2)}`;
    return;
  }

  stats.forEach(([label, points]) => {
    const input = document.getElementById(`stat-${label}`);
    if (!input) return;

    let val = input.type === "checkbox" ? (input.checked ? 1 : 0) : parseFloat(input.value);
    if (isNaN(val)) return;

    if (leagueKey === "mlb_pitcher") {
      if (label === "Innings Pitched") {
        innings = val;
        const outs = Math.floor(val) * 3 + Math.round((val - Math.floor(val)) * 10);
        breakdown += `${label}: ${val} IP (${outs} outs) = ${outs.toFixed(2)}\n`;
        total += outs;
        return;
      }
      if (label === "Earned Run") earnedRuns = val;
      if (label === "Quality Start") return;
    }

    if (val !== 0 || !document.getElementById("hideZero").checked) {
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
    const val = parseFloat(bonus.value);
    breakdown += `Bonus: +${val}\n`;
    total += val;
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
