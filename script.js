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
      "nhl": { "name": "NHL", "category": "tsports", "hasTOI": true }
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

  // --- 2. NHL 3-WAY TOGGLE UI ---
  if (leagueKey === "nhl") {
    const nhlDiv = document.createElement("div");
    nhlDiv.className = "stat-group";
    nhlDiv.innerHTML = `
      <div class="group-title">Select NHL Mode</div>
      <div class="stat-row" style="justify-content: center; gap: 15px; margin-bottom: 15px;">
        <label><input type="radio" name="nhlType" value="skater" checked onclick="toggleNHLFields('skater')"> Skater FS</label>
        <label><input type="radio" name="nhlType" value="goalie" onclick="toggleNHLFields('goalie')"> Goalie FS</label>
        <label><input type="radio" name="nhlType" value="toi" onclick="toggleNHLFields('toi')"> TOI Converter</label>
      </div>
      <div id="nhl-toi-fields" class="hidden">
        <div class="group-title" style="border-top: 1px solid #444; padding-top: 10px;">TIME ON ICE (MM:SS)</div>
        <div class="stat-row"><div class="stat-label">Regulation</div><input type="text" class="stat-input nhl-period" id="nhl-reg" placeholder="00:00" /></div>
        <div class="stat-row"><div class="stat-label">Overtime (OT)</div><input type="text" class="stat-input nhl-period" id="nhl-ot" placeholder="00:00" /></div>
      </div>
      <div id="nhl-skater-fields"></div>
      <div id="nhl-goalie-fields" class="hidden"></div>
    `;
    container.appendChild(nhlDiv);

    const skaterFields = document.getElementById("nhl-skater-fields");
    Object.entries(league.skater_stats || {}).forEach(([label, pts]) => {
      skaterFields.innerHTML += `<div class="stat-row"><div class="stat-label">${label} — ${pts} pts</div><input type="text" class="stat-input" id="stat-${label}" /></div>`;
    });

    const goalieFields = document.getElementById("nhl-goalie-fields");
    Object.entries(league.goalie_stats || {}).forEach(([label, pts]) => {
      const row = document.createElement("div");
      row.className = "stat-row";
      if (label === "Win") {
        row.innerHTML = `<div class="stat-label">${label} — ${pts} pts</div><input type="checkbox" class="stat-input" id="stat-${label}" style="width:auto;" />`;
      } else {
        row.innerHTML = `<div class="stat-label">${label} — ${pts} pts</div><input type="text" class="stat-input" id="stat-${label}" />`;
      }
      goalieFields.appendChild(row);
    });
    return;
  }

  // --- 2b. SOCCER 2-WAY TOGGLE UI WITH SEGREGATED OUTFIELD ---
  if (league.isSplitSoccer) {
    const soccerDiv = document.createElement("div");
    soccerDiv.className = "stat-group";
    soccerDiv.innerHTML = `
      <div class="group-title">Select Soccer Mode</div>
      <div class="stat-row" style="justify-content: center; gap: 15px; margin-bottom: 15px;">
        <label><input type="radio" name="soccerType" value="outfield" checked onclick="toggleSoccerFields('outfield')"> Outfield FS</label>
        <label><input type="radio" name="soccerType" value="goalie" onclick="toggleSoccerFields('goalie')"> Goalie FS</label>
      </div>
      <div id="soccer-outfield-fields"></div>
      <div id="soccer-goalie-fields" class="hidden"></div>
    `;
    container.appendChild(soccerDiv);

    const outfieldFields = document.getElementById("soccer-outfield-fields");
    const soccerGroups = {
      "Scoring": ["Goal Scored", "Assist", "Shots Assisted"],
      "Shooting": ["Shot", "Shot on Target"],
      "Passing": ["Passes Attempted", "Crosses"],
      "Defending / Discipline": ["Clearances", "Tackles Attempted", "Attempted Dribbles", "Yellow Cards", "Red Cards", "Fouls"]
    };

    for (const [groupName, labels] of Object.entries(soccerGroups)) {
      const groupDiv = document.createElement("div");
      groupDiv.className = "stat-group";
      groupDiv.innerHTML = `<div class="group-title">${groupName}</div>`;
      labels.forEach(label => {
        const points = league.outfield_stats[label];
        if (points === undefined) return;
        groupDiv.innerHTML += `<div class="stat-row"><div class="stat-label">${label} — ${points} pts</div><input type="text" class="stat-input" id="stat-${label}" /></div>`;
      });
      outfieldFields.appendChild(groupDiv);
    }

    const goalieFields = document.getElementById("soccer-goalie-fields");
    Object.entries(league.goalie_stats || {}).forEach(([label, pts]) => {
      const row = document.createElement("div");
      row.className = "stat-row";
      if (label === "Clean Sheet" || label === "Starting Score") {
        row.innerHTML = `<div class="stat-label">${label} — ${pts} pts</div><input type="checkbox" class="stat-input" id="stat-${label}" style="width:auto;" />`;
      } else {
        row.innerHTML = `<div class="stat-label">${label} — ${pts} pts</div><input type="text" class="stat-input" id="stat-${label}" />`;
      }
      goalieFields.appendChild(row);
    });
    return;
  }

  // --- 3. FIGHT TIME / MMA ---
  if (league.hasFightTime) {
    const rounds = (leagueKey === "mma") ? 5 : 12;
    const fightRoundDiv = document.getElementById("fight-rounds");
    fightRoundDiv.innerHTML = "<label>Fight ended in:</label><br>";
    for (let i = 1; i <= rounds; i++) {
      fightRoundDiv.innerHTML += `<label><input type="radio" name="fightRound" value="${i}"> Round ${i}</label><br>`;
    }
    fightTimeContainer.classList.remove("hidden");
  }

  // --- 4. GROUPED LEAGUES ---
  const groups = {
    nfl_cfb: { "Passing": ["Passing Yards", "Passing TDs", "Interceptions"], "Rushing": ["Rushing Yards", "Rushing TDs"], "Receiving": ["Receiving Yards", "Receiving TDs", "Receptions"], "Turnovers": ["Fumbles Lost"], "Misc": ["2 Point Conversions", "Offensive Fumble Recovery TD", "Kick/Punt/Field Goal Return TD"] },
    dst: { "Standard Defensive Stats": ["Sack", "Interception", "Fumble Recovery"], "Return TDs": ["Punt/Kickoff/FG Return for TD", "Interception Return TD", "Fumble Recovery TD", "Blocked Punt or FG Return TD"], "Special Teams / Misc": ["Safety", "Blocked Kick", "2pt/XP Return"] },
    mlb_hitter: { "Hitting Stats": ["Single", "Double", "Triple", "Home Run"], "Run/RBI Stats": ["Run", "RBI"], "Other Stats": ["BB", "HBP", "SB"] },
    kickers: { "Field Goals": ["FG 0-39 yards", "FG 40-49 yards", "FG 50+ yards"], "Extra Points": ["XP conversions"], "Missed Kicks": ["FG Missed", "XP Missed"] }
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

  // --- 5. NASCAR / INDY (ALIGNED) ---
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

  // Default Stats Render
  const stats = Array.isArray(league.stats) ? league.stats.map(s => [s.label, s.points]) : Object.entries(league.stats || {});
  stats.forEach(([label, points]) => {
    const row = document.createElement("div");
    row.className = "stat-row";
    let html = "";
    if (leagueKey === "mlb_pitcher" && label === "Innings Pitched") {
      html = `<div class="stat-label">${label}<span class="tooltip">ℹ️<span class="tooltiptext">1 IP = 3 outs; 0.1 IP = 1 out</span></span></div><input type="text" class="stat-input" id="stat-${label}" />`;
    } else if (leagueKey === "mlb_pitcher" && label === "Quality Start") {
      html = `<div class="stat-label">${label}<span class="tooltip">ℹ️<span class="tooltiptext">Auto: 6+ IP & ≤3 ER</span></span></div>`;
    } else if (label === "Win" || label === "Match Played") {
      html = `<div class="stat-label">${label} — ${points} pts</div><input type="checkbox" class="stat-input" id="stat-${label}" style="width:auto;" />`;
    } else {
      html = `<div class="stat-label">${label} — ${points} pts</div><input type="text" class="stat-input" id="stat-${label}" />`;
    }
    row.innerHTML = html;
    container.appendChild(row);
  });

  if (league.bonuses?.length) {
    const title = document.createElement("h3"); title.textContent = "Bonus:";
    bonusContainer.appendChild(title);
    league.bonuses.forEach(bonus => {
      bonusContainer.innerHTML += `<div class="bonus-option"><label><input type="radio" name="bonus" value="${bonus.points}" />${bonus.label} — ${bonus.points} pts</label></div>`;
    });
  }
}

function toggleNHLFields(type) {
  const scoreHeader = document.getElementById("score-header");
  document.getElementById("nhl-skater-fields").classList.toggle("hidden", type !== "skater");
  document.getElementById("nhl-goalie-fields").classList.toggle("hidden", type !== "goalie");
  document.getElementById("nhl-toi-fields").classList.toggle("hidden", type !== "toi");
  if (scoreHeader) scoreHeader.style.display = (type === "toi") ? "none" : "block";
}

function toggleSoccerFields(type) {
  document.getElementById("soccer-outfield-fields").classList.toggle("hidden", type !== "outfield");
  document.getElementById("soccer-goalie-fields").classList.toggle("hidden", type !== "goalie");
}

function renderGroupedStats(container, stats, groupMap) {
  for (const [groupName, labels] of Object.entries(groupMap)) {
    const groupDiv = document.createElement("div");
    groupDiv.className = "stat-group";
    groupDiv.innerHTML = `<div class="group-title">${groupName}</div>`;
    labels.forEach(label => {
      const points = Array.isArray(stats) ? stats.find(s => s.label === label)?.points : stats[label];
      if (points === undefined) return;
      groupDiv.innerHTML += `<div class="stat-row"><div class="stat-label">${label} — ${points} pts</div><input type="text" class="stat-input" id="stat-${label}" /></div>`;
    });
    container.appendChild(groupDiv);
  }
}

function calculateScore() {
  const leagueKey = document.getElementById("league").value;
  const league = leagues[leagueKey];
  const breakdownBox = document.getElementById("breakdown");

  // --- ESPORTS ---
  if (league.isEsports) {
    const ign = document.getElementById("esp-player").value || "N/A";
    const team = document.getElementById("esp-team").value || "N/A";
    const opp = document.getElementById("esp-opp").value || "N/A";
    let total = 0; let text = `IGN: ${ign}\nMatch: ${team} vs ${opp}\n--------------------------\n`;
    for (let i = 1; i <= 7; i++) {
      const val = parseFloat(document.getElementById(`esp-m${i}`).value) || 0;
      if (val > 0) { text += `Map ${i}: ${val}\n`; total += val; }
    }
    breakdownBox.value = text + `--------------------------\nTotal Kills/Headshots: ${total}`;
    return;
  }

  // --- NHL ---
  if (leagueKey === "nhl") {
    const nhlType = document.querySelector('input[name="nhlType"]:checked').value;
    if (nhlType === "toi") {
      let totalSec = 0; let text = "Time On Ice Breakdown:\n";
      const reg = document.getElementById("nhl-reg")?.value.trim();
      const ot = document.getElementById("nhl-ot")?.value.trim();
      if (reg && reg.includes(":")) {
        const [m, s] = reg.split(":").map(Number); totalSec += (m * 60) + s;
        text += `Regulation: ${reg} (${(m + s/60).toFixed(2)})\n`;
      }
      if (ot && ot.includes(":")) {
        const [m, s] = ot.split(":").map(Number); totalSec += (m * 60) + s;
        text += `Overtime: ${ot} (${(m + s/60).toFixed(2)})\n`;
      }
      const mins = Math.floor(totalSec / 60); const secs = Math.round(totalSec % 60);
      breakdownBox.value = text + `------------------------------------\nTotal TOI: ${mins}:${secs.toString().padStart(2, '0')}\nDecimal Total: ${(totalSec / 60).toFixed(2)}`;
      return;
    }
    const statsToUse = (nhlType === "skater") ? league.skater_stats : league.goalie_stats;
    let fsTotal = 0; let text = `${nhlType.toUpperCase()} FS Breakdown:\n`;
    Object.entries(statsToUse).forEach(([label, points]) => {
      const input = document.getElementById(`stat-${label}`);
      if (!input) return;
      const val = input.type === "checkbox" ? (input.checked ? 1 : 0) : parseFloat(input.value) || 0;
      if (val !== 0) {
        text += `${label}: ${points} pt${points === 1 ? '' : 's'} (${val}) = ${format(val * points)}\n`;
        fsTotal += val * points;
      }
    });
    breakdownBox.value = text + `\nTOTAL FS = ${format(fsTotal)}`;
    return;
  }

  // --- SOCCER SPLIT ---
  if (league.isSplitSoccer) {
    const soccerType = document.querySelector('input[name="soccerType"]:checked').value;
    const statsToUse = (soccerType === "outfield") ? league.outfield_stats : league.goalie_stats;
    let fsTotal = 0; let text = `SOCCER ${soccerType.toUpperCase()} FS Breakdown:\n`;
    
    Object.entries(statsToUse).forEach(([label, points]) => {
      const input = document.getElementById(`stat-${label}`);
      if (!input) return;
      const val = input.type === "checkbox" ? (input.checked ? 1 : 0) : parseFloat(input.value) || 0;
      if (val !== 0) {
        text += `${label}: ${points} pt${points === 1 ? '' : 's'} (${val}) = ${format(val * points)}\n`;
        fsTotal += val * points;
      }
    });
    breakdownBox.value = text + `\nTOTAL FS = ${format(fsTotal)}`;
    return;
  }

  // --- MOTORSPORTS ---
  if (leagueKey === "nascar" || leagueKey === "indycar") {
    const start = parseInt(document.getElementById("stat-Starting Position")?.value) || 0;
    const finish = parseInt(document.getElementById("stat-Finishing Position")?.value) || 0;
    const led = parseFloat(document.getElementById("stat-Laps Led")?.value) || 0;
    
    let totalM = 0; let bM = "";
    
    if (start && finish) { 
        totalM += (start - finish); 
        bM += `Place Differential: ${start - finish} pts\n`; 
    }

    // Points Array from 1st to 40th
    const pArr = [45,42,41,40,39,38,37,36,35,34,32,31,30,29,28,27,26,25,24,23,21,20,19,18,17,16,15,14,13,12,10,9,8,7,6,5,4,3,2,1];
    
    if (finish >= 1 && finish <= 40) { 
        totalM += pArr[finish-1]; 
        bM += `Finishing Position (${finish}): ${pArr[finish-1]} pts\n`; 
    } else if (finish > 40) {
        bM += `Finishing Position (${finish}): 0 pts\n`;
    }

    if (leagueKey === "nascar") {
      const fast = parseFloat(document.getElementById("stat-Fastest Laps")?.value) || 0;
      totalM += fast * 0.45; 
      bM += `Fastest Laps: ${fast} × 0.45 = ${format(fast * 0.45)}\n`;
    }

    totalM += led * 0.25; 
    bM += `Laps Led: ${led} × 0.25 = ${format(led * 0.25)}\n`;

    breakdownBox.value = bM + `\nTOTAL FS: ${format(totalM)}`;
    return;
  }

  // --- UNIVERSAL STANDARD ---
  const stats = Array.isArray(league.stats) ? league.stats.map(s => [s.label, s.points]) : Object.entries(league.stats || {});
  let total = 0; let breakdown = ""; let innings = 0, earnedRuns = 0;
  stats.forEach(([label, points]) => {
    const input = document.getElementById(`stat-${label}`);
    if (!input) return;
    const val = (input.type === "checkbox") ? (input.checked ? 1 : 0) : parseFloat(input.value) || 0;
    if (val !== 0) {
      if (leagueKey === "mlb_pitcher" && label === "Innings Pitched") {
        innings = val; const full = Math.floor(val); const outs = full * 3 + Math.round((val - full) * 10);
        breakdown += `${label}: ${val} IP (${outs} outs) = ${format(outs)}\n`; total += outs; return;
      }
      if (leagueKey === "mlb_pitcher" && label === "Earned Run") earnedRuns = val;
      breakdown += `${label}: ${points} pt${points === 1 ? '' : 's'} (${val}) = ${format(val * points)}\n`; total += val * points;
    }
  });

  if (leagueKey === "mlb_pitcher" && innings >= 6 && earnedRuns <= 3) {
    const qsPoints = Array.isArray(league.stats) ? league.stats.find(s => s.label === "Quality Start")?.points || 0 : league.stats["Quality Start"] || 0;
    breakdown += `Quality Start: ${qsPoints} pts (1) = ${qsPoints}\n`; total += qsPoints;
  }

  const bonusRadio = document.querySelector('input[name="bonus"]:checked');
  if (bonusRadio) {
    const bPts = parseFloat(bonusRadio.value);
    const bL = bonusRadio.closest('label').innerText.split(" — ")[0].trim(); 
    breakdown += `${bL}: ${bPts} pts (1) = ${bPts}\n`; total += bPts;
  }

  if (leagueKey === "dst") {
    const pa = parseFloat(document.getElementById("stat-Points Allowed")?.value);
    if (!isNaN(pa)) {
      const tier = league.pointsAllowedTiers.find(t => pa <= t.max);
      if (tier) { breakdown += `Points Allowed: ${tier.points} pts (1) = ${tier.points}\n`; total += tier.points; }
    }
  }

  breakdownBox.value = breakdown + `\nTOTAL FS = ${format(total)}`;
  showExtraBreakdown(leagueKey);
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
    extraBox.innerHTML = `<h3>Single Stats Hitter</h3>Hits: ${hits}, Runs: ${r}, RBI: ${rbi}<br>Hits+Runs+RBI = ${hits + r + rbi}`;
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

function clearInputs() {
  document.querySelectorAll(".stat-input, .nhl-period, .esp-info, .esp-map, #fight-minutes, #fight-seconds").forEach(i => { i.value = ""; if(i.type === "checkbox") i.checked = false; });
  document.getElementById("breakdown").value = "";
  document.querySelectorAll('input[type="radio"]').forEach(r => { if(r.name === "bonus" || r.name === "soccerType" || r.name === "nhlType") return; r.checked = false; });
}

function copyBreakdown() { const box = document.getElementById("breakdown"); box.select(); document.execCommand("copy"); }

document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    calculateScore();
  }
});

window.onload = loadLeagues;
