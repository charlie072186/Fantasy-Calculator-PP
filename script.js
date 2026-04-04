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
      "nba": { "name": "NBA FS", "category": "tsports", "stats": { "Points": 1 } },
      "nhl": { "name": "NHL Time On Ice", "category": "tsports", "hasTOI": true }
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

  container.innerHTML = "";
  if (bonusContainer) bonusContainer.innerHTML = "";
  if (extraBox) { extraBox.innerHTML = ""; extraBox.classList.add("hidden"); }
  if (fightTimeContainer) fightTimeContainer.classList.add("hidden");

  // --- NEW: ESPORTS SPECIAL UI ---
  if (league.isEsports) {
    const esportsDiv = document.createElement("div");
    esportsDiv.className = "stat-group";
    esportsDiv.innerHTML = `
      <div class="group-title">Match Details</div>
      <div class="stat-row">Player: <input type="text" class="stat-input esp-info" id="esp-player" placeholder="Player Name" /></div>
      <div class="stat-row">Team: <input type="text" class="stat-input esp-info" id="esp-team" placeholder="Player Team" /></div>
      <div class="stat-row">Opponent: <input type="text" class="stat-input esp-info" id="esp-opp" placeholder="Opponent Team" /></div>
      <div class="group-title" style="margin-top:15px">Map Stats</div>
    `;
    for (let i = 1; i <= 5; i++) {
      esportsDiv.innerHTML += `
        <div class="stat-row">
          <div class="stat-label">Map ${i} Stat</div>
          <input type="number" class="stat-input esp-map" id="esp-m${i}" placeholder="0" />
        </div>`;
    }
    container.appendChild(esportsDiv);
    return;
  }

  // --- NHL TOI LOGIC ---
  if (leagueKey === "nhl") {
    const periodDiv = document.createElement("div");
    periodDiv.className = "stat-group";
    periodDiv.innerHTML = `<div class="group-title">TIME ON ICE (MM:SS)</div>`;
    for (let i = 1; i <= 3; i++) {
      periodDiv.innerHTML += `<div class="stat-row"><div class="stat-label">Period ${i}</div><input type="text" class="stat-input nhl-period" id="nhl-p${i}" placeholder="00:00" /></div>`;
    }
    periodDiv.innerHTML += `<div class="stat-row" style="margin-top: 10px; border-top: 1px solid #444; padding-top: 10px;"><div class="stat-label">Overtime (OT)</div><input type="text" class="stat-input nhl-period" id="nhl-ot" placeholder="00:00" /></div>`;
    container.appendChild(periodDiv);
    return; 
  }

  // --- STANDARD LOGIC (NFL, NBA, BOXING, etc.) ---
  const stats = Array.isArray(league.stats) ? league.stats.map(s => [s.label, s.points]) : Object.entries(league.stats || {});
  
  if (league.hasFightTime) {
    const rounds = leagueKey === "mma" ? 5 : 12;
    const fightRoundDiv = document.getElementById("fight-rounds");
    if (fightRoundDiv) {
      fightRoundDiv.innerHTML = "<label>Fight ended in:</label><br>";
      for (let i = 1; i <= rounds; i++) {
        fightRoundDiv.innerHTML += `<label><input type="radio" name="fightRound" value="${i}"> Round ${i}</label><br>`;
      }
    }
    if (fightTimeContainer) fightTimeContainer.classList.remove("hidden");
  }

  // Grouped logic restored
  const groups = {
    nfl_cfb: { "Passing": ["Passing Yards", "Passing TDs", "Interceptions"], "Rushing": ["Rushing Yards", "Rushing TDs"], "Receiving": ["Receiving Yards", "Receiving TDs", "Receptions"], "Turnovers": ["Fumbles Lost"], "Misc": ["2 Point Conversions", "Offensive Fumble Recovery TD", "Kick/Punt/Field Goal Return TD"] },
    dst: { "Standard Defensive Stats": ["Sack", "Interception", "Fumble Recovery"], "Return TDs": ["Punt/Kickoff/FG Return for TD", "Interception Return TD", "Fumble Recovery TD", "Blocked Punt or FG Return TD"], "Special Teams / Misc": ["Safety", "Blocked Kick", "2pt/XP Return"] },
    mlb_hitter: { "Hitting Stats": ["Single", "Double", "Triple", "Home Run"], "Run/RBI Stats": ["Run", "RBI"], "Other Stats": ["BB", "HBP", "SB"] },
    kickers: { "Field Goals": ["FG 0-39 yards", "FG 40-49 yards", "FG 50+ yards"], "Extra Points": ["XP conversions"], "Missed Kicks": ["FG Missed", "XP Missed"] },
    soccer: { "Scoring": ["Goal", "Assist", "Goal from PEN"], "Shooting": ["Shot on Target"], "Passing": ["Completed Pass", "Missed Pass"], "Discipline": ["Yellow Card", "Red Card"] }
  };

  if (groups[leagueKey]) {
    renderGroupedStats(container, league.stats, groups[leagueKey]);
    return;
  }

  stats.forEach(([label, points]) => {
    const row = document.createElement("div");
    row.className = "stat-row";
    row.innerHTML = `<div class="stat-label">${label} — ${points} pts</div><input type="text" class="stat-input" id="stat-${label}" />`;
    container.appendChild(row);
  });

  if (league.bonuses?.length && bonusContainer) {
    bonusContainer.innerHTML = "<h3>Bonus:</h3>";
    league.bonuses.forEach(bonus => {
      bonusContainer.innerHTML += `<div class="bonus-option"><label><input type="radio" name="bonus" value="${bonus.points}" />${bonus.label} — ${bonus.points} pts</label></div>`;
    });
  }
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

  // --- ESPORTS CALCULATION ---
  if (league.isEsports) {
    const player = document.getElementById("esp-player").value || "N/A";
    const team = document.getElementById("esp-team").value || "N/A";
    const opp = document.getElementById("esp-opp").value || "N/A";
    let total = 0;
    let text = `Player: ${player}\nTeam: ${team} vs ${opp}\n--------------------------\n`;
    
    for (let i = 1; i <= 5; i++) {
      const val = parseFloat(document.getElementById(`esp-m${i}`).value) || 0;
      if (val > 0) {
        text += `Map ${i}: ${val}\n`;
        total += val;
      }
    }
    breakdownBox.value = text + `--------------------------\nTotal Stat: ${total}`;
    return;
  }

  // --- NHL CALCULATION ---
  if (leagueKey === "nhl") {
    let totalSeconds = 0;
    let text = "Time On Ice Breakdown:\n";
    ["nhl-p1", "nhl-p2", "nhl-p3", "nhl-ot"].forEach((id, index) => {
      const val = document.getElementById(id)?.value.trim();
      if (val && val.includes(":")) {
        const [m, s] = val.split(":").map(Number);
        totalSeconds += (m * 60) + s;
        text += `${["P1", "P2", "P3", "OT"][index]}: ${val} (${(m + s/60).toFixed(2)})\n`;
      }
    });
    const finalMins = Math.floor(totalSeconds / 60);
    const finalSecs = Math.round(totalSeconds % 60);
    breakdownBox.value = text + `------------------------------------\nTotal TOI: ${finalMins}:${finalSecs.toString().padStart(2, '0')}\nDecimal Total: ${(totalSeconds / 60).toFixed(2)}`;
    return;
  }

  // --- STANDARD CALCULATION ---
  const stats = Array.isArray(league.stats) ? league.stats.map(s => [s.label, s.points]) : Object.entries(league.stats || {});
  let total = 0;
  let breakdown = "";

  stats.forEach(([label, points]) => {
    const input = document.getElementById(`stat-${label}`);
    if (!input) return;
    const val = input.type === "checkbox" ? (input.checked ? 1 : 0) : parseFloat(input.value) || 0;
    if (val !== 0) {
      breakdown += `${label}: ${val} × ${points} = ${format(val * points)}\n`;
      total += val * points;
    }
  });

  const bonusRadio = document.querySelector('input[name="bonus"]:checked');
  if (bonusRadio) {
    const bLabel = bonusRadio.closest('label').innerText.split(" — ")[0].trim(); 
    breakdown += `${bLabel}: +${bonusRadio.value}\n`;
    total += parseFloat(bonusRadio.value);
  }
 
  breakdownBox.value = breakdown + `\nTotal FS: ${format(total)}`;
}

function clearInputs() {
  document.querySelectorAll(".stat-input, .nhl-period, .esp-info, .esp-map").forEach(input => {
    if (input.type === "checkbox") input.checked = false;
    else input.value = "";
  });
  document.getElementById("breakdown").value = "";
}

function copyBreakdown() {
  const box = document.getElementById("breakdown");
  box.select();
  document.execCommand("copy");
}

window.onload = loadLeagues;
