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
    box.innerHTML = `
      <label>${label}:</label>
      <textarea id="${id}" readonly class="extra-box"></textarea>
      <button class="copy" onclick="copyBox('${id}')">Copy</button>`;
    extraContainer.appendChild(box);
  };

  if (leagueKey === "NBA") addExtraBox("nba-breakdown", "NBA Breakdown");
  if (leagueKey === "mlb_hitter") addExtraBox("mlb-breakdown", "MLB Hitter Breakdown");
  if (leagueKey === "nfl_cfb") addExtraBox("nfl-breakdown", "NFL Offensive Breakdown");

  if (leagueKey === "nfl_cfb") {
    renderGroupedStats(container, league.stats, {
      "Passing": ["Passing Yards", "Passing TDs", "Interceptions"],
      "Rushing": ["Rushing Yards", "Rushing TDs"],
      "Receiving": ["Receiving Yards", "Receiving TDs", "Receptions"],
      "Turnovers": ["Fumbles Lost"],
      "Misc": ["2 Point Conversions", "Offensive Fumble Recovery TD", "Kick/Punt/Field Goal Return TD"]
    });
    return;
  }

  if (leagueKey === "dst") {
    renderGroupedStats(container, league.stats, {
      "Standard Defensive Stats": ["Sack", "Interception", "Fumble Recovery"],
      "Return TDs": ["Punt/Kickoff/FG Return for TD", "Interception Return TD", "Fumble Recovery TD", "Blocked Punt or FG Return TD"],
      "Special Teams / Misc": ["Safety", "Blocked Kick", "2pt/XP Return"]
    });
    return;
  }

  if (leagueKey === "mlb_hitter") {
    renderGroupedStats(container, league.stats, {
      "Hitting Stats": ["Single", "Double", "Triple", "Home Run"],
      "Run/RBI Stats": ["Run", "RBI"],
      "Other Stats": ["BB", "HBP", "SB"]
    });
    return;
  }

  if (leagueKey === "mlb_pitcher") {
    renderGroupedStats(container, league.stats, {
      "Pitching Stats": ["Win", "Earned Run", "Strikeout", "Innings Pitched"]
    });
    const row = document.createElement("div");
    row.className = "stat-row";
    row.innerHTML = `
      <div class="stat-label">Quality Start
        <span class="tooltip">ℹ️
          <span class="tooltiptext">Auto: 6+ IP and ≤ 3 ER = +4 pts</span>
        </span>
      </div>`;
    container.appendChild(row);
    return;
  }

  if (leagueKey === "tennis") {
    const matchDiv = document.createElement("div");
    matchDiv.className = "stat-group";
    matchDiv.innerHTML = `
      <div class="group-title">Match Info</div>
      <div class="stat-row"><div class="stat-label">Match Played — 10 pts</div>
      <input type="checkbox" class="stat-input" id="stat-Match Played" /></div>`;
    container.appendChild(matchDiv);

    const setStats = ["Game Won", "Game Loss", "Set Won", "Set Loss"];
    const serveStats = ["Ace", "Double Fault"];
    renderGroupedStats(container, league.stats, {
      "Game & Set": setStats,
      "Serve Stats": serveStats
    });
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

  // Default for any other league
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
    const group = document.createElement("div");
    group.className = "stat-group";
    const title = document.createElement("div");
    title.className = "group-title";
    title.textContent = groupName;
    group.appendChild(title);

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
      group.appendChild(row);
    });

    container.appendChild(group);
  }
}

function calculateScore() {
  const leagueKey = document.getElementById("league").value;
  const league = leagues[leagueKey];
  const stats = Array.isArray(league.stats)
    ? league.stats.map(s => [s.label, s.points])
    : Object.entries(league.stats);

  let total = 0, breakdown = "", innings = 0, earnedRuns = 0;
  const hideZero = document.getElementById("hideZero")?.checked;

  const getVal = id => {
    const input = document.getElementById(`stat-${id}`);
    return input ? (input.type === "checkbox" ? (input.checked ? 1 : 0) : parseFloat(input.value) || 0) : 0;
  };

  // NASCAR special handling
  if (leagueKey === "nascar") {
    const start = getVal("Starting Position");
    const finish = getVal("Finishing Position");
    const fastest = getVal("Fastest Laps");
    const led = getVal("Laps Led");

    if (!isNaN(start) && !isNaN(finish)) {
      breakdown += `Place Differential: ${start - finish} pts\n`;
      total += start - finish;
    }

    const finishPts = [45, 42, 41, 40, 39, 38, 37, 36, 35, 34, 32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
    if (finish >= 1 && finish <= 40) {
      const pts = finishPts[finish - 1];
      breakdown += `Finishing Position (${finish}): ${pts} pts\n`;
      total += pts;
    }

    if (!hideZero || fastest) {
      breakdown += `Fastest Laps: ${fastest} × 0.45 = ${(fastest * 0.45).toFixed(2)}\n`;
      total += fastest * 0.45;
    }

    if (!hideZero || led) {
      breakdown += `Laps Led: ${led} × 0.25 = ${(led * 0.25).toFixed(2)}\n`;
      total += led * 0.25;
    }

    document.getElementById("breakdown").value = breakdown + `\nTotal FS: ${total.toFixed(2)}`;
    return;
  }

  // NBA / MLB Hitter / NFL accumulators
  let nba = {}, mlb = {}, nfl = {};

  stats.forEach(([label, points]) => {
    const val = getVal(label);
    if (isNaN(val)) return;

    if (leagueKey === "mlb_pitcher" && label === "Innings Pitched") {
      innings = val;
      const full = Math.floor(val);
      const decimal = Math.round((val - full) * 10);
      if (![0, 1, 2].includes(decimal)) {
        breakdown += `⚠️ Invalid IP decimal (use .0, .1, or .2)\n`;
        return;
      }
      const outs = full * 3 + decimal;
      breakdown += `${label}: ${val} IP = ${outs} outs × ${points} = ${(outs * points).toFixed(2)}\n`;
      total += outs * points;
      return;
    }

    if (leagueKey === "mlb_pitcher" && label === "Earned Run") earnedRuns = val;
    if (leagueKey === "mlb_pitcher" && label === "Quality Start") return;

    if (!hideZero || val !== 0)
      breakdown += `${label}: ${val} × ${points} = ${(val * points).toFixed(2)}\n`;

    total += val * points;

    if (leagueKey === "NBA") nba[label] = val;
    if (leagueKey === "mlb_hitter") mlb[label] = val;
    if (leagueKey === "nfl_cfb") nfl[label] = val;
  });

  // Auto Quality Start
  if (leagueKey === "mlb_pitcher" && innings >= 6 && earnedRuns <= 3) {
    const qsPts = Array.isArray(league.stats)
      ? league.stats.find(s => s.label === "Quality Start")?.points || 0
      : league.stats["Quality Start"] || 0;
    breakdown += `Quality Start: 1 × ${qsPts} = ${qsPts.toFixed(2)}\n`;
    total += qsPts;
  }

  // Bonus
  const bonus = document.querySelector('input[name="bonus"]:checked');
  if (bonus) {
    const val = parseFloat(bonus.value);
    breakdown += `Bonus: +${val}\n`;
    total += val;
  }

  document.getElementById("breakdown").value = breakdown + `\nTotal FS: ${total.toFixed(2)}`;

  // NBA breakdown
  if (leagueKey === "NBA") {
    const { Points = 0, Rebound = 0, Assist = 0, Block = 0, Steal = 0 } = nba;
    document.getElementById("nba-breakdown").value =
      `P+R+A = ${Points + Rebound + Assist}\nP+A = ${Points + Assist}\nP+R = ${Points + Rebound}\nR+A = ${Rebound + Assist}\nBlk+Stl = ${Block + Steal}`;
  }

  // MLB hitter breakdown
  if (leagueKey === "mlb_hitter") {
    const { Single = 0, Double = 0, Triple = 0, "Home Run": HR = 0, Run = 0, RBI = 0, BB = 0, HBP = 0 } = mlb;
    const hits = Single + Double + Triple + HR;
    document.getElementById("mlb-breakdown").value =
      `Hits+Runs+RBI = ${hits + Run + RBI}\nHits+Walks = ${hits + BB}\nHits+Walks+HBP = ${hits + BB + HBP}`;
  }

  // NFL breakdown
  if (leagueKey === "nfl_cfb") {
    const { "Passing Yards": PY = 0, "Rushing Yards": RY = 0, "Receiving Yards": ReY = 0, "Passing TDs": PTD = 0, "Rushing TDs": RTD = 0, "Receiving TDs": ReTD = 0 } = nfl;
    document.getElementById("nfl-breakdown").value =
      `Pass+Rush Yds = ${PY + RY}\nRush+Rec Yds = ${RY + ReY}\nPass+Rush TD = ${PTD + RTD}\nRush+Rec TD = ${RTD + ReTD}`;
  }
}

function clearInputs() {
  document.querySelectorAll(".stat-input").forEach(input =>
    input.type === "checkbox" ? input.checked = false : input.value = ""
  );
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
