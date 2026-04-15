let leagues = {};
let currentCategory = 'tsports'; 

async function loadLeagues() {
  try {
    const res = await fetch("leagues.json");
    if (!res.ok) throw new Error("File not found");
    leagues = await res.json();
  } catch (err) {
    console.error("JSON Error: Loading backups.", err);
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

  if (scoreHeader) scoreHeader.style.display = (league.isEsports) ? "none" : "block";

  // --- 1. ESPORTS UI ---
  if (league.isEsports) {
    const esportsDiv = document.createElement("div");
    esportsDiv.className = "stat-group";
    esportsDiv.innerHTML = `
      <div class="group-title">Match Details</div>
      <div class="stat-row">IGN:<input type="text" class="stat-input esp-info" id="esp-player" /></div>
      <div class="stat-row">Team:<input type="text" class="stat-input esp-info" id="esp-team" /></div>
      <div class="stat-row">Opponent:<input type="text" class="stat-input esp-info" id="esp-opp" /></div>
      <div class="group-title" style="margin-top:15px">Map Stats</div>
      <div id="map-grid-container" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;"></div>`;
    container.appendChild(esportsDiv);
    const grid = document.getElementById('map-grid-container');
    for (let i = 1; i <= 7; i++) {
      grid.innerHTML += `<div class="stat-row">Map ${i}:<input type="text" class="stat-input esp-map" id="esp-m${i}" style="width: 60px;" /></div>`;
    }
    return;
  }

  // --- 2. NHL UI (3-WAY TOGGLE) ---
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
        <div class="group-title" style="border-top:1px solid #444; padding-top:10px;">TIME ON ICE</div>
        <div class="stat-row">Regulation<input type="text" class="stat-input nhl-period" id="nhl-reg" placeholder="00:00" /></div>
        <div class="stat-row">Overtime<input type="text" class="stat-input nhl-period" id="nhl-ot" placeholder="00:00" /></div>
      </div>
      <div id="nhl-skater-fields"></div>
      <div id="nhl-goalie-fields" class="hidden"></div>`;
    container.appendChild(nhlDiv);
    renderSimpleFields(league.skater_stats, "nhl-skater-fields");
    renderSimpleFields(league.goalie_stats, "nhl-goalie-fields", ["Win"]);
    return;
  }

  // --- 3. MLB UI (DUAL MODE WITH CORRECTED ORDER) ---
  if (leagueKey === "mlb") {
    const mlbDiv = document.createElement("div");
    mlbDiv.className = "stat-group";
    mlbDiv.innerHTML = `
      <div class="group-title">SELECT MLB MODE</div>
      <div class="stat-row" style="justify-content: center; gap: 20px; margin-bottom: 15px;">
        <label><input type="radio" name="mlbType" value="hitter" checked onclick="toggleMLBFields('hitter')"> Hitter</label>
        <label><input type="radio" name="mlbType" value="pitcher" onclick="toggleMLBFields('pitcher')"> Pitcher</label>
      </div>
      <div id="mlb-hitter-fields"></div>
      <div id="mlb-pitcher-fields" class="hidden"></div>`;
    container.appendChild(mlbDiv);
    
    // Hitter: Grouped segregation
    const hitGroups = { "Hitting Stats": ["Single", "Double", "Triple", "Home Run"], "Run/RBI Stats": ["Run", "RBI"], "Other Stats": ["BB", "HBP", "SB"] };
    renderGroupedStats(document.getElementById("mlb-hitter-fields"), league.hitter_stats, hitGroups);
    
    // Pitcher: Forced arrangement from screenshot
    const pFields = document.getElementById("mlb-pitcher-fields");
    ["Win", "Quality Start", "Earned Run", "Strikeout", "Innings Pitched"].forEach(label => {
      const pts = league.pitcher_stats[label];
      const row = document.createElement("div"); row.className = "stat-row";
      if (label === "Win") row.innerHTML = `<label class="stat-label"><input type="checkbox" class="stat-input" id="stat-${label}" />${label} — ${pts} pts</label>`;
      else if (label === "Quality Start") row.innerHTML = `<div class="stat-label">${label}<span class="tooltip">ℹ️<span class="tooltiptext">Auto: 6+ IP & ≤3 ER</span></span></div>`;
      else if (label === "Innings Pitched") row.innerHTML = `<div class="stat-label">Innings Pitched<span class="tooltip">ℹ️<span class="tooltiptext">1 IP = 3 outs; 0.1 IP = 1 out</span></span></div><input type="text" class="stat-input" id="stat-${label}" />`;
      else row.innerHTML = `<div class="stat-label">${label} — ${pts} pts</div><input type="text" class="stat-input" id="stat-${label}" />`;
      pFields.appendChild(row);
    });
    return;
  }

  // --- 4. MMA/BOXING FIGHT TIME & BONUSES ---
  if (league.hasFightTime) {
    const rounds = (leagueKey === "mma") ? 5 : 12;
    const fightRoundDiv = document.getElementById("fight-rounds");
    fightRoundDiv.innerHTML = "<label>Fight ended in:</label><br>";
    for (let i = 1; i <= rounds; i++) {
      fightRoundDiv.innerHTML += `<label><input type="radio" name="fightRound" value="${i}"> Round ${i}</label><br>`;
    }
    fightTimeContainer.classList.remove("hidden");
  }

  // --- 5. GROUPED LEAGUES (NFL, DST) ---
  const groups = {
    nfl_cfb: { "Passing": ["Passing Yards", "Passing TDs", "Interceptions"], "Rushing": ["Rushing Yards", "Rushing TDs"], "Receiving": ["Receiving Yards", "Receiving TDs", "Receptions"], "Turnovers": ["Fumbles Lost"], "Misc": ["2 Point Conversions", "Offensive Fumble Recovery TD", "Kick/Punt/Field Goal Return TD"] },
    dst: { "Standard Defensive Stats": ["Sack", "Interception", "Fumble Recovery"], "Return TDs": ["Punt/Kickoff/FG Return for TD", "Interception Return TD", "Fumble Recovery TD", "Blocked Punt or FG Return TD"], "Special Teams / Misc": ["Safety", "Blocked Kick", "2pt/XP Return"] }
  };
  if (groups[leagueKey]) {
    renderGroupedStats(container, league.stats, groups[leagueKey]);
    if (leagueKey === "dst" && league.pointsAllowedTiers) {
      const paDiv = document.createElement("div"); paDiv.className = "stat-group";
      paDiv.innerHTML = `<div class="group-title">Points Allowed</div><div class="stat-row">Points Allowed<input type="text" class="stat-input" id="stat-Points Allowed" /></div>`;
      container.appendChild(paDiv);
    }
    return;
  }

  // --- 6. MOTORSPORTS UI ---
  if (leagueKey === "nascar" || leagueKey === "indycar") {
    const custom = document.createElement("div");
    custom.className = "stat-group";
    custom.innerHTML = `
      <div class="stat-row">Starting Position<input type="text" class="stat-input" id="stat-Starting Position" /></div>
      <div class="stat-row">Finishing Position<input type="text" class="stat-input" id="stat-Finishing Position" /></div>
      ${leagueKey === "nascar" ? `<div class="stat-row">Fastest Laps × 0.45<input type="text" class="stat-input" id="stat-Fastest Laps" /></div>` : ""}
      <div class="stat-row">Laps Led × 0.25<input type="text" class="stat-input" id="stat-Laps Led" /></div>`;
    container.appendChild(custom);
    return;
  }

  // Fallback for NBA, Tennis, Soccer, etc.
  const stats = Array.isArray(league.stats) ? league.stats.map(s => [s.label, s.points]) : Object.entries(league.stats || {});
  stats.forEach(([label, points]) => {
    const row = document.createElement("div"); row.className = "stat-row";
    if (label === "Win" || label === "Match Played") row.innerHTML = `<label class="stat-label"><input type="checkbox" class="stat-input" id="stat-${label}" />${label} — ${points} pts</label>`;
    else row.innerHTML = `<div class="stat-label">${label} — ${points} pts</div><input type="text" class="stat-input" id="stat-${label}" />`;
    container.appendChild(row);
  });

  if (league.bonuses?.length) {
    const title = document.createElement("h3"); title.textContent = "Bonus:"; bonusContainer.appendChild(title);
    league.bonuses.forEach(b => { bonusContainer.innerHTML += `<div class="bonus-option"><label><input type="radio" name="bonus" value="${b.points}" />${b.label} — ${b.points} pts</label></div>`; });
  }
}

function renderSimpleFields(statsObj, targetId, checks = []) {
  const target = document.getElementById(targetId);
  Object.entries(statsObj || {}).forEach(([label, pts]) => {
    const row = document.createElement("div"); row.className = "stat-row";
    if (checks.includes(label)) row.innerHTML = `<label class="stat-label"><input type="checkbox" class="stat-input" id="stat-${label}" />${label} — ${pts} pts</label>`;
    else row.innerHTML = `<div class="stat-label">${label} — ${pts} pts</div><input type="text" class="stat-input" id="stat-${label}" />`;
    target.appendChild(row);
  });
}

function renderGroupedStats(target, stats, groupMap) {
  for (const [groupName, labels] of Object.entries(groupMap)) {
    const groupDiv = document.createElement("div"); groupDiv.className = "stat-group";
    groupDiv.innerHTML = `<div class="group-title">${groupName}</div>`;
    labels.forEach(label => {
      const pts = Array.isArray(stats) ? stats.find(s => s.label === label)?.points : stats[label];
      if (pts !== undefined) groupDiv.innerHTML += `<div class="stat-row"><div class="stat-label">${label} — ${pts} pts</div><input type="text" class="stat-input" id="stat-${label}" /></div>`;
    });
    target.appendChild(groupDiv);
  }
}

function toggleNHLFields(type) {
  document.getElementById("nhl-skater-fields").classList.toggle("hidden", type !== "skater");
  document.getElementById("nhl-goalie-fields").classList.toggle("hidden", type !== "goalie");
  document.getElementById("nhl-toi-fields").classList.toggle("hidden", type !== "toi");
  const sh = document.getElementById("score-header");
  if (sh) sh.style.display = (type === "toi") ? "none" : "block";
}

function toggleMLBFields(type) {
  document.getElementById("mlb-hitter-fields").classList.toggle("hidden", type !== "hitter");
  document.getElementById("mlb-pitcher-fields").classList.toggle("hidden", type !== "pitcher");
}

function calculateScore() {
  const leagueKey = document.getElementById("league").value;
  const league = leagues[leagueKey];
  const breakdownBox = document.getElementById("breakdown");

  if (leagueKey === "nhl") {
    const type = document.querySelector('input[name="nhlType"]:checked').value;
    if (type === "toi") {
        let ts = 0; let text = "Time On Ice:\n";
        const r = document.getElementById("nhl-reg").value.trim(); const o = document.getElementById("nhl-ot").value.trim();
        if (r.includes(":")) { const [m,s] = r.split(":").map(Number); ts += (m*60)+s; text += `Regulation: ${r} (${(m+s/60).toFixed(2)})\n`; }
        if (o.includes(":")) { const [m,s] = o.split(":").map(Number); ts += (m*60)+s; text += `Overtime: ${o} (${(m+s/60).toFixed(2)})\n`; }
        breakdownBox.value = text + `------------------------------------\nTotal TOI: ${Math.floor(ts/60)}:${(ts%60).toString().padStart(2,'0')}\nDecimal: ${(ts/60).toFixed(2)}`;
        return;
    }
    const stats = type === "skater" ? league.skater_stats : league.goalie_stats;
    let total = 0; let text = `${type.toUpperCase()} Breakdown:\n`;
    Object.entries(stats).forEach(([l, p]) => {
      const i = document.getElementById(`stat-${l}`);
      const v = i.type === "checkbox" ? (i.checked ? 1 : 0) : parseFloat(i.value) || 0;
      if (v !== 0) { text += `${l}: ${p} pt (${v}) = ${format(v*p)}\n`; total += v*p; }
    });
    breakdownBox.value = text + `\nTOTAL FS = ${format(total)}`; return;
  }

  if (leagueKey === "mlb") {
    const type = document.querySelector('input[name="mlbType"]:checked').value;
    const stats = (type === "hitter") ? league.hitter_stats : league.pitcher_stats;
    let total = 0; let text = ""; let innings = 0, earnedRuns = 0;
    Object.entries(stats).forEach(([l, p]) => {
      const i = document.getElementById(`stat-${l}`);
      const v = (i.type === "checkbox") ? (i.checked ? 1 : 0) : parseFloat(i.value) || 0;
      if (v !== 0) {
        if (type === "pitcher" && l === "Innings Pitched") {
          innings = v; const outs = Math.floor(v)*3 + Math.round((v-Math.floor(v))*10);
          text += `Out: 1 pt (${outs}) = ${format(outs)}\n`; total += outs; return;
        }
        if (l === "Earned Run") earnedRuns = v;
        text += `${l}: ${p} pt (${v}) = ${format(v*p)}\n`; total += v*p;
      }
    });
    if (type === "pitcher" && innings >= 6 && earnedRuns <= 3) {
      const qs = league.pitcher_stats["Quality Start"];
      text += `Quality Start: ${qs} pts (1) = ${qs}\n`; total += qs;
    }
    breakdownBox.value = text + `\nTOTAL FS = ${format(total)}`;
    showExtraBreakdown("mlb_" + type); return;
  }

  if (leagueKey === "nascar" || leagueKey === "indycar") {
    const s = parseInt(document.getElementById("stat-Starting Position").value) || 0;
    const f = parseInt(document.getElementById("stat-Finishing Position").value) || 0;
    const l = parseFloat(document.getElementById("stat-Laps Led").value) || 0;
    let total = 0; let text = "";
    if (s && f) { total += (s-f); text += `Place Differential: ${s-f} pts\n`; }
    const pArr = [45,42,41,40,39,38,37,36,35,34,32,31,30,29,28,27,26,25,24,23,21,20,19,18,17,16,15,14,13,12,10,9,8,7,6,5,4,3,2,1];
    if (f >= 1 && f <= 40) { total += pArr[f-1]; text += `Finishing Position (${f}): ${pArr[f-1]} pts\n`; }
    if (leagueKey === "nascar") { const fast = parseFloat(document.getElementById("stat-Fastest Laps").value) || 0; total += fast*0.45; text += `Fastest Laps: ${fast} × 0.45 = ${format(fast*0.45)}\n`; }
    total += l*0.25; text += `Laps Led: ${l} × 0.25 = ${format(l*0.25)}\n`;
    breakdownBox.value = text + `\nTOTAL FS: ${format(total)}`; return;
  }

  // Fallback Logic for NFL, NBA, etc.
  const statsFallback = Array.isArray(league.stats) ? league.stats.map(s => [s.label, s.points]) : Object.entries(league.stats || {});
  let totalS = 0; let textS = "";
  statsFallback.forEach(([l, p]) => {
    const i = document.getElementById(`stat-${l}`);
    if (!i) return;
    const v = i.type === "checkbox" ? (i.checked ? 1 : 0) : parseFloat(i.value) || 0;
    if (v !== 0) { textS += `${l}: ${p} pt (${v}) = ${format(v*p)}\n`; totalS += v*p; }
  });
  const bonus = document.querySelector('input[name="bonus"]:checked');
  if (bonus) { const bP = parseFloat(bonus.value); textS += `Bonus: ${bP} pts (1) = ${bP}\n`; totalS += bP; }
  if (leagueKey === "dst") {
    const pa = parseFloat(document.getElementById("stat-Points Allowed").value);
    const tier = league.pointsAllowedTiers?.find(t => pa <= t.max);
    if (tier) { textS += `Points Allowed: ${tier.points} pts (1) = ${tier.points}\n`; totalS += tier.points; }
  }
  breakdownBox.value = textS + `\nTOTAL FS = ${format(totalS)}`;
  showExtraBreakdown(leagueKey);
}

function showExtraBreakdown(leagueKey) {
  const extraBox = document.getElementById("extra-breakdown-box");
  extraBox.innerHTML = ""; extraBox.classList.add("hidden");
  if (leagueKey === "nba") {
    const p = parseFloat(document.getElementById("stat-Points")?.value) || 0;
    const r = parseFloat(document.getElementById("stat-Rebound")?.value) || 0;
    const a = parseFloat(document.getElementById("stat-Assist")?.value) || 0;
    extraBox.innerHTML = `<h3>Single Stats</h3>Pts: ${p}, Rebs: ${r}, Asts: ${a}<br>P+R+A = ${p+r+a}`;
    extraBox.classList.remove("hidden");
  } else if (leagueKey === "mlb_hitter") {
    const s = parseFloat(document.getElementById("stat-Single")?.value) || 0;
    const d = parseFloat(document.getElementById("stat-Double")?.value) || 0;
    const t = parseFloat(document.getElementById("stat-Triple")?.value) || 0;
    const h = parseFloat(document.getElementById("stat-Home Run")?.value) || 0;
    extraBox.innerHTML = `<h3>Single Stats Hitter</h3>Hits: ${s+d+t+h}, Runs: ${parseFloat(document.getElementById("stat-Run")?.value)||0}, RBI: ${parseFloat(document.getElementById("stat-RBI")?.value)||0}`;
    extraBox.classList.remove("hidden");
  } else if (leagueKey === "nfl_cfb") {
    const pY = parseFloat(document.getElementById("stat-Passing Yards")?.value) || 0;
    const rY = parseFloat(document.getElementById("stat-Rushing Yards")?.value) || 0;
    const reY = parseFloat(document.getElementById("stat-Receiving Yards")?.value) || 0;
    extraBox.innerHTML = `<h3>Offense Stats</h3>Pass+Rush: ${pY+rY}, Rush+Rec: ${rY+reY}`;
    extraBox.classList.remove("hidden");
  }
}

function clearInputs() {
  document.querySelectorAll(".stat-input, .nhl-period, .esp-info, .esp-map, #fight-minutes, #fight-seconds").forEach(i => { i.value = ""; if(i.type === "checkbox") i.checked = false; });
  document.getElementById("breakdown").value = "";
  document.querySelectorAll('input[type="radio"]').forEach(r => r.checked = false);
  document.getElementById("extra-breakdown-box").classList.add("hidden");
}

function copyBreakdown() { document.getElementById("breakdown").select(); document.execCommand("copy"); }
document.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); calculateScore(); } });
window.onload = loadLeagues;
