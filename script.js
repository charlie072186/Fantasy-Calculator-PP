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
  const extraContainer = document.getElementById("extra-breakdowns") || createExtraBreakdowns();
  container.innerHTML = "";
  bonusContainer.innerHTML = "";
  extraContainer.innerHTML = "";

  const stats = Array.isArray(league.stats)
    ? league.stats.map(s => [s.label, s.points])
    : Object.entries(league.stats);

  if (leagueKey === "nba") {
    renderGroupedStats(container, league.stats, {
      "Offensive Stats": ["Points", "Rebound", "Assist"],
      "Defensive Stats": ["Block", "Steal", "Turnover"]
    });

    const praBox = document.createElement("textarea");
    praBox.id = "pra-breakdown";
    praBox.readOnly = true;
    praBox.placeholder = "Total: PRA";
    extraContainer.appendChild(praBox);

    const bsBox = document.createElement("textarea");
    bsBox.id = "bs-breakdown";
    bsBox.readOnly = true;
    bsBox.placeholder = "Total: BLK+STL";
    extraContainer.appendChild(bsBox);

    const copy1 = document.createElement("button");
    copy1.textContent = "Copy PRA";
    copy1.onclick = () => copyText("pra-breakdown");
    extraContainer.appendChild(copy1);

    const copy2 = document.createElement("button");
    copy2.textContent = "Copy BLK+STL";
    copy2.onclick = () => copyText("bs-breakdown");
    extraContainer.appendChild(copy2);
    return;
  }

  if (leagueKey === "nfl_cfb") {
    renderGroupedStats(container, league.stats, {
      "Passing": ["Passing Yards", "Passing TDs", "Interceptions"],
      "Rushing": ["Rushing Yards", "Rushing TDs"],
      "Receiving": ["Receiving Yards", "Receiving TDs", "Receptions"],
      "Turnovers": ["Fumbles Lost"],
      "Misc": ["2 Point Conversions", "Offensive Fumble Recovery TD", "Kick/Punt/Field Goal Return TD"]
    });

    const rushRecBox = document.createElement("textarea");
    rushRecBox.id = "td-combo";
    rushRecBox.readOnly = true;
    rushRecBox.placeholder = "Total: Rush+Rec TDs";
    extraContainer.appendChild(rushRecBox);
    return;
  }

  if (leagueKey === "mlb_hitter") {
    renderGroupedStats(container, league.stats, {
      "Hitting Stats": ["Single", "Double", "Triple", "Home Run"],
      "Run/RBI Stats": ["Run", "RBI"],
      "Other Stats": ["BB", "HBP", "SB"]
    });

    const mlbBox = document.createElement("textarea");
    mlbBox.id = "hitter-combo";
    mlbBox.readOnly = true;
    mlbBox.placeholder = "Total: Hits + Runs + RBI";
    extraContainer.appendChild(mlbBox);
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

    renderGroupedStats(container, league.stats, {
      "Game & Set": ["Game Won", "Game Loss", "Set Won", "Set Loss"],
      "Serve Stats": ["Ace", "Double Fault"]
    });
    return;
  }

  if (leagueKey === "nascar") {
    const group = document.createElement("div");
    group.className = "stat-group";
    group.innerHTML = `
      <div class="group-title">Race Stats</div>
      <div class="stat-row"><div class="stat-label">Starting Position</div><input type="text" class="stat-input" id="stat-Starting Position"></div>
      <div class="stat-row"><div class="stat-label">Finishing Position</div><input type="text" class="stat-input" id="stat-Finishing Position"></div>
      <div class="stat-row"><div class="stat-label">Fastest Laps × 0.45</div><input type="text" class="stat-input" id="stat-Fastest Laps"></div>
      <div class="stat-row"><div class="stat-label">Laps Led × 0.25</div><input type="text" class="stat-input" id="stat-Laps Led"></div>
    `;
    container.appendChild(group);
    return;
  }

  renderGroupedStats(container, league.stats, {
    "Stats": stats.map(([label]) => label)
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

function renderGroupedStats(container, stats, groupMap) {
  for (const [group, labels] of Object.entries(groupMap)) {
    const groupDiv = document.createElement("div");
    groupDiv.className = "stat-group";
    const title = document.createElement("div");
    title.className = "group-title";
    title.textContent = group;
    groupDiv.appendChild(title);

    labels.forEach(label => {
      const points = Array.isArray(stats)
        ? stats.find(s => s.label === label)?.points
        : stats[label];
      if (points === undefined) return;
      const row = document.createElement("div");
      row.className = "stat-row";
      const isCheckbox = label === "Match Played" || label === "Win";
      row.innerHTML = `
        <div class="stat-label">${label} — ${points} pts</div>
        <input type="${isCheckbox ? "checkbox" : "text"}" class="stat-input" id="stat-${label}" />
      `;
      groupDiv.appendChild(row);
    });
    container.appendChild(groupDiv);
  }
}

function calculateScore() {
  const leagueKey = document.getElementById("league").value;
  const league = leagues[leagueKey];
  const hideZero = document.getElementById("hideZero")?.checked;
  let total = 0;
  let breakdown = "";
  let innings = 0, earnedRuns = 0;
  let extra = {};

  const getVal = id => {
    const el = document.getElementById(`stat-${id}`);
    if (!el) return 0;
    if (el.type === "checkbox") return el.checked ? 1 : 0;
    const val = parseFloat(el.value);
    return isNaN(val) ? 0 : val;
  };

  const stats = Array.isArray(league.stats)
    ? league.stats.map(s => [s.label, s.points])
    : Object.entries(league.stats);

  if (leagueKey === "nascar") {
    const start = getVal("Starting Position"), finish = getVal("Finishing Position");
    const fastest = getVal("Fastest Laps"), led = getVal("Laps Led");

    if (!isNaN(start) && !isNaN(finish)) {
      total += start - finish;
      breakdown += `Place Differential: ${start - finish} pts\n`;
    }

    const ptsArr = [45, 42, 41, 40, 39, 38, 37, 36, 35, 34, 32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
    if (finish >= 1 && finish <= 40) {
      total += ptsArr[finish - 1];
      breakdown += `Finishing Position (${finish}): ${ptsArr[finish - 1]} pts\n`;
    }

    if (!hideZero || fastest) {
      breakdown += `Fastest Laps: ${fastest} × 0.45 = ${(fastest * 0.45).toFixed(2)}\n`;
      total += fastest * 0.45;
    }
    if (!hideZero || led) {
      breakdown += `Laps Led: ${led} × 0.25 = ${(led * 0.25).toFixed(2)}\n`;
      total += led * 0.25;
    }
    breakdown += `\nTotal FS: ${total.toFixed(2)}`;
    document.getElementById("breakdown").value = breakdown;
    return;
  }

  stats.forEach(([label, pts]) => {
    const val = getVal(label);
    if (!hideZero || val !== 0) breakdown += `${label}: ${val} × ${pts} = ${(val * pts).toFixed(2)}\n`;
    total += val * pts;
    if (leagueKey === "nba") {
      if (["Points", "Rebound", "Assist"].includes(label)) extra.pra = (extra.pra || 0) + val;
      if (["Block", "Steal"].includes(label)) extra.bs = (extra.bs || 0) + val;
    }
    if (leagueKey === "nfl_cfb" && ["Rushing TDs", "Receiving TDs"].includes(label)) extra.td = (extra.td || 0) + val;
    if (leagueKey === "mlb_hitter" && ["Single", "Double", "Triple", "Home Run", "Run", "RBI"].includes(label)) {
      extra.hits = (extra.hits || 0) + (["Run", "RBI"].includes(label) ? 0 : val);
      extra.runs = (extra.runs || 0) + (["Run"].includes(label) ? val : 0);
      extra.rbi = (extra.rbi || 0) + (["RBI"].includes(label) ? val : 0);
    }
  });

  if (leagueKey === "mlb_pitcher" && innings >= 6 && earnedRuns <= 3) {
    const qsp = stats.find(([label]) => label === "Quality Start")?.[1] || 0;
    breakdown += `Quality Start: 1 × ${qsp} = ${qsp.toFixed(2)}\n`;
    total += qsp;
  }

  const bonus = document.querySelector("input[name='bonus']:checked");
  if (bonus) {
    const b = parseFloat(bonus.value);
    breakdown += `Bonus: +${b}\n`;
    total += b;
  }

  breakdown += `\nTotal FS: ${total.toFixed(2)}`;
  document.getElementById("breakdown").value = breakdown;

  if (leagueKey === "nba") {
    document.getElementById("pra-breakdown").value = `Points + Rebounds + Assists = ${extra.pra || 0}`;
    document.getElementById("bs-breakdown").value = `Blocks + Steals = ${extra.bs || 0}`;
  }
  if (leagueKey === "nfl_cfb") {
    document.getElementById("td-combo").value = `Rush TD + Rec TD = ${extra.td || 0}`;
  }
  if (leagueKey === "mlb_hitter") {
    document.getElementById("hitter-combo").value = `Hits + Runs + RBI = ${(extra.hits || 0) + (extra.runs || 0) + (extra.rbi || 0)}`;
  }
}

function createExtraBreakdowns() {
  const box = document.createElement("div");
  box.id = "extra-breakdowns";
  box.className = "extra-boxes";
  document.querySelector(".container").appendChild(box);
  return box;
}

function copyText(id) {
  const el = document.getElementById(id);
  el.select();
  document.execCommand("copy");
}

function clearInputs() {
  document.querySelectorAll(".stat-input").forEach(input => {
    input.type === "checkbox" ? input.checked = false : input.value = "";
  });
  document.getElementById("breakdown").value = "";
  ["pra-breakdown", "bs-breakdown", "td-combo", "hitter-combo"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  const selectedBonus = document.querySelector("input[name='bonus']:checked");
  if (selectedBonus) selectedBonus.checked = false;
}

document.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    e.preventDefault();
    calculateScore();
  }
});

window.onload = loadLeagues;
