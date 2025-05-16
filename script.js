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
    ? league.stats.map((s) => [s.label, s.points])
    : Object.entries(league.stats);

  if (leagueKey === "nfl_cfb") {
    const groups = {
      Passing: ["Passing Yards", "Passing TDs", "Interceptions"],
      Rushing: ["Rushing Yards", "Rushing TDs"],
      Receiving: ["Receiving Yards", "Receiving TDs", "Receptions"],
      Turnovers: ["Fumbles Lost"],
      Misc: ["2 Point Conversions", "Offensive Fumble Recovery TD", "Kick/Punt/Field Goal Return TD"],
    };
    renderGroupedStats(container, league.stats, groups);
    renderExtraNFL();
    return;
  }

  if (leagueKey === "dst") {
    const dstGroups = {
      "Standard Defensive Stats": ["Sack", "Interception", "Fumble Recovery"],
      "Return TDs": ["Punt/Kickoff/FG Return for TD", "Interception Return TD", "Fumble Recovery TD", "Blocked Punt or FG Return TD"],
      "Special Teams / Misc": ["Safety", "Blocked Kick", "2pt/XP Return"],
    };
    renderGroupedStats(container, league.stats, dstGroups);
    return;
  }

  if (leagueKey === "mlb_hitter") {
    const hitterGroups = {
      "Hitting Stats": ["Single", "Double", "Triple", "Home Run"],
      "Run/RBI Stats": ["Run", "RBI"],
      "Other Stats": ["BB", "HBP", "SB"],
    };
    renderGroupedStats(container, league.stats, hitterGroups);
    renderExtraMLBHitter();
    return;
  }

  if (leagueKey === "mlb_pitcher") {
    const pitcherStats = ["Win", "Quality Start", "Earned Run", "Strikeout", "Innings Pitched"];
    pitcherStats.forEach((label) => {
      const points = league.stats[label];
      const row = document.createElement("div");
      row.className = "stat-row";
      if (label === "Innings Pitched") {
        row.innerHTML = `<div class="stat-label">${label}<span class="tooltip">ℹ️<span class="tooltiptext">1 IP = 3 outs; 0.1 IP = 1 out</span></span></div><input type="text" class="stat-input" id="stat-${label}" />`;
      } else if (label === "Win") {
        row.innerHTML = `<div class="stat-label">${label} — ${points} pts</div><input type="checkbox" class="stat-input" id="stat-${label}" />`;
      } else if (label === "Quality Start") {
        row.innerHTML = `<div class="stat-label">${label}<span class="tooltip">ℹ️<span class="tooltiptext">Pitch 6+ innings and allow ≤ 3 earned runs</span></span></div>`;
      } else {
        row.innerHTML = `<div class="stat-label">${label} — ${points} pts</div><input type="text" class="stat-input" id="stat-${label}" />`;
      }
      container.appendChild(row);
    });
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
    ["Game Won", "Game Loss", "Set Won", "Set Loss"].forEach((stat) => {
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
    ["Ace", "Double Fault"].forEach((stat) => {
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
    row.innerHTML = `<div class="stat-label">${label} — ${points} pts</div><input type="text" class="stat-input" id="stat-${label}" />`;
    container.appendChild(row);
  });

  if (league.bonuses?.length) {
    const title = document.createElement("h3");
    title.textContent = "Bonus:";
    bonusContainer.appendChild(title);

    league.bonuses.forEach((bonus) => {
      const row = document.createElement("div");
      row.className = "bonus-option";
      row.innerHTML = `<label><input type="radio" name="bonus" value="${bonus.points}" />${bonus.label} — ${bonus.points} pts</label>`;
      bonusContainer.appendChild(row);
    });
  }

  if (leagueKey === "NBA") renderExtraNBA();
}

function renderGroupedStats(container, stats, groupMap) {
  for (const [groupName, labels] of Object.entries(groupMap)) {
    const groupDiv = document.createElement("div");
    groupDiv.className = "stat-group";
    const groupTitle = document.createElement("div");
    groupTitle.className = "group-title";
    groupTitle.textContent = groupName;
    groupDiv.appendChild(groupTitle);
    labels.forEach((label) => {
      const points = Array.isArray(stats) ? stats.find((s) => s.label === label)?.points : stats[label];
      if (points === undefined) return;
      const row = document.createElement("div");
      row.className = "stat-row";
      row.innerHTML = `<div class="stat-label">${label} — ${points} pts</div><input type="text" class="stat-input" id="stat-${label}" />`;
      groupDiv.appendChild(row);
    });
    container.appendChild(groupDiv);
  }
}

function renderExtraNBA() {
  const container = document.createElement("div");
  container.className = "extra-breakdowns";
  container.innerHTML = `
    <h3>Breakdown: NBA Extras</h3>
    <textarea id="nba-extras" class="extras-box" readonly></textarea>
    <button onclick="copyNBAExtras()">Copy Breakdown</button>
  `;
  document.querySelector(".container").appendChild(container);
}

function renderExtraMLBHitter() {
  const container = document.createElement("div");
  container.className = "extra-breakdowns";
  container.innerHTML = `
    <h3>Breakdown: MLB Hitter Extras</h3>
    <textarea id="mlb-hitter-extras" class="extras-box" readonly></textarea>
    <button onclick="copyMLBHitterExtras()">Copy Breakdown</button>
  `;
  document.querySelector(".container").appendChild(container);
}

function renderExtraNFL() {
  const container = document.createElement("div");
  container.className = "extra-breakdowns";
  container.innerHTML = `
    <h3>Breakdown: NFL Offense Extras</h3>
    <textarea id="nfl-extras" class="extras-box" readonly></textarea>
    <button onclick="copyNFLExtras()">Copy Breakdown</button>
  `;
  document.querySelector(".container").appendChild(container);
}

window.onload = loadLeagues;
