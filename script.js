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
