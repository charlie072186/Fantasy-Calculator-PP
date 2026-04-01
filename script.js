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
  } catch (error) {
    console.error("Error loading leagues:", error);
  }
}

function format(val) {
  return val % 1 === 0 ? val.toString() : val.toFixed(2);
}

function renderBonuses(league, container) {
  if (league.bonuses && league.bonuses.length > 0) {
    const title = document.createElement("h3");
    title.textContent = "Bonus:";
    container.appendChild(title);
    league.bonuses.forEach(bonus => {
      const row = document.createElement("div");
      row.className = "bonus-option";
      row.innerHTML = `<label><input type="radio" name="bonus" value="${bonus.points}" /> ${bonus.label} — ${bonus.points} pts</label>`;
      container.appendChild(row);
    });
  }
}

function loadStats() {
  const leagueKey = document.getElementById("league").value;
  const league = leagues[leagueKey];
  if (!league) return;

  const container = document.getElementById("stats-container");
  const bonusContainer = document.getElementById("bonus-container");
  const fightTimeContainer = document.getElementById("fight-time-container");
  const extraBox = document.getElementById("extra-breakdown-box");

  // Reset Containers
  container.innerHTML = "";
  bonusContainer.innerHTML = "";
  extraBox.innerHTML = "";
  extraBox.classList.add("hidden");
  fightTimeContainer.classList.add("hidden");

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

  // Rendering Logic
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
  } else if (leagueKey === "tennis") {
    const sections = [
      { title: "Match Info", stats: ["Match Played"] },
      { title: "Game & Set", stats: ["Game Won", "Game Loss", "Set Won", "Set Loss"] },
      { title: "Serve Stats", stats: ["Ace", "Double Fault"] }
    ];

    sections.forEach(sec => {
      const groupDiv = document.createElement("div");
      groupDiv.className = "stat-group";
      groupDiv.innerHTML = `<div class="group-title">${sec.title}</div>`;
      sec.stats.forEach(stat => {
        const pts = league.stats[stat] || 0;
        const isCheck = stat === "Match Played";
        groupDiv.innerHTML += `
          <div class="stat-row">
            ${isCheck ? `<label class="stat-label"><input type="checkbox" class="stat-input" id="stat-${stat}" /> ${stat} — ${pts} pts</label>` : 
            `<div class="stat-label">${stat} — ${pts} pts</div><input type="text" class="stat-input" id="stat-${stat}" />`}
          </div>`;
      });
      container.appendChild(groupDiv);
    });
  } else if (leagueKey === "nascar" || leagueKey === "indycar") {
    const custom = document.createElement("div");
    custom.className = "stat-group";
    custom.innerHTML = `
      <div class="stat-row"><div class="stat-label">Starting Position</div><input type="text" class="stat-input" id="stat-Starting Position" /></div>
      <div class="stat-row"><div class="stat-label">Finishing Position</div><input type="text" class="stat-input" id="stat-Finishing Position" /></div>
      ${leagueKey === "nascar" ? `<div class="stat-row"><div class="stat-label">Fastest Laps × 0.45</div><input type="text" class="stat-input" id="stat-Fastest Laps" /></div>` : ""}
      <div class="stat-row"><div class="stat-label">Laps Led × 0.25</div><input type="text" class="stat-input" id="stat-Laps Led" /></div>
    `;
    container.appendChild(custom);
  } else {
    // Default stats (NBA, etc.)
    const stats = Array.isArray(league.stats) ? league.stats.map(s => [s.label, s.points]) : Object.entries(league.stats);
    stats.forEach(([label, points]) => {
      const row = document.createElement("div");
      row.className = "stat-row";
      if (label === "Win" || label === "Match Played") {
        row.innerHTML = `<label class="stat-label"><input type="checkbox" class="stat-input" id="stat-${label}" /> ${label} — ${points} pts</label>`;
      } else {
        row.innerHTML = `<div class="stat-label">${label} — ${points} pts</div><input type="text" class="stat-input" id="stat-${label}" />`;
      }
      container.appendChild(row);
    });
  }

  renderBonuses(league, bonusContainer);
}

function renderGroupedStats(container, stats, groupMap) {
  for (const [groupName, labels] of Object.entries(groupMap)) {
    const groupDiv = document.createElement("div");
    groupDiv.className = "stat-group";
    groupDiv.innerHTML = `<div class="group-title">${groupName}</div>`;
    labels.forEach(label => {
      const points = Array.isArray(stats) ? stats.find(s => s.label === label)?.points : stats[label];
      if (points === undefined) return;
      const row = document.createElement("div");
      row.className = "stat-row";
      row.innerHTML = `<div class="stat-label">${label} — ${points} pts</div><input type="text" class="stat-input" id="stat-${label}" />`;
      groupDiv.appendChild(row);
    });
    container.appendChild(groupDiv);
  }
}

function calculateScore() {
  const leagueKey = document.getElementById("league").value;
  const league = leagues[leagueKey];
  if (!league) return;

  let total = 0;
  let breakdown = "";
  let innings = 0, earnedRuns = 0;
  const hideZero = document.getElementById("hideZero")?.checked;

  if (leagueKey === "nascar" || leagueKey === "indycar") {
    const start = parseInt(document.getElementById("stat-Starting Position")?.value);
    const finish = parseInt(document.getElementById("stat-Finishing Position")?.value);
    const fastest = parseFloat(document.getElementById("stat-Fastest Laps")?.value) || 0;
    const led = parseFloat(document.getElementById("stat-Laps Led")?.value) || 0;

    if (!isNaN(start) && !isNaN(finish)) {
      const diff = start - finish;
      breakdown += `Place Differential: ${diff} pts\n`;
      total += diff;
    }

    if (leagueKey === "nascar") {
      const nascarPoints = [45, 42, 41, 40, 39, 38, 37, 36, 35, 34, 32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
      if (!isNaN(finish) && finish >= 1 && finish <= 40) {
        const pts = nascarPoints[finish - 1];
        breakdown += `Finishing Position (${finish}): ${pts} pts\n`;
        total += pts;
      }
      if (!hideZero || fastest !== 0) {
        breakdown += `Fastest Laps: ${fastest} × 0.45 = ${format(fastest * 0.45)}\n`;
        total += fastest * 0.45;
      }
    } else if (leagueKey === "indycar") {
      const indyPoints = [50, 45, 35, 32, 30, 28, 26, 24, 22, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 5, 5, 5, 5, 5, 5, 5, 5];
      if (!isNaN(finish) && finish >= 1 && finish <= 33) {
        const pts = indyPoints[finish - 1];
        breakdown += `Finishing Position (${finish}): ${pts} pts\n`;
        total += pts;
      }
    }

    if (!hideZero || led !== 0) {
      breakdown += `Laps Led: ${led} × 0.25 = ${format(led * 0.25)}\n`;
      total += led * 0.25;
    }
  } else {
    const stats = Array.isArray(league.stats) ? league.stats.map(s => [s.label, s.points]) : Object.entries(league.stats);
    stats.forEach(([label, points]) => {
      const input = document.getElementById(`stat-${label}`);
      if (!input) return;
      const val = input.type === "checkbox" ? (input.checked ? 1 : 0) : parseFloat(input.value);
      if (isNaN(val)) return;

      if (leagueKey === "mlb_pitcher") {
        if (label === "Innings Pitched") {
          innings = val;
          const full = Math.floor(val);
          const decimal = val - full;
          const outs = full * 3 + Math.round(decimal * 10);
          breakdown += `${label}: ${val} IP (${outs} outs) = ${format(outs)}\n`;
          total += outs;
          return;
        }
        if (label === "Earned Run") earnedRuns = val;
        if (label === "Quality Start") return;
      }

      if (!hideZero || val !== 0) {
        breakdown += `${label}: ${val} × ${points} = ${format(val * points)}\n`;
      }
      total += val * points;
    });

    if (leagueKey === "mlb_pitcher" && innings >= 6 && earnedRuns <= 3) {
      const qsPoints = Array.isArray(league.stats) ? league.stats.find(s => s.label === "Quality Start")?.points || 0 : league.stats["Quality Start"] || 0;
      breakdown += `Quality Start: 1 × ${qsPoints} = ${format(qsPoints)}\n`;
      total += qsPoints;
    }
  }

  const bonus = document.querySelector('input[name="bonus"]:checked');
  if (bonus) {
    const bonusVal = parseFloat(bonus.value);
    breakdown += `Bonus: +${bonusVal}\n`;
    total += bonusVal;
  }

  if (leagueKey === "dst") {
    const paInput = document.getElementById("stat-Points Allowed");
    const pointsAllowed = parseFloat(paInput?.value);
    if (!isNaN(pointsAllowed)) {
      const tier = league.pointsAllowedTiers.find(t => pointsAllowed <= t.max);
      if (tier) {
        breakdown += `Points Allowed (${tier.label}): ${tier.points} pts\n`;
        total += tier.points;
      }
    }
  }

  breakdown += `\nTotal FS: ${format(total)}`;
  document.getElementById("breakdown").value = breakdown;
  showExtraBreakdown(leagueKey);
}

function showExtraBreakdown(leagueKey) {
  const extraBox = document.getElementById("extra-breakdown-box");
  extraBox.innerHTML = "";
  extraBox.classList.add("hidden");

  if (leagueKey === "nba") {
    const pts = parseFloat(document.getElementById("stat-Points")?.value) || 0;
    const reb = parseFloat(document.getElementById("stat-Rebound")?.value) || 0;
    const ast = parseFloat(document.getElementById("stat-Assist")?.value) || 0;
    extraBox.innerHTML = `<h3>Single Stats</h3>Pts: ${pts}, Rebs: ${reb}, Asts: ${ast}<br>P+R+A = ${pts + reb + ast}<br>P+A = ${pts + ast}<br>P+R = ${pts + reb}<br>R+A = ${reb + ast}`;
    extraBox.classList.remove("hidden");
  }

  if (leagueKey === "mlb_hitter") {
    const s = parseFloat(document.getElementById("stat-Single")?.value) || 0;
    const d = parseFloat(document.getElementById("stat-Double")?.value) || 0;
    const t = parseFloat(document.getElementById("stat-Triple")?.value) || 0;
    const hr = parseFloat(document.getElementById("stat-Home Run")?.value) || 0;
    const r = parseFloat(document.getElementById("stat-Run")?.value) || 0;
    const rbi = parseFloat(document.getElementById("stat-RBI")?.value) || 0;
    const hits = s + d + t + hr;
    extraBox.innerHTML = `<h3>Single Stats Hitter</h3>Hits: ${hits}<br>Runs: ${r}, RBI: ${rbi}<br>Hits+Runs+RBI = ${hits + r + rbi}`;
    extraBox.classList.remove("hidden");
  }
}

function calculateFightTime() {
  const round = parseInt(document.querySelector('input[name="fightRound"]:checked')?.value);
  const min = parseInt(document.getElementById("fight-minutes").value) || 0;
  const sec = parseInt(document.getElementById("fight-seconds").value) || 0;
  if (!round || sec > 59) {
    alert("Please select a round and valid time.");
    return;
  }
  const leagueKey = document.getElementById("league").value;
  const perRound = leagueKey === "mma" ? 5 : 3;
  const totalMin = (round - 1) * perRound + min + sec / 60;
  document.getElementById("fight-time-output").value = `Total FS Fight Time = ${totalMin.toFixed(2)} min`;
}

function clearInputs() {
  document.querySelectorAll(".stat-input").forEach(input => {
    if (input.type === "checkbox") input.checked = false;
    else input.value = "";
  });
  document.getElementById("breakdown").value = "";
  document.getElementById("extra-breakdown-box").classList.add("hidden");
  const bonus = document.querySelector('input[name="bonus"]:checked');
  if (bonus) bonus.checked = false;
}

function copyBreakdown() {
  const box = document.getElementById("breakdown");
  box.select();
  document.execCommand("copy");
}

window.onload = loadLeagues;
