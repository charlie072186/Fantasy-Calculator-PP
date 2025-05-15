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

    for (const [groupName, labels] of Object.entries(dstGroups)) {
      const groupDiv = document.createElement("div");
      groupDiv.className = "stat-group";

      const groupTitle = document.createElement("div");
      groupTitle.className = "group-title";
      groupTitle.textContent = groupName;
      groupDiv.appendChild(groupTitle);

      labels.forEach(label => {
        if (!(label in league.stats)) return;
        const points = league.stats[label];

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

    return; // Skip default rendering for DST
  }


    for (const [groupName, labels] of Object.entries(groups)) {
      const groupDiv = document.createElement("div");
      groupDiv.className = "stat-group";

      const groupTitle = document.createElement("div");
      groupTitle.className = "group-title";
      groupTitle.textContent = groupName;
      groupDiv.appendChild(groupTitle);

      labels.forEach(label => {
        const statObj = league.stats.find(s => s.label === label);
        if (!statObj) return;
        const points = statObj.points;

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
  } else {
    stats.forEach(([label, points]) => {
      const row = document.createElement("div");
      row.className = "stat-row";
      row.innerHTML = `
        <div class="stat-label">${label} — ${points} pts</div>
        <input type="text" class="stat-input" id="stat-${label}" />
      `;
      container.appendChild(row);
    });
  }

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

function calculateScore() {
  const leagueKey = document.getElementById("league").value;
  const league = leagues[leagueKey];
  const stats = Array.isArray(league.stats)
    ? league.stats.map(s => [s.label, s.points])
    : Object.entries(league.stats);

  let total = 0;
  let breakdown = "";

  stats.forEach(([label, points]) => {
    const val = parseFloat(document.getElementById(`stat-${label}`)?.value) || 0;
    if (val !== 0 || !document.getElementById("hideZero").checked) {
      breakdown += `${label}: ${val} × ${points} = ${(val * points).toFixed(2)}\n`;
    }
    total += val * points;
  });

  const bonus = document.querySelector('input[name="bonus"]:checked');
  if (bonus) {
    const bonusVal = parseFloat(bonus.value);
    total += bonusVal;
    breakdown += `Bonus: +${bonusVal}\n`;
  }

  document.getElementById("breakdown").value = breakdown + `\nTotal: ${total.toFixed(2)}`;
}

function clearInputs() {
  document.querySelectorAll(".stat-input").forEach(input => input.value = "");
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
