let leagues = {};
let currentCategory = 'tsports'; 

async function loadLeagues() {
  try {
    const res = await fetch("leagues.json");
    if (!res.ok) throw new Error("File not found");
    leagues = await res.json();
  } catch (err) {
    console.error("JSON Error: Loading backups.", err);
    // Minimal backup for critical failure
    leagues = {
      "nba": { "name": "NBA FS", "category": "tsports", "stats": { "Points": 1, "Rebound": 1.2, "Assist": 1.5, "Block": 3, "Steal": 3, "Turnover": -1 } },
      "nhl": { "name": "NHL", "category": "tsports", "hasTOI": true },
      "mlb": { "name": "MLB", "category": "tsports" }
    };
  }
  populateDropdown();
}

function setCategory(cat) {
  currentCategory = cat;
  const btnT = document.getElementById('btn-tsports');
  const btnE = document.getElementById('btn-esports');
  if(btnT) btnT.classList.toggle('active', cat === 'tsports');
  if(btnE) btnE.classList.toggle('active', cat === 'esports');
  populateDropdown();
}

function populateDropdown() {
  const select = document.getElementById("league");
  if (!select) return;
  select.innerHTML = "";
  Object.entries(leagues).forEach(([key, val]) => {
    const leagueCat = val.category || 'tsports'; 
    if (leagueCat === currentCategory) {
      const opt = document.createElement("option");
      opt.value = key;
      opt.textContent = val.name;
      select.appendChild(opt);
    }
  });
  loadStats(); 
}

function format(val) {
  return val % 1 === 0 ? val.toString() : val.toFixed(2);
}

function loadStats() {
  const selectEl = document.getElementById("league");
  if (!selectEl) return;
  const leagueKey = selectEl.value;
  const league = leagues[leagueKey];
  if (!league) return;

  const container = document.getElementById("stats-container");
  const bonusContainer = document.getElementById("bonus-container");
  const fightTimeContainer = document.getElementById("fight-time-container");
  const extraBox = document.getElementById("extra-breakdown-box");
  const scoreHeader = document.getElementById("score-header");

  container.innerHTML = "";
  bonusContainer.innerHTML = "";
  extraBox.innerHTML = "";
  extraBox.classList.add("hidden");
  fightTimeContainer.classList.add("hidden");

  // Toggle Header visibility
  if (scoreHeader) scoreHeader.style.display = (league.isEsports) ? "none" : "block";

  // --- 1. ESPORTS UI ---
  if (league.isEsports) {
    const esportsDiv = document.createElement("div");
    esportsDiv.className = "stat-group";
    esportsDiv.innerHTML = `
      <div class="group-title">Match Details</div>
      <div class="stat-row" style="justify-content: flex-start; gap: 10px; margin-bottom: 5px;">
        <div class="stat-label" style="min-width: 80px;">IGN:</div>
        <input type="text" class="stat-input esp-info" id="esp-player" placeholder="Enter IGN" style="width: 200px;" />
      </div>
      <div class="stat-row" style="justify-content: flex-start; gap: 10px; margin-bottom: 5px;">
        <div class="stat-label" style="min-width: 80px;">Team:</div>
        <input type="text" class="stat-input esp-info" id="esp-team" placeholder="Player Team" style="width: 200px;" />
      </div>
      <div class="stat-row" style="justify-content: flex-start; gap: 10px; margin-bottom: 5px;">
        <div class="stat-label" style="min-width: 80px;">Opponent:</div>
        <input type="text" class="stat-input esp-info" id="esp-opp" placeholder="Opponent Team" style="width: 200px;" />
      </div>
      <div class="group-title" style="margin-top:15px">Map Stats</div>
      <div id="map-grid-container" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;"></div>
    `;
    container.appendChild(esportsDiv);
    const grid = document.getElementById('map-grid-container');
    for (let i = 1; i <= 7; i++) {
      grid.innerHTML += `
        <div class="stat-row" style="justify-content: flex-start; gap: 5px;">
          <div class="stat-label" style="min-width: 60px;">Map ${i}:</div>
          <input type="text" class="stat-input esp-map" id="esp-m${i}" placeholder="0" style="width: 60px; text-align: center;" />
        </div>`;
    }
    return;
  }

  // --- 2. NHL UI (3-WAY) ---
  if (leagueKey === "nhl") {
    const nhlDiv = document.createElement("div");
    nhlDiv.className = "stat-group";
    nhlDiv.innerHTML = `
      <div class="group-title">Select NHL Mode</div>
      <div class="stat-row" style="justify-content: center; gap: 15px; margin-bottom: 15px;">
        <label><input type="radio" name="nhlType" value="skater" checked onclick="toggleNHLFields('skater')"> Skater</label>
        <label><input type="radio" name="nhlType" value="goalie" onclick="toggleNHLFields('goalie')"> Goalie</label>
        <label><input type="radio" name="nhlType" value="toi" onclick="toggleNHLFields('toi')"> TOI</label>
      </div>
      <div id="nhl-toi-fields" class="hidden">
        <div class="group-title" style="border-top: 1px solid #444; padding-top: 10px;">TIME ON ICE</div>
        <div class="stat-row"><div class="stat-label">Regulation</div><input type="text" class="stat-input nhl-period" id="nhl-reg" placeholder="00:00" /></div>
        <div class="stat-row"><div class="stat-label">Overtime</div><input type="text" class="stat-input nhl-period" id="nhl-ot" placeholder="00:00" /></div>
      </div>
      <div id="nhl-skater-fields"></div>
      <div id="nhl-goalie-fields" class="hidden"></div>
    `;
    container.appendChild(nhlDiv);
    renderDynamicFields(league.skater_stats, "nhl-skater-fields");
    renderDynamicFields(league.goalie_stats, "nhl-goalie-fields", ["Win"]);
    return;
  }

  // --- 3. MLB UI (DUAL MODE) ---
  if (leagueKey === "mlb") {
    const mlbDiv = document.createElement("div");
    mlbDiv.className = "stat-group";
    mlbDiv.innerHTML = `
      <div class="group-title">Select MLB Mode</div>
      <div class="stat-row" style="justify-content: center; gap: 20px; margin-bottom: 15px;">
        <label><input type="radio" name="mlbType" value="hitter" checked onclick="toggleMLBFields('hitter')"> Hitter</label>
        <label><input type="radio" name="mlbType" value="pitcher" onclick="toggleMLBFields('pitcher')"> Pitcher</label>
      </div>
      <div id="mlb-hitter-fields"></div>
      <div id="mlb-pitcher-fields" class="hidden"></div>
    `;
    container.appendChild(mlbDiv);
    renderDynamicFields(league.hitter_stats, "mlb-hitter-fields");
    renderDynamicFields(league.pitcher_stats, "mlb-pitcher-fields", ["Win", "Quality Start"], true);
    return;
  }

  // --- 4. FIGHT TIME / MMA ---
  if (league.hasFightTime) {
    const rounds = (leagueKey === "mma") ? 5 : 12;
    const fightRoundDiv = document.getElementById("fight-rounds");
    fightRoundDiv.innerHTML = "<label>Fight ended in:</label><br>";
    for (let i = 1; i <= rounds; i++) {
      fightRoundDiv.innerHTML += `<label><input type="radio" name="fightRound" value="${i}"> Round ${i}</label><br>`;
    }
    fightTimeContainer.classList.remove("hidden");
  }

  // --- 5. GROUPED LEAGUES (NFL, DST, SOCCER, KICKERS) ---
  const groups = {
    nfl_cfb: { "Passing": ["Passing Yards", "Passing TDs", "Interceptions"], "Rushing": ["Rushing Yards", "Rushing TDs"], "Receiving": ["Receiving Yards", "Receiving TDs", "Receptions"], "Turnovers": ["Fumbles Lost"], "Misc": ["2 Point Conversions", "Offensive Fumble Recovery TD", "Kick/Punt/Field Goal Return TD"] },
    dst: { "Standard Defensive Stats": ["Sack", "Interception", "Fumble Recovery"], "Return TDs": ["Punt/Kickoff/FG Return for TD", "Interception Return TD", "Fumble Recovery TD", "Blocked Punt or FG Return TD"], "Special Teams / Misc": ["Safety", "Blocked Kick", "2pt/XP Return"] },
    kickers: { "Field Goals": ["FG 0-39 yards", "FG 40-49 yards", "FG 50+ yards"], "Extra Points": ["XP conversions"], "Missed Kicks": ["FG Missed", "XP Missed"] },
    soccer: { "Scoring": ["Goal", "Assist", "Goal from PEN"], "Shooting": ["Shot on Target"], "Passing": ["Completed Pass", "Missed Pass"], "Discipline": ["Yellow Card", "Red Card"] }
  };

  if (groups[leagueKey]) {
    renderGroupedStats(container, league.stats, groups[leagueKey]);
    if (leagueKey === "dst" && league.pointsAllowedTiers) {
      const paDiv = document.createElement("div");
      paDiv.className = "stat-group";
      paDiv.innerHTML = `<div class="group-title">Points Allowed</div><div class="stat-row"><div class="stat-label">Points Allowed</div><input type="text" class="stat-input" id="stat-Points Allowed" /></div>`;
      container.appendChild(paDiv);
    }
    return;
  }

  // --- 6. MOTORSPORTS UI ---
  if (leagueKey === "nascar" || leagueKey === "indycar") {
    const custom = document.createElement("div");
    custom.className = "stat-group";
    custom.innerHTML = `
      <div class="stat-row"><div class="stat-label">Starting Position</div><input type="text" class="stat-input" id="stat-Starting Position" /></div>
      <div class="stat-row"><div class="stat-label">Finishing Position</div><input type="text" class="stat-input" id="stat-Finishing Position" /></div>
      ${leagueKey === "nascar" ? `<div class="stat-row"><div class="stat-label">Fastest Laps × 0.45</div><input type="text" class="stat-input" id="stat-Fastest Laps" /></div>` : ""}
      <div class="stat-row"><div class="stat-label">Laps Led × 0.25</div><input type="text" class="stat-input" id="stat-Laps Led" /></div>`;
    container.appendChild(custom);
    return;
  }

  // Default Stats Render (Tennis, NBA, etc.)
  const stats = Array.isArray(league.stats) ? league.stats.map(s => [s.label, s.points]) : Object.entries(league.stats || {});
  stats.forEach(([label, points]) => {
    const row = document.createElement("div");
    row.className = "stat-row";
    if (label === "Win" || label === "Match Played") {
      row.innerHTML = `<label class="stat-label"><input type="checkbox" class="stat-input" id="stat-${label}" />${label} — ${points} pts</label>`;
    } else {
      row.innerHTML = `<div class="stat-label">${label} — ${points} pts</div><input type="text" class="stat-input" id="stat-${label}" />`;
    }
    container.appendChild(row);
  });
}

function renderDynamicFields(statsObj, containerId, checkboxes = [], isPitcher = false) {
  const target = document.getElementById(containerId);
  Object.entries(statsObj || {}).forEach(([label, pts]) => {
    const row = document.createElement("div");
    row.className = "stat-row";
    if (checkboxes.includes(label)) {
        if (label === "Quality Start") row.innerHTML = `<div class="stat-label">${label}<span class="tooltip">ℹ️<span class="tooltiptext">Auto: 6+ IP & ≤3 ER</span></span></div>`;
        else row.innerHTML = `<label class="stat-label"><input type="checkbox" class="stat-input" id="stat-${label}" />${label} — ${pts} pts</label>`;
    } else if (isPitcher && label === "Innings Pitched") {
        row.innerHTML = `<div class="stat-label">Innings Pitched<span class="tooltip">ℹ️<span class="tooltiptext">1 IP = 3 outs; 0.1 IP = 1 out</span></span></div><input type="text" class="stat-input" id="stat-${label}" />`;
    } else {
        row.innerHTML = `<div class="stat-label">${label} — ${pts} pts</div><input type="text" class="stat-input" id="stat-${label}" />`;
    }
    target.appendChild(row);
  });
}

function toggleNHLFields(type) {
  const scoreHeader = document.getElementById("score-header");
  document.getElementById("nhl-skater-fields").classList.toggle("hidden", type !== "skater");
  document.getElementById("nhl-goalie-fields").classList.toggle("hidden", type !== "goalie");
  document.getElementById("nhl-toi-fields").classList.toggle("hidden", type !== "toi");
  if (scoreHeader) scoreHeader.style.display = (type === "toi") ? "none" : "block";
}

function toggleMLBFields(type) {
  document.getElementById("mlb-hitter-fields").classList.toggle("hidden", type !== "hitter");
  document.getElementById("mlb-pitcher-fields").classList.toggle("hidden", type !== "pitcher");
}

function renderGroupedStats(container, stats, groupMap) {
  for (const [groupName, labels] of Object.entries(groupMap)) {
    const groupDiv = document.createElement("div");
    groupDiv.className = "stat-group";
    groupDiv.innerHTML = `<div class="group-title">${groupName}</div>`;
    labels.forEach(label => {
      const pts = Array.isArray(stats) ? stats.find(s => s.label === label)?.points : stats[label];
      if (pts === undefined) return;
      groupDiv.innerHTML += `<div class="stat-row"><div class="stat-label">${label} — ${pts} pts</div><input type="text" class="stat-input" id="stat-${label}" /></div>`;
    });
    container.appendChild(groupDiv);
  }
}

function calculateScore() {
  const leagueKey = document.getElementById("league").value;
  const league = leagues[leagueKey];
  const breakdownBox = document.getElementById("breakdown");

  if (league.isEsports) {
    const player = document.getElementById("esp-player").value || "N/A";
    const team = document.getElementById("esp-team").value || "N/A";
    const opp = document.getElementById("esp-opp").value || "N/A";
    let total = 0; let text = `IGN: ${player}\nMatch: ${team} vs ${opp}\n--------------------------\n`;
    for (let i = 1; i <= 7; i++) {
      const val = parseFloat(document.getElementById(`esp-m${i}`).value) || 0;
      if (val > 0) { text += `Map ${i}: ${val}\n`; total += val; }
    }
    breakdownBox.value = text + `--------------------------\nTotal Kills/Headshots: ${total}`;
    return;
  }

  if (leagueKey === "nhl") {
    const nhlType = document.querySelector('input[name="nhlType"]:checked').value;
    if (nhlType === "toi") {
        let totalSec = 0; let text = "Time On Ice Breakdown:\n";
        const reg = document.getElementById("nhl-reg")?.value.trim();
        const ot = document.getElementById("nhl-ot")?.value.trim();
        if (reg && reg.includes(":")) { const [m, s] = reg.split(":").map(Number); totalSec += (m*60)+s; text += `Regulation: ${reg} (${(m + s/60).toFixed(2)})\n`; }
        if (ot && ot.includes(":")) { const [m, s] = ot.split(":").map(Number); totalSec += (m*60)+s; text += `Overtime: ${ot} (${(m + s/60).toFixed(2)})\n`; }
        breakdownBox.value = text + `------------------------------------\nTotal TOI: ${Math.floor(totalSec/60)}:${(totalSec%60).toString().padStart(2,'0')}`;
        return;
    }
    const statsToUse = (nhlType === "skater") ? league.skater_stats : league.goalie_stats;
    let fsTotal = 0; let text = `${nhlType.toUpperCase()} FS Breakdown:\n`;
    Object.entries(statsToUse).forEach(([label, points]) => {
      const input = document.getElementById(`stat-${label}`);
      if (!input || (!input.value && !input.checked)) return;
      const val = input.type === "checkbox" ? (input.checked ? 1 : 0) : parseFloat(input.value) || 0;
      if (val !== 0) { text += `${label}: ${points} pt${points===1?'':'s'} (${val}) = ${format(val*points)}\n`; fsTotal += val*points; }
    });
    breakdownBox.value = text + `\nTOTAL FS = ${format(fsTotal)}`;
    return;
  }

  if (leagueKey === "mlb") {
    const mlbType = document.querySelector('input[name="mlbType"]:checked').value;
    const statsToUse = (mlbType === "hitter") ? league.hitter_stats : league.pitcher_stats;
    let total = 0; let breakdown = ""; let innings = 0, earnedRuns = 0;
    Object.entries(statsToUse).forEach(([label, points]) => {
      const input = document.getElementById(`stat-${label}`);
      if (!input || (!input.value && !input.checked)) return;
      const val = (input.type === "checkbox") ? (input.checked ? 1 : 0) : parseFloat(input.value) || 0;
      if (val !== 0) {
        if (mlbType === "pitcher" && label === "Innings Pitched") {
          innings = val; const full = Math.floor(val); 
          const outs = (full * 3) + Math.round((val - full) * 10);
          breakdown += `Out: 1 pt (${outs}) = ${format(outs)}\n`; total += (outs * 1); return;
        }
        if (mlbType === "pitcher" && label === "Earned Run") earnedRuns = val;
        breakdown += `${label}: ${points} pt${points===1?'':'s'} (${val}) = ${format(val * points)}\n`; total += val * points;
      }
    });
    if (mlbType === "pitcher" && innings >= 6 && earnedRuns <= 3) {
      const qsP = league.pitcher_stats["Quality Start"] || 0;
      breakdown += `Quality Start: ${qsP} pts (1) = ${qsP}\n`; total += qsP;
    }
    breakdownBox.value = breakdown + `\nTOTAL FS = ${format(total)}`;
    showExtraBreakdown("mlb_" + mlbType);
    return;
  }

  if (leagueKey === "nascar" || leagueKey === "indycar") {
    const start = parseInt(document.getElementById("stat-Starting Position")?.value) || 0;
    const finish = parseInt(document.getElementById("stat-Finishing Position")?.value) || 0;
    const led = parseFloat(document.getElementById("stat-Laps Led")?.value) || 0;
    let totalM = 0; let bM = "";
    if (start && finish) { totalM += (start - finish); bM += `Place Differential: ${start - finish} pts\n`; }
    const pArr = [45,42,41,40,39,38,37,36,35,34,32,31,30,29,28,27,26,25,24,23,21,20,19,18,17,16,15,14,13,12,10,9,8,7,6,5,4,3,2,1];
    if (finish >= 1 && finish <= 40) { totalM += pArr[finish-1]; bM += `Finishing Position (${finish}): ${pArr[finish-1]} pts\n`; }
    const fast = parseFloat(document.getElementById("stat-Fastest Laps")?.value) || 0;
    if(leagueKey === "nascar") { totalM += fast * 0.45; bM += `Fastest Laps: ${fast} × 0.45 = ${format(fast * 0.45)}\n`; }
    totalM += led * 0.25; bM += `Laps Led: ${led} × 0.25 = ${format(led * 0.25)}\n`;
    breakdownBox.value = bM + `\nTOTAL FS: ${format(totalM)}`;
    return;
  }

  const stats = Array.isArray(league.stats) ? league.stats.map(s => [s.label, s.points]) : Object.entries(league.stats || {});
  let totalS = 0; let breakdownS = "";
  stats.forEach(([label, points]) => {
    const input = document.getElementById(`stat-${label}`);
    if (!input || (!input.value && !input.checked)) return;
    const val = input.type === "checkbox" ? (input.checked ? 1 : 0) : parseFloat(input.value) || 0;
    if (val !== 0) { breakdownS += `${label}: ${points} pt${points===1?'':'s'} (${val}) = ${format(val * points)}\n`; totalS += val * points; }
  });

  const bonusRadio = document.querySelector('input[name="bonus"]:checked');
  if (bonusRadio) {
    const bPts = parseFloat(bonusRadio.value);
    const bL = bonusRadio.closest('label').innerText.split(" — ")[0].trim(); 
    breakdownS += `${bL}: ${bPts} pts (1) = ${bPts}\n`; totalS += bPts;
  }

  if (leagueKey === "dst") {
    const pa = parseFloat(document.getElementById("stat-Points Allowed")?.value);
    if (!isNaN(pa)) {
      const tier = league.pointsAllowedTiers.find(t => pa <= t.max);
      if (tier) { breakdownS += `Points Allowed: ${tier.points} pts (1) = ${tier.points}\n`; totalS += tier.points; }
    }
  }

  breakdownBox.value = breakdownS + `\nTOTAL FS = ${format(totalS)}`;
  showExtraBreakdown(leagueKey);
}

function showExtraBreakdown(leagueKey) {
  const extraBox = document.getElementById("extra-breakdown-box");
  extraBox.innerHTML = ""; extraBox.classList.add("hidden");
  if (leagueKey === "nba") {
    const pts = parseFloat(document.getElementById("stat-Points")?.value) || 0;
    const reb = parseFloat(document.getElementById("stat-Rebound")?.value) || 0;
    const ast = parseFloat(document.getElementById("stat-Assist")?.value) || 0;
    extraBox.innerHTML = `<h3>Single Stats</h3>Pts: ${pts}, Rebs: ${reb}, Asts: ${ast}<br>P+R+A = ${pts + reb + ast}<br>P+A = ${pts + ast}<br>P+R = ${pts + reb}<br>R+A = ${reb + ast}`;
    extraBox.classList.remove("hidden");
  } else if (leagueKey === "mlb_hitter") {
    const s = parseFloat(document.getElementById("stat-Single")?.value) || 0;
    const d = parseFloat(document.getElementById("stat-Double")?.value) || 0;
    const t = parseFloat(document.getElementById("stat-Triple")?.value) || 0;
    const hr = parseFloat(document.getElementById("stat-Home Run")?.value) || 0;
    const r = parseFloat(document.getElementById("stat-Run")?.value) || 0;
    const rbi = parseFloat(document.getElementById("stat-RBI")?.value) || 0;
    const hits = s + d + t + hr;
    extraBox.innerHTML = `<h3>Single Stats Hitter</h3>Hits: ${hits}, Runs: ${r}, RBI: ${rbi}<br>H+R+RBI = ${hits + r + rbi}`;
    extraBox.classList.remove("hidden");
  } else if (leagueKey === "nfl_cfb") {
    const pY = parseFloat(document.getElementById("stat-Passing Yards")?.value) || 0;
    const rY = parseFloat(document.getElementById("stat-Rushing Yards")?.value) || 0;
    const reY = parseFloat(document.getElementById("stat-Receiving Yards")?.value) || 0;
    const pT = parseFloat(document.getElementById("stat-Passing TDs")?.value) || 0;
    const rT = parseFloat(document.getElementById("stat-Rushing TDs")?.value) || 0;
    const reT = parseFloat(document.getElementById("stat-Receiving TDs")?.value) || 0;
    extraBox.innerHTML = `<h3>Offense Stats</h3>Pass+Rush Yds: ${pY + rY}<br>Rush+Rec Yds: ${rY + reY}<br>Pass+Rush TDs: ${pT + rT}<br>Rush+Rec TDs: ${rT + reT}`;
    extraBox.classList.remove("hidden");
  }
}

function calculateFightTime() {
  const round = parseInt(document.querySelector('input[name="fightRound"]:checked')?.value);
  const min = parseInt(document.getElementById("fight-minutes").value) || 0;
  const sec = parseInt(document.getElementById("fight-seconds").value) || 0;
  if (!round) return;
  const leagueKey = document.getElementById("league").value;
  const perRound = (leagueKey === "mma") ? 5 : 3;
  const totalMin = (round - 1) * perRound + min + sec / 60;
  document.getElementById("fight-time-output").value = `Fight Ended: Round ${round} @ ${min}:${sec.toString().padStart(2, "0")}\nTotal FS Fight Time = ${totalMin.toFixed(2)} min`;
}

function clearInputs() {
  document.querySelectorAll(".stat-input, .nhl-period, .esp-info, .esp-map, #fight-minutes, #fight-seconds").forEach(i => { i.value = ""; if(i.type === "checkbox") i.checked = false; });
  document.getElementById("breakdown").value = "";
  document.getElementById("fight-time-output").value = "";
  document.querySelectorAll('input[type="radio"]').forEach(r => r.checked = false);
  const extra = document.getElementById("extra-breakdown-box");
  if(extra) extra.classList.add("hidden");
}

function copyBreakdown() { const box = document.getElementById("breakdown"); box.select(); document.execCommand("copy"); }

document.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); calculateScore(); } });
window.onload = loadLeagues;
