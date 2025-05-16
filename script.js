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
  const breakdownExtras = document.getElementById("breakdown-extras");
  container.innerHTML = "";
  bonusContainer.innerHTML = "";
  breakdownExtras.innerHTML = "";

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
      "Return TDs": ["Punt/Kickoff/FG Return for TD", "Interception Return TD", "Fumble Recovery TD", "Blocked Punt or FG Return TD"],
      "Special Teams / Misc": ["Safety", "Blocked Kick", "2pt/XP Return"]
    };
    renderGroupedStats(container, league.stats, dstGroups);
    return;
  }

  if (leagueKey === "mlb_hitter") {
    const groups = {
      "Hitting Stats": ["Single", "Double", "Triple", "Home Run"],
      "Run/RBI Stats": ["Run", "RBI"],
      "Other Stats": ["BB", "HBP", "SB"]
    };
    renderGroupedStats(container, league.stats, groups);
    renderExtraMLBHitter();
    return;
  }

  if (leagueKey === "mlb_pitcher") {
    const groups = {
      "Pitching Stats": ["Win", "Innings Pitched", "Earned Run", "Strikeout"],
      "Auto Bonus": ["Quality Start"]
    };
    renderGroupedStats(container, league.stats, groups, true);
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

  renderGroupedStats(container, league.stats);
  if (leagueKey === "nba") renderExtraNBA();

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

// Additional functions renderExtraNBA, renderExtraMLBHitter, renderExtraNFL etc. go here...
// CalculateScore logic will include conditionals to compute breakdowns per league as shown earlier.

window.onload = loadLeagues;
