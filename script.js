let leagues = {};

async function loadLeagues() {
  try {
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
    loadStats(); // load first league's stats on page load
  } catch (e) {
    console.error("Failed to load leagues.json:", e);
  }
}


function loadStats() {
  const leagueKey = document.getElementById("league").value;
  const league = leagues[leagueKey];
  const container = document.getElementById("stats-container");
  const bonusContainer = document.getElementById("bonus-container");
  const extraBreakdowns = document.getElementById("extra-breakdowns");
  container.innerHTML = "";
  bonusContainer.innerHTML = "";
  extraBreakdowns.innerHTML = "";

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
    renderExtraNFL();
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
    renderExtraMLBHitter();
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

  if (leagueKey === "NBA") {
    renderGroupedStats(container, league.stats, {
      "Player Stats": Object.keys(league.stats)
    });
    renderExtraNBA();
    return;
  }

  if (leagueKey === "mlb_pitcher") {
    const pitcherGroups = {
      "Pitching Stats": ["Win", "Strikeout", "Earned Run", "Innings Pitched"],
    };
    renderGroupedStats(container, league.stats, pitcherGroups);
    // Insert QS label only, no input
    const qsLabel = document.createElement("div");
    qsLabel.className = "stat-row";
    qsLabel.innerHTML = `<div class="stat-label">Quality Start <span class="tooltip">ℹ️<span class="tooltiptext">6+ IP & ≤ 3 ER = +4 pts</span></span></div>`;
    container.appendChild(qsLabel);
    return;
  }

  stats.forEach(([label, points]) => {
    const row = document.createElement("div");
    row.className = "stat-row";
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

  // NASCAR
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

  let inputs = {};
  stats.forEach(([label, points]) => {
    const input = document.getElementById(`stat-${label}`);
    if (!input) return;
    let val = input.type === "checkbox" ? (input.checked ? 1 : 0) : parseFloat(input.value);
    if (isNaN(val)) return;
    inputs[label] = val;

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
      if (label === "Quality Start") return;
    }

    if (!hideZero || val !== 0) {
      breakdown += `${label}: ${val} × ${points} = ${(val * points).toFixed(2)}\n`;
    }
    total += val * points;
  });

  // MLB Pitcher - Quality Start
  if (leagueKey === "mlb_pitcher" && innings >= 6 && earnedRuns <= 3) {
    const qsPoints = Array.isArray(league.stats)
      ? league.stats.find(s => s.label === "Quality Start")?.points || 0
      : league.stats["Quality Start"] || 0;
    breakdown += `Quality Start: 1 × ${qsPoints} = ${qsPoints.toFixed(2)}\n`;
    total += qsPoints;
  }

  // Bonus
  const bonus = document.querySelector('input[name="bonus"]:checked');
  if (bonus) {
    const bonusVal = parseFloat(bonus.value);
    breakdown += `Bonus: +${bonusVal}\n`;
    total += bonusVal;
  }

  breakdown += `\nTotal FS: ${total.toFixed(2)}`;
  document.getElementById("breakdown").value = breakdown;

  // Extra breakdowns
  renderLeagueBreakdowns(leagueKey, inputs);
}

function clearInputs() {
  document.querySelectorAll(".stat-input").forEach(input => {
    if (input.type === "checkbox") input.checked = false;
    else input.value = "";
  });
  document.getElementById("breakdown").value = "";
  document.getElementById("extra-breakdowns").innerHTML = "";
  const selectedBonus = document.querySelector('input[name="bonus"]:checked');
  if (selectedBonus) selectedBonus.checked = false;
}

function copyExtra(id) {
  const el = document.getElementById(id);
  el.select();
  document.execCommand("copy");
}

function renderExtraNBA() {
  const box = document.getElementById("extra-breakdowns");
  box.innerHTML = `
    <h3>NBA Stat Totals</h3>
    <textarea id="nba-breakdown" readonly></textarea>
    <button onclick="copyExtra('nba-breakdown')">Copy Breakdown</button>
  `;
}

function renderExtraMLBHitter() {
  const box = document.getElementById("extra-breakdowns");
  box.innerHTML = `
    <h3>MLB Hitter Stat Totals</h3>
    <textarea id="mlb-breakdown" readonly></textarea>
    <button onclick="copyExtra('mlb-breakdown')">Copy Breakdown</button>
  `;
}

function renderExtraNFL() {
  const box = document.getElementById("extra-breakdowns");
  box.innerHTML = `
    <h3>NFL Stat Totals</h3>
    <textarea id="nfl-breakdown" readonly></textarea>
    <button onclick="copyExtra('nfl-breakdown')">Copy Breakdown</button>
  `;
}

function renderLeagueBreakdowns(leagueKey, inputs) {
  if (leagueKey === "NBA") {
    const p = inputs["Points"] || 0;
    const r = inputs["Rebound"] || 0;
    const a = inputs["Assist"] || 0;
    const s = inputs["Steal"] || 0;
    const b = inputs["Block"] || 0;
    document.getElementById("nba-breakdown").value =
      `P+R+A: ${p + r + a}\nP+A: ${p + a}\nP+R: ${p + r}\nR+A: ${r + a}\nBLK+STL: ${b + s}`;
  }

  if (leagueKey === "mlb_hitter") {
    const hits = (inputs["Single"] || 0) + (inputs["Double"] || 0) + (inputs["Triple"] || 0) + (inputs["Home Run"] || 0);
    const runs = inputs["Run"] || 0;
    const rbi = inputs["RBI"] || 0;
    const bb = inputs["BB"] || 0;
    const hbp = inputs["HBP"] || 0;
    document.getElementById("mlb-breakdown").value =
      `Hits+Runs+RBI: ${hits + runs + rbi}\nHits+Walks: ${hits + bb}\nHits+Walks+HBP: ${hits + bb + hbp}`;
  }

  if (leagueKey === "nfl_cfb") {
    const py = inputs["Passing Yards"] || 0;
    const ry = inputs["Rushing Yards"] || 0;
    const recy = inputs["Receiving Yards"] || 0;
    const ptd = inputs["Passing TDs"] || 0;
    const rtd = inputs["Rushing TDs"] || 0;
    const rectd = inputs["Receiving TDs"] || 0;
    document.getElementById("nfl-breakdown").value =
      `Pass+Rush Yards: ${py + ry}\nRush+Rec Yards: ${ry + recy}\nPass+Rush TD: ${ptd + rtd}\nRush+Rec TD: ${rtd + rectd}`;
  }
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    calculateScore();
  }
});

window.onload = loadLeagues;
