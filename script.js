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

function format(val) {
  return val % 1 === 0 ? val.toString() : val.toFixed(2);
}

function loadStats() {
  const leagueKey = document.getElementById("league").value;
  const league = leagues[leagueKey];
  const container = document.getElementById("stats-container");
  const bonusContainer = document.getElementById("bonus-container");
  const fightTimeContainer = document.getElementById("fight-time-container");
  const extraBox = document.getElementById("extra-breakdown-box");

  container.innerHTML = "";
  bonusContainer.innerHTML = "";
  extraBox.innerHTML = "";
  extraBox.classList.add("hidden");
  fightTimeContainer.classList.add("hidden");

  const stats = Array.isArray(league.stats)
    ? league.stats.map(s => [s.label, s.points])
    : Object.entries(league.stats);

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
    }
  };
  if (groups[leagueKey]) {
    renderGroupedStats(container, league.stats, groups[leagueKey]);
    return;
  }

  if (leagueKey === "tennis") {
    const matchDiv = document.createElement("div");
    matchDiv.className = "stat-group";
    matchDiv.innerHTML = `
      <div class="group-title">Match Info</div>
      <div class="stat-row">
        <label class="stat-label">
          <input type="checkbox" class="stat-input" id="stat-Match Played" />
          Match Played — 10 pts
        </label>
      </div>`;
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
        </div>`;
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
        </div>`;
    });
    container.appendChild(serveDiv);
    return;
  }

  if (leagueKey === "nascar" || leagueKey === "indycar") {
    const custom = document.createElement("div");
    custom.className = "stat-group";
    custom.innerHTML = `
      <div class="stat-row"><div class="stat-label">Starting Position</div><input type="text" class="stat-input" id="stat-Starting Position" /></div>
      <div class="stat-row"><div class="stat-label">Finishing Position</div><input type="text" class="stat-input" id="stat-Finishing Position" /></div>
      ${leagueKey === "nascar" ? `<div class="stat-row"><div class="stat-label">Fastest Laps × 0.45</div><input type="text" class="stat-input" id="stat-Fastest Laps" /></div>` : ""}
      <div class="stat-row"><div class="stat-label">Laps Led × 0.25</div><input type="text" class="stat-input" id="stat-Laps Led" /></div>
    `;
    container.appendChild(custom);
    return;
  }

  // Default stats
  stats.forEach(([label, points]) => {
    const row = document.createElement("div");
    row.className = "stat-row";
    let html = "";

    if (leagueKey === "mlb_pitcher" && label === "Innings Pitched") {
      html = `<div class="stat-label">${label}<span class="tooltip">ℹ️<span class="tooltiptext">1 IP = 3 outs; 0.1 IP = 1 out</span></span></div><input type="text" class="stat-input" id="stat-${label}" />`;
    } else if (leagueKey === "mlb_pitcher" && label === "Quality Start") {
      html = `<div class="stat-label">${label}<span class="tooltip">ℹ️<span class="tooltiptext">Auto: 6+ IP & ≤3 ER</span></span></div>`;
    } else if ((label === "Win" || label === "Match Played")) {
      html = `<label class="stat-label"><input type="checkbox" class="stat-input" id="stat-${label}" />${label} — ${points} pts</label>`;
    } else {
      html = `<div class="stat-label">${label} — ${points} pts</div><input type="text" class="stat-input" id="stat-${label}" />`;
    }

    row.innerHTML = html;
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

function renderGroupedStats(container, stats, groupMap) {
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
      row.innerHTML = `<div class="stat-label">${label} — ${points} pts</div><input type="text" class="stat-input" id="stat-${label}" />`;
      groupDiv.appendChild(row);
    });
    container.appendChild(groupDiv);
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

  // NASCAR & INDYCAR scoring logic
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
      const indyPoints = [
        50, 45, 35, 32, 30, 28, 26, 24, 22, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10,
        9, 8, 7, 6, 5, 5, 5, 5, 5, 5, 5, 5, 5
      ];
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

    breakdown += `\nTotal: ${format(total)}`;
    document.getElementById("breakdown").value = breakdown;
    return;
  }

  // Standard stat scoring
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

  // Quality Start bonus
  if (leagueKey === "mlb_pitcher" && innings >= 6 && earnedRuns <= 3) {
    const qsPoints = Array.isArray(league.stats)
      ? league.stats.find(s => s.label === "Quality Start")?.points || 0
      : league.stats["Quality Start"] || 0;
    breakdown += `Quality Start: 1 × ${qsPoints} = ${format(qsPoints)}\n`;
    total += qsPoints;
  }

  // Bonus points
  const bonus = document.querySelector('input[name="bonus"]:checked');
  if (bonus) {
    const bonusVal = parseFloat(bonus.value);
    breakdown += `Bonus: +${bonusVal}\n`;
    total += bonusVal;
  }

  // Final score output
  breakdown += `\nTotal: ${format(total)}`;
  document.getElementById("breakdown").value = breakdown;

  // Extra breakdowns for specific leagues
  showExtraBreakdown(leagueKey);
}

function showExtraBreakdown(leagueKey) {
  const extraWrapper = document.getElementById("extra-breakdown-wrapper");
  const extraBox = document.getElementById("extra-breakdown-box");
  const extraCopyBtn = document.getElementById("extra-copy-btn");

  extraBox.innerHTML = "";
  extraWrapper.classList.add("hidden");
  extraCopyBtn.classList.add("hidden");

  if (leagueKey === "nba") {
    const pts = parseFloat(document.getElementById("stat-Points")?.value) || 0;
    const reb = parseFloat(document.getElementById("stat-Rebound")?.value) || 0;
    const ast = parseFloat(document.getElementById("stat-Assist")?.value) || 0;

    extraBox.innerHTML = `
<pre>
Single Stats Breakdown:
Points: ${pts}
Rebounds: ${reb}
Assists: ${ast}

P+R+A = ${pts + reb + ast}
P+A = ${pts + ast}
P+R = ${pts + reb}
R+A = ${reb + ast}
</pre>`;
    extraWrapper.classList.remove("hidden");
    extraCopyBtn.classList.remove("hidden");
  }

  if (leagueKey === "mlb_hitter") {
    const s = parseFloat(document.getElementById("stat-Single")?.value) || 0;
    const d = parseFloat(document.getElementById("stat-Double")?.value) || 0;
    const t = parseFloat(document.getElementById("stat-Triple")?.value) || 0;
    const hr = parseFloat(document.getElementById("stat-Home Run")?.value) || 0;
    const r = parseFloat(document.getElementById("stat-Run")?.value) || 0;
    const rbi = parseFloat(document.getElementById("stat-RBI")?.value) || 0;
    const hits = s + d + t + hr;
    const total = hits + r + rbi;

    extraBox.innerHTML = `
<pre>
Hitter Breakdown:
Hits = ${s} + ${d} + ${t} + ${hr} = ${hits}
Runs: ${r}
RBI: ${rbi}

Hits + Runs + RBI = ${total}
</pre>`;
    extraWrapper.classList.remove("hidden");
    extraCopyBtn.classList.remove("hidden");
  }

  if (leagueKey === "nfl_cfb") {
    const passYds = parseFloat(document.getElementById("stat-Passing Yards")?.value) || 0;
    const rushYds = parseFloat(document.getElementById("stat-Rushing Yards")?.value) || 0;
    const recYds = parseFloat(document.getElementById("stat-Receiving Yards")?.value) || 0;
    const passTD = parseFloat(document.getElementById("stat-Passing TDs")?.value) || 0;
    const rushTD = parseFloat(document.getElementById("stat-Rushing TDs")?.value) || 0;
    const recTD = parseFloat(document.getElementById("stat-Receiving TDs")?.value) || 0;

    extraBox.innerHTML = `
<pre>
Offense Football Breakdown:
Passing Yards: ${passYds}
Rushing Yards: ${rushYds}
Receiving Yards: ${recYds}

Pass+Rush Yards = ${passYds + rushYds}
Rush+Rec  Yards = ${rushYds + recYds}
Pass+Rush TDs   = ${passTD + rushTD}
Rush+Rec  TDs   = ${rushTD + recTD}
</pre>`;
    extraWrapper.classList.remove("hidden");
    extraCopyBtn.classList.remove("hidden");
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
  const result = `Fight Ended: Round ${round} @ ${min}:${sec.toString().padStart(2, "0")}\nTotal Fight Time = ${totalMin.toFixed(2)} min`;
  document.getElementById("fight-time-output").value = result;
}

function clearFightTime() {
  document.getElementById("fight-minutes").value = "";
  document.getElementById("fight-seconds").value = "";
  document.getElementById("fight-time-output").value = "";
  const checked = document.querySelector('input[name="fightRound"]:checked');
  if (checked) checked.checked = false;
}

function clearInputs() {
  document.querySelectorAll(".stat-input").forEach(input => {
    if (input.type === "checkbox") input.checked = false;
    else input.value = "";
  });
  document.getElementById("breakdown").value = "";
  document.getElementById("extra-breakdown-box").innerHTML = "";
  document.getElementById("extra-breakdown-box").classList.add("hidden");
  document.getElementById("fight-time-output").value = "";
  const bonus = document.querySelector('input[name="bonus"]:checked');
  if (bonus) bonus.checked = false;
}


function copyBreakdown() {
  const box = document.getElementById("breakdown");
  box.select();
  document.execCommand("copy");
}

function copyExtraBreakdown() {
  const extraBox = document.getElementById("extra-breakdown-box");
  if (!extraBox || extraBox.classList.contains("hidden")) return;
  const range = document.createRange();
  range.selectNodeContents(extraBox);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
  document.execCommand("copy");
}


document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    calculateScore();
  }
});

window.onload = loadLeagues;
