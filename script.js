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

  const groupLayouts = {
    "mlb_hitter": {
      "Hitting Stats": ["Single", "Double", "Triple", "Home Run"],
      "Run/RBI Stats": ["Run", "RBI"],
      "Other Stats": ["BB", "HBP", "SB"]
    },
    "tennis": {
      "Match Info": ["Match Played"],
      "Game & Set": ["Game Won", "Game Loss", "Set Won", "Set Loss"],
      "Serve Stats": ["Ace", "Double Fault"]
    },
    "nfl_cfb": {
      "Passing": ["Passing Yards", "Passing TDs", "Interceptions"],
      "Rushing": ["Rushing Yards", "Rushing TDs"],
      "Receiving": ["Receiving Yards", "Receiving TDs", "Receptions"],
      "Turnovers": ["Fumbles Lost"],
      "Misc": ["2 Point Conversions", "Offensive Fumble Recovery TD", "Kick/Punt/Field Goal Return TD"]
    },
    "dst": {
      "Standard Defensive Stats": ["Sack", "Interception", "Fumble Recovery"],
      "Return TDs": [
        "Punt/Kickoff/FG Return for TD",
        "Interception Return TD",
        "Fumble Recovery TD",
        "Blocked Punt or FG Return TD"
      ],
      "Special Teams / Misc": ["Safety", "Blocked Kick", "2pt/XP Return"]
    }
  };

  if (groupLayouts[leagueKey]) {
    renderGroupedStats(container, league.stats, groupLayouts[leagueKey], leagueKey);
    return;
  }

  if (leagueKey === "nascar") {
    const group = document.createElement("div");
    group.className = "stat-group";
    group.innerHTML = `
      <div class="group-title">NASCAR Stats</div>
      <div class="stat-row"><div class="stat-label">Starting Position</div><input type="text" class="stat-input center" id="stat-Starting Position"></div>
      <div class="stat-row"><div class="stat-label">Finishing Position</div><input type="text" class="stat-input center" id="stat-Finishing Position"></div>
      <div class="stat-row"><div class="stat-label">Fastest Laps × 0.45</div><input type="text" class="stat-input center" id="stat-Fastest Laps"></div>
      <div class="stat-row"><div class="stat-label">Laps Led × 0.25</div><input type="text" class="stat-input center" id="stat-Laps Led"></div>
    `;
    container.appendChild(group);
    return;
  }

  const groupDiv = document.createElement("div");
  groupDiv.className = "stat-group";

  stats.forEach(([label, points]) => {
    const row = document.createElement("div");
    row.className = "stat-row";
    row.innerHTML = `
      <div class="stat-label">${label} — ${points} pts</div>
      <input type="text" class="stat-input center" id="stat-${label}" />
    `;
    groupDiv.appendChild(row);
  });
  container.appendChild(groupDiv);

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

function renderGroupedStats(container, stats, groupMap, leagueKey) {
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

      const inputType = label === "Match Played" ? "checkbox" : "text";
      const inputElement = inputType === "checkbox"
        ? `<input type="checkbox" class="stat-input" id="stat-${label}" />`
        : `<input type="text" class="stat-input center" id="stat-${label}" />`;

      row.innerHTML = `
        <div class="stat-label">${label} — ${points} pts</div>
        ${inputElement}
      `;

      groupDiv.appendChild(row);
    });

    if (leagueKey === "tennis") {
      const nameRow = document.createElement("div");
      nameRow.className = "stat-row";
      nameRow.innerHTML = `
        <div class="stat-label">Player Name:</div>
        <input type="text" class="stat-input center" id="player-name" />
      `;
      groupDiv.prepend(nameRow);
    }

    container.appendChild(groupDiv);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadLeagues();
  document.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      calculateScore();
    }
  });
});
