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
  const extraContainer = document.getElementById("extra-breakdowns");
  container.innerHTML = "";
  bonusContainer.innerHTML = "";
  extraContainer.innerHTML = "";

  const stats = Array.isArray(league.stats)
    ? league.stats.map(s => [s.label, s.points])
    : Object.entries(league.stats);

  const addExtraBox = (id, label) => {
    const box = document.createElement("div");
    box.innerHTML = `<label>${label}:</label><textarea id="${id}" readonly class="extra-box"></textarea><button class="copy" onclick="copyBox('${id}')">Copy</button>`;
    extraContainer.appendChild(box);
  };

  // Show additional breakdowns conditionally
  if (leagueKey === "NBA") {
    addExtraBox("nba-breakdown", "NBA Breakdown (PRA, PA, PR, RA, Blk+Stl)");
  } else if (leagueKey === "mlb_hitter") {
    addExtraBox("mlb-breakdown", "MLB Hitter Breakdown");
  } else if (leagueKey === "nfl_cfb") {
    addExtraBox("nfl-breakdown", "NFL Offensive Breakdown");
  }

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

  if (leagueKey === "mlb_pitcher") {
    const groups = {
      "Pitching Stats": ["Win", "Earned Run", "Strikeout", "Innings Pitched"]
    };
    renderGroupedStats(container, league.stats, groups);
    const qsRow = document.createElement("div");
    qsRow.className = "stat-row";
    qsRow.innerHTML = `<div class="stat-label">Quality Start<span class="tooltip">ℹ️<span class="tooltiptext">Auto-added: 6+ IP and ≤ 3 ER = 4 pts</span></span></div>`;
    container.appendChild(qsRow);
    return;
  }

  if (leagueKey === "tennis") {
    const matchDiv = document.createElement("div");
    matchDiv.className = "stat-group";
    matchDiv.innerHTML = `<div class="group-title">Match Info</div>
      <div class="stat-row"><div class="stat-label">Match Played — 10 pts</div>
      <input type="checkbox" class="stat-input" id="stat-Match Played" /></div>`;
    container.appendChild(matchDiv);

    const gameSetDiv = document.createElement("div");
    gameSetDiv.className = "stat-group";
    gameSetDiv.innerHTML = `<div class="group-title">Game & Set</div>`;
    ["Game Won", "Game Loss", "Set Won", "Set Loss"].forEach(stat => {
      const points = league.stats[stat];
      gameSetDiv.innerHTML += `<div class="stat-row"><div class="stat-label">${stat} — ${points} pts</div>
      <input type="text" class="stat-input" id="stat-${stat}" /></div>`;
    });
    container.appendChild(gameSetDiv);

    const serveDiv = document.createElement("div");
    serveDiv.className = "stat-group";
    serveDiv.innerHTML = `<div class="group-title">Serve Stats</div>`;
    ["Ace", "Double Fault"].forEach(stat => {
      const points = league.stats[stat];
      serveDiv.innerHTML += `<div class="stat-row"><div class="stat-label">${stat} — ${points} pts</div>
      <input type="text" class="stat-input" id="stat-${stat}" /></div>`;
    });
    container.appendChild(serveDiv);
    return;
  }

  if (leagueKey === "nascar") {
    const group = document.createElement("div");
    group.className = "stat-group";
    group.innerHTML = `
      <div class="group-title">Nascar Stats</div>
      <div class="stat-row"><div class="stat-label">Starting Position</div><input type="text" class="stat-input" id="stat-Starting Position" /></div>
      <div class="stat-row"><div class="stat-label">Finishing Position</div><input type="text" class="stat-input" id="stat-Finishing Position" /></div>
      <div class="stat-row"><div class="stat-label">Fastest Laps × 0.45</div><input type="text" class="stat-input" id="stat-Fastest Laps" /></div>
      <div class="stat-row"><div class="stat-label">Laps Led × 0.25</div><input type="text" class="stat-input" id="stat-Laps Led" /></div>
    `;
    container.appendChild(group);
    return;
  }

  // Default stat layout
  stats.forEach(([label, points]) => {
    const row = document.createElement("div");
    row.className = "stat-row";
    const inputType = label === "Win" ? "checkbox" : "text";
    row.innerHTML = `<div class="stat-label">${label} — ${points} pts</div>
                     <input type="${inputType}" class="stat-input" id="stat-${label}" />`;
    container.appendChild(row);
  });

  if (league.bonuses?.length) {
    const title = document.createElement("h3");
    title.textContent = "Bonus:";
    bonusContainer.appendChild(title);
    league.bonuses.forEach(bonus => {
      const row = document.createElement("div");
      row.className = "bonus-option";
      row.innerHTML = `<label><input type="radio" name="bonus" value="${bonus.points}" />
                       ${bonus.label} — ${bonus.points} pts</label>`;
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
      const inputType = label === "Win" ? "checkbox" : "text";
      const row = document.createElement("div");
      row.className = "stat-row";
      row.innerHTML = `<div class="stat-label">${label} — ${points} pts</div>
                       <input type="${inputType}" class="stat-input" id="stat-${label}" />`;
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

  const getVal = id => {
    const input = document.getElementById(`stat-${id}`);
    return input ? (input.type === "checkbox" ? (input.checked ? 1 : 0) : parseFloat(input.value) || 0) : 0;
  };

  // Special case: NASCAR
  if (leagueKey === "nascar") {
    const start = getVal("Starting Position");
    const finish = getVal("Finishing Position");
    const fastest = getVal("Fastest Laps");
    const led = getVal("Laps Led");

    if (!isNaN(start) && !isNaN(finish)) {
      const diff = start - finish;
      breakdown += `Place Differential: ${diff} pts\n`;
      total += diff;
    }

    const finishPts = [45, 42, 41, 40, 39, 38, 37, 36, 35, 34, 32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
    if (finish >= 1 && finish <= 40) {
      const pts = finishPts[finish - 1];
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

  // Auto-breakdown accumulators
  let nba = { pts: 0, reb: 0, ast: 0, blk: 0, stl: 0 };
  let mlb = { single: 0, double: 0, triple: 0, hr: 0, run: 0, rbi: 0, bb: 0, hbp: 0 };
  let nfl = { passYds: 0, rushYds: 0, recYds: 0, passTD: 0, rushTD: 0, recTD: 0 };

  stats.forEach(([label, points]) => {
    const val = getVal(label);
    if (isNaN(val)) return;

    if (leagueKey === "mlb_pitcher") {
    if (label === "Innings Pitched") {
        innings = val;
        const fullInnings = Math.floor(val);
        const decimalPart = Math.round((val - fullInnings) * 10); // should be 0, 1, or 2
        const outs = fullInnings * 3 + decimalPart;
        const ipPoints = outs * points;
        breakdown += `${label}: ${val} IP (${outs} outs) × ${points} = ${ipPoints.toFixed(2)}\n`;
        total += ipPoints;
        return;
      }


      if (![0, 1, 2].includes(decimalPart)) {
        breakdown += `⚠️ Invalid IP decimal: use only .0, .1, or .2\n`;
      }

      if (label === "Earned Run") earnedRuns = val;
      if (label === "Quality Start") return;
    }

    if (!hideZero || val !== 0) {
      breakdown += `${label}: ${val} × ${points} = ${(val * points).toFixed(2)}\n`;
    }

    // Accumulate breakdowns
    if (leagueKey === "NBA") {
      if (label === "Points") nba.pts = val;
      if (label === "Rebound") nba.reb = val;
      if (label === "Assist") nba.ast = val;
      if (label === "Block") nba.blk = val;
      if (label === "Steal") nba.stl = val;
    };

    if (leagueKey === "mlb_hitter") {
      if (label === "Single") mlb.single = val;
      if (label === "Double") mlb.double = val;
      if (label === "Triple") mlb.triple = val;
      if (label === "Home Run") mlb.hr = val;
      if (label === "Run") mlb.run = val;
      if (label === "RBI") mlb.rbi = val;
      if (label === "BB") mlb.bb = val;
      if (label === "HBP") mlb.hbp = val;
    }

    if (leagueKey === "nfl_cfb") {
      if (label === "Passing Yards") nfl.passYds = val;
      if (label === "Rushing Yards") nfl.rushYds = val;
      if (label === "Receiving Yards") nfl.recYds = val;
      if (label === "Passing TDs") nfl.passTD = val;
      if (label === "Rushing TDs") nfl.rushTD = val;
      if (label === "Receiving TDs") nfl.recTD = val;
    }
  });

  if (leagueKey === "mlb_pitcher" && innings >= 6 && earnedRuns <= 3) {
    const pts = league.stats["Quality Start"];
    breakdown += `Quality Start: 1 × ${pts} = ${pts.toFixed(2)}\n`;
    total += pts;
  }

  const bonus = document.querySelector('input[name="bonus"]:checked');
  if (bonus) {
    const val = parseFloat(bonus.value);
    breakdown += `Bonus: +${val}\n`;
    total += val;
  }

  document.getElementById("breakdown").value = breakdown + `\nTotal FS: ${total.toFixed(2)}`;

  // Output extra breakdowns
  if (leagueKey === "NBA") {
    const pra = nba.pts + nba.reb + nba.ast;
    const pa = nba.pts + nba.ast;
    const pr = nba.pts + nba.reb;
    const ra = nba.reb + nba.ast;
    const bs = nba.blk + nba.stl;
    document.getElementById("nba-breakdown").value =
      `P+R+A = ${pra}\nP+A = ${pa}\nP+R = ${pr}\nR+A = ${ra}\nBlk+Stl = ${bs}`;
  }

  if (leagueKey === "mlb_hitter") {
    const hits = mlb.single + mlb.double + mlb.triple + mlb.hr;
    const total1 = hits + mlb.run + mlb.rbi;
    const total2 = hits + mlb.bb;
    const total3 = hits + mlb.bb + mlb.hbp;
    document.getElementById("mlb-breakdown").value =
      `Hits+Runs+RBI = ${total1}\nHits+Walks = ${total2}\nHits+Walks+HBP = ${total3}`;
  }

  if (leagueKey === "nfl_cfb") {
    const passRushYards = nfl.passYds + nfl.rushYds;
    const rushRecYards = nfl.rushYds + nfl.recYds;
    const passRushTD = nfl.passTD + nfl.rushTD;
    const rushRecTD = nfl.rushTD + nfl.recTD;
    document.getElementById("nfl-breakdown").value =
      `Pass+Rush Yds = ${passRushYards}\nRush+Rec Yds = ${rushRecYards}\nPass+Rush TD = ${passRushTD}\nRush+Rec TD = ${rushRecTD}`;
  }
}

function clearInputs() {
  document.querySelectorAll(".stat-input").forEach(input => {
    input.type === "checkbox" ? input.checked = false : input.value = "";
  });
  document.getElementById("breakdown").value = "";
  ["nba-breakdown", "mlb-breakdown", "nfl-breakdown"].forEach(id => {
    const box = document.getElementById(id);
    if (box) box.value = "";
  });
  const bonus = document.querySelector('input[name="bonus"]:checked');
  if (bonus) bonus.checked = false;
}

function copyBreakdown() {
  const breakdown = document.getElementById("breakdown");
  breakdown.select();
  document.execCommand("copy");
}

function copyBox(id) {
  const box = document.getElementById(id);
  box.select();
  document.execCommand("copy");
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    calculateScore();
  }
});

window.onload = loadLeagues;
