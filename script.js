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
function format(val) {
  return val % 1 === 0 ? val.toString() : val.toFixed(2);
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
      <div class="group-title">Match Info</div>
      <div class="stat-row">
        <div class="stat-label">Match Played — 10 pts</div>
        <input type="checkbox" class="stat-input" id="stat-Match Played" />
      </div>
    `;
    container.appendChild(matchDiv);

    const gameSetDiv = document.createElement("div");
    gameSetDiv.className = "stat-group";
    gameSetDiv.innerHTML = `<div class="group-title">Game & Set</div>`;
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
    serveDiv.innerHTML = `<div class="group-title">Serve Stats</div>`;
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
          <div class="stat-label">${label}<span class="tooltip">ℹ️<span class="tooltiptext">1 IP = 3 outs; 0.1 IP = 1 out</span></span></div>
          <input type="text" class="stat-input" id="stat-${label}" />
        `;
        container.appendChild(row);
        return;
      }
      if (label === "Quality Start") {
        row.innerHTML = `<div class="stat-label">${label}<span class="tooltip">ℹ️<span class="tooltiptext">Pitch 6+ innings and allow ≤ 3 earned runs</span></span></div>`;
        container.appendChild(row);
        return;
      }
      if (label === "Win") {
        row.innerHTML = `<div class="stat-label">${label} — ${points} pts</div><input type="checkbox" class="stat-input" id="stat-${label}" />`;
        container.appendChild(row);
        return;
      }
    }

    row.innerHTML = `<div class="stat-label">${label} — ${points} pts</div><input type="text" class="stat-input" id="stat-${label}" />`;
    container.appendChild(row);
  });

  if (league.bonuses?.length) {
    const title = document.createElement("h3");
    title.textContent = "Bonus:";
    bonusContainer.appendChild(title);

    league.bonuses.forEach(bonus => {
      const row = document.createElement("div");
      row.className = "bonus-option";
      row.innerHTML = `<label><input type="radio" name="bonus" value="${bonus.points}" />${bonus.label} — ${bonus.points} pts</label>`;
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
      row.innerHTML = `<div class="stat-label">${label} — ${points} pts</div><input type="text" class="stat-input" id="stat-${label}" />`;
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

  if (leagueKey === "nascar") {
    const start = parseInt(document.getElementById("stat-Starting Position")?.value);
    const finish = parseInt(document.getElementById("stat-Finishing Position")?.value);
    const fastest = parseFloat(document.getElementById("stat-Fastest Laps")?.value) || 0;
    const led = parseFloat(document.getElementById("stat-Laps Led")?.value) || 0;

    if (!isNaN(start) && !isNaN(finish)) {
      const diff = start - finish;
      breakdown += `Place Differential: ${diff} pts\n`;
      total += diff;
    }

    const finishingPlacePoints = [45, 42, 41, 40, 39, 38, 37, 36, 35, 34, 32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
    if (!isNaN(finish) && finish >= 1 && finish <= 40) {
      const pts = finishingPlacePoints[finish - 1];
      breakdown += `Finishing Position (${finish}): ${pts} pts\n`;
      total += pts;
    }

    if (!hideZero || fastest !== 0) {
      breakdown += `Fastest Laps: ${fastest} × 0.45 = ${format(fastest * 0.45)}\n`;
      total += fastest * 0.45;
    }
    if (!hideZero || led !== 0) {
      breakdown += `Laps Led: ${led} × 0.25 = ${format(led * 0.25)}\n`;
      total += led * 0.25;
    }

    breakdown += `\nTotal: ${format(total)}`;
    document.getElementById("breakdown").value = breakdown;
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
        const full = Math.floor(val);
        const decimal = val - full;
        const outs = full * 3 + Math.round(decimal * 10);
        breakdown += `${label}: ${val} IP (${outs} outs) = ${format(outs)}\n`;
        total += outs;
        return;
      }
      if (label === "Earned Run") earnedRuns = val;
      if (label === "Quality Start") return;
    }
    if (!hideZero || val !== 0) {
      breakdown += `${label}: ${val} × ${points} = ${format(val * points)}\n`;
    }
    total += val * points;
  });

  if (leagueKey === "mlb_pitcher" && innings >= 6 && earnedRuns <= 3) {
    const qsPoints = Array.isArray(league.stats)
      ? league.stats.find(s => s.label === "Quality Start")?.points || 0
      : league.stats["Quality Start"] || 0;
    breakdown += `Quality Start: 1 × ${qsPoints} = ${format(qsPoints)}\n`;
    total += qsPoints;
  }

  const bonus = document.querySelector('input[name="bonus"]:checked');
  if (bonus) {
    const bonusVal = parseFloat(bonus.value);
    breakdown += `Bonus: +${bonusVal}\n`;
    total += bonusVal;
  }

  breakdown += `\nTotal: ${format(total)}`;

  const extraBox = document.getElementById("extra-breakdown-box");
extraBox.classList.add("hidden");
extraBox.innerHTML = "";

if (leagueKey === "NBA") {
  const pts = parseFloat(document.getElementById("stat-Points")?.value) || 0;
  const reb = parseFloat(document.getElementById("stat-Rebound")?.value) || 0;
  const ast = parseFloat(document.getElementById("stat-Assist")?.value) || 0;

  const pra = pts + reb + ast;
  const pa = pts + ast;
  const pr = pts + reb;
  const ra = reb + ast;

  extraBox.classList.remove("hidden");
  extraBox.innerHTML = `
    <h3>NBA Single Stats</h3>
    Points: ${pts}
    Rebounds: ${reb}
    Assists: ${ast}

    P+R+A = ${pra}
    P+A = ${pa}
    P+R = ${pr}
    R+A = ${ra}
  `;
}

if (leagueKey === "mlb_hitter") {
  const single = parseFloat(document.getElementById("stat-Single")?.value) || 0;
  const doubleHit = parseFloat(document.getElementById("stat-Double")?.value) || 0;
  const triple = parseFloat(document.getElementById("stat-Triple")?.value) || 0;
  const hr = parseFloat(document.getElementById("stat-Home Run")?.value) || 0;
  const run = parseFloat(document.getElementById("stat-Run")?.value) || 0;
  const rbi = parseFloat(document.getElementById("stat-RBI")?.value) || 0;

  const hits = single + doubleHit + triple + hr;
  const sum = hits + run + rbi;

  extraBox.classList.remove("hidden");
  extraBox.innerHTML = `
    <h3>MLB Single Stats</h3>
    Hits = ${single}+${doubleHit}+${triple}+${hr} = ${hits}
    Runs: ${run}
    RBI: ${rbi}

    Hits+Runs+RBI = ${sum}
  `;
}

if (leagueKey === "nfl_cfb") {
  const passYds = parseFloat(document.getElementById("stat-Passing Yards")?.value) || 0;
  const rushYds = parseFloat(document.getElementById("stat-Rushing Yards")?.value) || 0;
  const recYds = parseFloat(document.getElementById("stat-Receiving Yards")?.value) || 0;
  const passTD = parseFloat(document.getElementById("stat-Passing TDs")?.value) || 0;
  const rushTD = parseFloat(document.getElementById("stat-Rushing TDs")?.value) || 0;
  const recTD = parseFloat(document.getElementById("stat-Receiving TDs")?.value) || 0;

  const yds1 = passYds + rushYds;
  const yds2 = rushYds + recYds;
  const td1 = passTD + rushTD;
  const td2 = rushTD + recTD;

  extraBox.classList.remove("hidden");
  extraBox.innerHTML = `
    <h3> Football Single Stats</h3>
    Passing Yards: ${passYds}
    Rushing Yards: ${rushYds}
    Passing TDs: ${passTD}
    Rushing TDs: ${rushTD}
    Receiving TDs: ${recTD}

    Pass + Rec Yards = ${yds1}
    Rush + Rec Yards = ${yds2}
    Pass + Rush TDs = ${td1}
    Rush + Rec TDs = ${td2}
  `;
}

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

document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    calculateScore();
  }
});

window.onload = loadLeagues;
