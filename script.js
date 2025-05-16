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
  const extraBoxes = document.getElementById("extra-breakdowns");

  container.innerHTML = "";
  bonusContainer.innerHTML = "";
  extraBoxes.innerHTML = "";

  const stats = Array.isArray(league.stats)
    ? league.stats.map(s => [s.label, s.points])
    : Object.entries(league.stats);

  if (leagueKey === "nba") {
    extraBoxes.innerHTML = `
      <div class="extra-box">
        <h3>NBA FS Totals</h3>
        <textarea id="nba-pra" readonly></textarea>
        <button onclick="copyExtraBreakdown('nba-pra')">Copy Breakdown</button>
        <textarea id="nba-blkstl" readonly></textarea>
        <button onclick="copyExtraBreakdown('nba-blkstl')">Copy Breakdown</button>
      </div>
    `;
  }

  if (leagueKey === "nfl_cfb") {
    extraBoxes.innerHTML = `
      <div class="extra-box">
        <h3>NFL TD Totals</h3>
        <textarea id="nfl-td" readonly></textarea>
        <button onclick="copyExtraBreakdown('nfl-td')">Copy Breakdown</button>
      </div>
    `;
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

  if (leagueKey === "mlb_hitter") {
    extraBoxes.innerHTML = `
      <div class="extra-box">
        <h3>MLB Hitter Totals</h3>
        <textarea id="mlb-hits" readonly></textarea>
        <button onclick="copyExtraBreakdown('mlb-hits')">Copy Breakdown</button>
      </div>
    `;
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

  renderGroupedStats(container, league.stats, null);

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
  if (!groupMap) {
    const group = document.createElement("div");
    group.className = "stat-group";
    stats.forEach(([label, points]) => {
      const row = document.createElement("div");
      row.className = "stat-row";
      row.innerHTML = `<div class="stat-label">${label} — ${points} pts</div><input type="text" class="stat-input" id="stat-${label}" />`;
      group.appendChild(row);
    });
    container.appendChild(group);
    return;
  }

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
  let hideZero = document.getElementById("hideZero")?.checked;
  let innings = 0, earnedRuns = 0;

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

    const finishingPoints = [45, 42, 41, 40, 39, 38, 37, 36, 35, 34, 32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
    if (!isNaN(finish) && finish >= 1 && finish <= 40) {
      const pts = finishingPoints[finish - 1];
      breakdown += `Finishing Position (${finish}): ${pts} pts\n`;
      total += pts;
    }

    if (!hideZero || fastest !== 0) {
      breakdown += `Fastest Laps: ${fastest} × 0.45 = ${(fastest * 0.45).toFixed(2)}\n`;
      total += fastest * 0.45;
    }
    if (!hideZero || led !== 0) {
      breakdown += `Laps Led: ${led} × 0.25 = ${(led * 0.25).toFixed(2)}\n`;
      total += led * 0.25;
    }

    breakdown += `\nTotal FS: ${total.toFixed(2)}`;
    document.getElementById("breakdown").value = breakdown;
    return;
  }

  let nbaPRA = 0, nbaBlkStl = 0;
  let nflTDs = 0;
  let mlbHitsRBIs = 0;

  stats.forEach(([label, points]) => {
    const input = document.getElementById(`stat-${label}`);
    if (!input) return;

    let val = input.type === "checkbox" ? (input.checked ? 1 : 0) : parseFloat(input.value);
    if (isNaN(val)) return;

    if (!hideZero || val !== 0) {
      breakdown += `${label}: ${val} × ${points} = ${(val * points).toFixed(2)}\n`;
    }
    total += val * points;

    if (leagueKey === "nba") {
      if (["Points", "Rebound", "Assist"].includes(label)) nbaPRA += val;
      if (["Block", "Steal"].includes(label)) nbaBlkStl += val;
    }

    if (leagueKey === "nfl_cfb" && ["Rushing TDs", "Receiving TDs"].includes(label)) {
      nflTDs += val;
    }

    if (leagueKey === "mlb_hitter") {
      if (["Single", "Double", "Triple", "Home Run", "Run", "RBI"].includes(label)) {
        mlbHitsRBIs += val;
      }
    }

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

  breakdown += `\nTotal FS: ${total.toFixed(2)}`;
  document.getElementById("breakdown").value = breakdown;

  // Inject auto breakdowns
  if (leagueKey === "nba") {
    document.getElementById("nba-pra").value = `P+R+A: ${nbaPRA}`;
    document.getElementById("nba-blkstl").value = `Blk+Stl: ${nbaBlkStl}`;
  }
  if (leagueKey === "nfl_cfb") {
    document.getElementById("nfl-td").value = `Rush TD + Rec TD: ${nflTDs}`;
  }
  if (leagueKey === "mlb_hitter") {
    document.getElementById("mlb-hits").value = `Hits+Runs+RBI: ${mlbHitsRBIs}`;
  }
}

function clearInputs() {
  document.querySelectorAll(".stat-input").forEach(input => {
    if (input.type === "checkbox") input.checked = false;
    else input.value = "";
  });
  document.getElementById("breakdown").value = "";
  ["nba-pra", "nba-blkstl", "nfl-td", "mlb-hits"].forEach(id => {
    if (document.getElementById(id)) document.getElementById(id).value = "";
  });
  const selectedBonus = document.querySelector('input[name="bonus"]:checked');
  if (selectedBonus) selectedBonus.checked = false;
}

function copyBreakdown() {
  const breakdown = document.getElementById("breakdown");
  breakdown.select();
  document.execCommand("copy");
}

function copyExtraBreakdown(id) {
  const box = document.getElementById(id);
  if (box) {
    box.select();
    document.execCommand("copy");
  }
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    calculateScore();
  }
});

window.onload = loadLeagues;
