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
    loadStats();
  } catch (err) {
    console.error("Error loading leagues:", err);
  }
}

function format(val) {
  if (val === undefined || isNaN(val)) return "0";
  return val % 1 === 0 ? val.toString() : val.toFixed(2);
}

function loadStats() {
  const leagueKey = document.getElementById("league").value;
  const league = leagues[leagueKey];
  const container = document.getElementById("stats-container");
  const bonusContainer = document.getElementById("bonus-container");
  const fightTimeContainer = document.getElementById("fight-time-container");
  const extraBox = document.getElementById("extra-breakdown-box");

  // Reset UI
  container.innerHTML = "";
  bonusContainer.innerHTML = "";
  extraBox.innerHTML = "";
  extraBox.classList.add("hidden");
  fightTimeContainer.classList.add("hidden");

  if (!league) return;

  // --- NHL TOI PERIOD INPUTS ---
  if (leagueKey === "nhl") {
    const periodDiv = document.createElement("div");
    periodDiv.className = "stat-group";
    periodDiv.innerHTML = `<div class="group-title">Time Per Period (MM:SS)</div>`;
    
    for (let i = 1; i <= 3; i++) {
      periodDiv.innerHTML += `
        <div class="stat-row">
          <div class="stat-label">Period ${i}</div>
          <input type="text" class="stat-input nhl-period" id="nhl-p${i}" placeholder="00:00" />
        </div>`;
    }
    container.appendChild(periodDiv);
    return; // Exit so standard logic doesn't run for NHL
  }

  // --- STANDARD LEAGUE LOGIC ---
  const stats = Array.isArray(league.stats)
    ? league.stats.map(s => [s.label, s.points])
    : Object.entries(league.stats || {});

  // Fight Time logic
  if (league.hasFightTime) {
    const rounds = leagueKey === "mma" ? 5 : 12;
    const fightRoundDiv = document.getElementById("fight-rounds");
    fightRoundDiv.innerHTML = "<label>Fight ended in:</label><br>";
    for (let i = 1; i <= rounds; i++) {
      fightRoundDiv.innerHTML += `<label><input type="radio" name="fightRound" value="${i}"> Round ${i}</label><br>`;
    }
    fightTimeContainer.classList.remove("hidden");
  }

  // Grouped leagues
  const groups = {
    nfl_cfb: {
      "Passing": ["Passing Yards", "Passing TDs", "Interceptions"],
      "Rushing": ["Rushing Yards", "Rushing TDs"],
      "Receiving": ["Receiving Yards", "Receiving TDs", "Receptions"],
      "Turnovers": ["Fumbles Lost"],
      "Misc": ["2 Point Conversions", "Offensive Fumble Recovery TD", "Kick/Punt/Field Goal Return TD"]
    },
    dst: {
      "Standard Defensive Stats": ["Sack", "Interception", "Fumble Recovery"],
      "Return TDs": ["Punt/Kickoff/FG Return for TD", "Interception Return TD", "Fumble Recovery TD", "Blocked Punt or FG Return TD"],
      "Special Teams / Misc": ["Safety", "Blocked Kick", "2pt/XP Return"]
    },
    mlb_hitter: {
      "Hitting Stats": ["Single", "Double", "Triple", "Home Run"],
      "Run/RBI Stats": ["Run", "RBI"],
      "Other Stats": ["BB", "HBP", "SB"]
    },
    kickers: {
      "Field Goals": ["FG 0-39 yards", "FG 40-49 yards", "FG 50+ yards"],
      "Extra Points": ["XP conversions"],
      "Missed Kicks": ["FG Missed", "XP Missed"]
    },
    soccer: {
      "Scoring": ["Goal", "Assist", "Goal from PEN"],
      "Shooting": ["Shot on Target"],
      "Passing": ["Completed Pass", "Missed Pass"],
      "Discipline": ["Yellow Card", "Red Card"]
    }
  };

  if (groups[leagueKey]) {
    renderGroupedStats(container, league.stats, groups[leagueKey]);
    if (leagueKey === "dst" && league.pointsAllowedTiers) {
      const pointsAllowedDiv = document.createElement("div");
      pointsAllowedDiv.className = "stat-group";
      pointsAllowedDiv.innerHTML = `
        <div class="group-title">Points Allowed</div>
        <div class="stat-row">
          <div class="stat-label">Points Allowed</div>
          <input type="text" class="stat-input" id="stat-Points Allowed" />
        </div>`;
      container.appendChild(pointsAllowedDiv);
    }
  } else {
    // Default Rendering
    stats.forEach(([label, points]) => {
      const row = document.createElement("div");
      row.className = "stat-row";
      let html = (label === "Win" || label === "Match Played")
        ? `<label class="stat-label"><input type="checkbox" class="stat-input" id="stat-${label}" />${label} — ${points} pts</label>`
        : `<div class="stat-label">${label} — ${points} pts</div><input type="text" class="stat-input" id="stat-${label}" />`;
      row.innerHTML = html;
      container.appendChild(row);
    });
  }

  // Bonuses
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
  if (!league) return;

  // --- NHL TOI CONVERTER ---
  if (leagueKey === "nhl") {
    let totalSeconds = 0;
    let periodBreakdown = "Time On Ice Breakdown:\n";
    let hasData = false;

    for (let i = 1; i <= 3; i++) {
      const input = document.getElementById(`nhl-p${i}`);
      const val = input ? input.value.trim() : "";
      if (val.includes(":")) {
        hasData = true;
        const [mins, secs] = val.split(":").map(n => parseFloat(n) || 0);
        const pSeconds = (mins * 60) + secs;
        const pDecimal = mins + (secs / 60);
        totalSeconds += pSeconds;
        periodBreakdown += `P${i}: ${val} (${format(pDecimal)})\n`;
      }
    }

    if (!hasData) {
      document.getElementById("breakdown").value = "Please enter time in MM:SS format.";
      return;
    }

    const finalMins = Math.floor(totalSeconds / 60);
    const finalSecs = Math.round(totalSeconds % 60);
    const finalDecimal = totalSeconds / 60;

    let output = periodBreakdown;
    output += `------------------\n`;
    output += `Total Time: ${finalMins}:${finalSecs.toString().padStart(2, '0')}\n`;
    output += `Decimal Total: ${format(finalDecimal)}`;

    document.getElementById("breakdown").value = output;
    return;
  }

  // --- STANDARD SCORE CALCULATION ---
  const stats = Array.isArray(league.stats)
    ? league.stats.map(s => [s.label, s.points])
    : Object.entries(league.stats || {});

  let total = 0;
  let breakdown = "";
  const hideZero = document.getElementById("hideZero")?.checked;

  stats.forEach(([label, points]) => {
    const input = document.getElementById(`stat-${label}`);
    if (!input) return;
    const val = input.type === "checkbox" ? (input.checked ? 1 : 0) : parseFloat(input.value);
    if (isNaN(val)) return;

    if (!hideZero || val !== 0) {
      breakdown += `${label}: ${val} × ${points} = ${format(val * points)}\n`;
    }
    total += val * points;
  });

  breakdown += `\nTotal FS: ${format(total)}`;
  document.getElementById("breakdown").value = breakdown;
  showExtraBreakdown(leagueKey);
}

function renderGroupedStats(container, stats, groupMap) {
  for (const [groupName, labels] of Object.entries(groupMap)) {
    const groupDiv = document.createElement("div");
    groupDiv.className = "stat-group";
    groupDiv.innerHTML = `<div class="group-title">${groupName}</div>`;
    labels.forEach(label => {
      const points = Array.isArray(stats)
        ? stats.find(s => s.label === label)?.points
        : stats[label];
      if (points === undefined) return;
      const row = document.createElement("div");
      row.className = "stat-row";
      row.innerHTML = `<div class="stat-label">${label} — ${points} pts</div><input type="text" class="stat-input" id="stat-${label}" />`;
      groupDiv.appendChild(row);
    });
    container.appendChild(groupDiv);
  }
}

function showExtraBreakdown(leagueKey) {
  const extraBox = document.getElementById("extra-breakdown-box");
  extraBox.innerHTML = "";
  extraBox.classList.add("hidden");

  if (leagueKey === "nba") {
    const pts = parseFloat(document.getElementById("stat-Points")?.value) || 0;
    const reb = parseFloat(document.getElementById("stat-Rebound")?.value) || 0;
    const ast = parseFloat(document.getElementById("stat-Assist")?.value) || 0;
    extraBox.innerHTML = `<h3>Single Stats</h3>P+R+A = ${pts + reb + ast}<br>P+A = ${pts + ast}<br>P+R = ${pts + reb}<br>R+A = ${reb + ast}`;
    extraBox.classList.remove("hidden");
  }
}

function clearInputs() {
  document.querySelectorAll(".stat-input").forEach(input => {
    if (input.type === "checkbox") input.checked = false;
    else input.value = "";
  });
  document.getElementById("breakdown").value = "";
  document.getElementById("extra-breakdown-box").innerHTML = "";
  document.getElementById("extra-breakdown-box").classList.add("hidden");
}

function copyBreakdown() {
  const box = document.getElementById("breakdown");
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
