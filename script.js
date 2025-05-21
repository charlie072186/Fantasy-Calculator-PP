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

  // 💬 Add conditional extra breakdown containers
  const addExtraBox = (id, label) => {
    const box = document.createElement("div");
    box.innerHTML = `<label>${label}:</label><textarea id="${id}" readonly class="extra-box"></textarea><button class="copy" onclick="copyBox('${id}')">Copy</button>`;
    extraContainer.appendChild(box);
  };

  if (leagueKey === "NBA") {
    addExtraBox("nba-breakdown", "NBA Breakdown (PRA, PA, PR, RA, Blk+Stl)");
  } else if (leagueKey === "mlb_hitter") {
    addExtraBox("mlb-breakdown", "MLB Hitter Breakdown");
  } else if (leagueKey === "nfl_cfb") {
    addExtraBox("nfl-breakdown", "NFL Offensive Breakdown");
  }

  // 💬 Handle grouped leagues (e.g. nfl, dst, mlb_hitter, mlb_pitcher...)
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

  if (leagueKey === "mlb_hitter") {
    const groups = {
      "Hitting Stats": ["Single", "Double", "Triple", "Home Run"],
      "Run/RBI Stats": ["Run", "RBI"],
      "Other Stats": ["BB", "HBP", "SB"]
    };
    renderGroupedStats(container, league.stats, groups);
    return;
  }

  // default
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

function calculateScore() {
  const leagueKey = document.getElementById("league").value;
  const league = leagues[leagueKey];
  const stats = Array.isArray(league.stats)
    ? league.stats.map(s => [s.label, s.points])
    : Object.entries(league.stats);

  let total = 0;
  let breakdown = "";
  const hideZero = document.getElementById("hideZero")?.checked;

  // 💬 For extra stat tracking
  let nba = { pts: 0, reb: 0, ast: 0, blk: 0, stl: 0 };
  let mlb = { single: 0, double: 0, triple: 0, hr: 0, run: 0, rbi: 0, bb: 0, hbp: 0 };
  let nfl = { passYds: 0, rushYds: 0, recYds: 0, passTD: 0, rushTD: 0, recTD: 0 };

  stats.forEach(([label, points]) => {
    const input = document.getElementById(`stat-${label}`);
    if (!input) return;
    const val = input.type === "checkbox" ? (input.checked ? 1 : 0) : parseFloat(input.value) || 0;
    if (isNaN(val)) return;

    if (!hideZero || val !== 0) {
      breakdown += `${label}: ${val} × ${points} = ${(val * points).toFixed(2)}\n`;
    }
    total += val * points;

    // Track breakdown stats
    if (leagueKey === "NBA") {
      if (label === "Points") nba.pts = val;
      if (label === "Rebound") nba.reb = val;
      if (label === "Assist") nba.ast = val;
      if (label === "Block") nba.blk = val;
      if (label === "Steal") nba.stl = val;
    }
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

  // Bonus
  const bonus = document.querySelector('input[name="bonus"]:checked');
  if (bonus) {
    const val = parseFloat(bonus.value);
    breakdown += `Bonus: +${val}\n`;
    total += val;
  }

  breakdown += `\nTotal FS: ${total.toFixed(2)}`;
  document.getElementById("breakdown").value = breakdown;

  // 💬 Extra breakdown output
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
