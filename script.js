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

    // CRITICAL: This line makes the UI change when you select MMA/Boxing
    select.onchange = loadStats;

    loadStats();
  } catch (err) {
    console.error("Critical Error: JSON syntax is broken. Check your commas!", err);
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

  // Reset UI
  container.innerHTML = "";
  bonusContainer.innerHTML = "";
  fightTimeContainer.classList.add("hidden");

  if (!league) return;

  // --- NHL TOI INPUTS ---
  if (leagueKey === "nhl") {
    const periodDiv = document.createElement("div");
    periodDiv.className = "stat-group";
    periodDiv.innerHTML = `<div class="group-title">Time Per Period (MM:SS)</div>`;
    for (let i = 1; i <= 3; i++) {
      periodDiv.innerHTML += `
        <div class="stat-row">
          <div class="stat-label">Period ${i}</div>
          <input type="text" class="stat-input" id="nhl-p${i}" placeholder="00:00" />
        </div>`;
    }
    container.appendChild(periodDiv);
    return;
  }

  // --- MMA/BOXING FIGHT TIME UI ---
  if (league.hasFightTime) {
    const rounds = leagueKey === "mma" ? 5 : 12;
    const fightRoundDiv = document.getElementById("fight-rounds");
    fightRoundDiv.innerHTML = "<strong>Fight ended in:</strong><br>";
    for (let i = 1; i <= rounds; i++) {
      fightRoundDiv.innerHTML += `<label><input type="radio" name="fightRound" value="${i}"> Round ${i}</label><br>`;
    }
    fightTimeContainer.classList.remove("hidden");
  }

  // --- RENDERING STANDARD STATS ---
  const stats = Array.isArray(league.stats)
    ? league.stats.map(s => [s.label, s.points])
    : Object.entries(league.stats || {});

  stats.forEach(([label, points]) => {
    const row = document.createElement("div");
    row.className = "stat-row";
    let html = (label === "Win" || label === "Match Played")
      ? `<label class="stat-label"><input type="checkbox" class="stat-input" id="stat-${label}" />${label} — ${points} pts</label>`
      : `<div class="stat-label">${label} — ${points} pts</div><input type="text" class="stat-input" id="stat-${label}" />`;
    row.innerHTML = html;
    container.appendChild(row);
  });

  // DST Points Allowed Special Input
  if (leagueKey === "dst" && league.pointsAllowedTiers) {
    const paDiv = document.createElement("div");
    paDiv.className = "stat-group";
    paDiv.innerHTML = `<div class="group-title">Points Allowed</div>
                       <div class="stat-row"><div class="stat-label">Points Allowed</div><input type="text" class="stat-input" id="stat-Points Allowed" /></div>`;
    container.appendChild(paDiv);
  }

  // Bonuses (MMA/Boxing/NFL)
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
  const breakdownBox = document.getElementById("breakdown");
  let total = 0;
  let breakdown = "";

  // --- NHL TOI CONVERTER ---
  if (leagueKey === "nhl") {
    let totalSecs = 0;
    let text = "NHL TOI Breakdown:\n";
    let hasVal = false;
    for (let i = 1; i <= 3; i++) {
      const val = document.getElementById(`nhl-p${i}`).value.trim();
      if (val.includes(":")) {
        hasVal = true;
        const [m, s] = val.split(":").map(Number);
        totalSecs += (m * 60) + s;
        text += `P${i}: ${val} (${format(m + s/60)})\n`;
      }
    }
    if (!hasVal) return (breakdownBox.value = "Enter MM:SS time.");
    const finalM = Math.floor(totalSecs / 60);
    const finalS = Math.round(totalSecs % 60);
    text += `------------------\nTotal Time: ${finalM}:${finalS.toString().padStart(2, '0')}\nDecimal Total: ${format(totalSecs / 60)}`;
    breakdownBox.value = text;
    return;
  }

  // --- FIGHT TIME CALCULATION (MMA/Boxing) ---
  if (league.hasFightTime) {
    const roundRadio = document.querySelector('input[name="fightRound"]:checked');
    const round = roundRadio ? parseInt(roundRadio.value) : null;
    const min = parseInt(document.getElementById("fight-minutes").value) || 0;
    const sec = parseInt(document.getElementById("fight-seconds").value) || 0;
    
    if (round) {
      const perRound = leagueKey === "mma" ? 5 : 3;
      const totalFightMin = (round - 1) * perRound + min + (sec / 60);
      breakdown += `Fight Duration: ${totalFightMin.toFixed(2)} min\n`;
      // total += totalFightMin; // Uncomment this if you want minutes to equal points
    }
  }

  // --- STANDARD STAT CALCULATION ---
  const stats = Array.isArray(league.stats) ? league.stats.map(s => [s.label, s.points]) : Object.entries(league.stats || {});
  stats.forEach(([label, points]) => {
    const input = document.getElementById(`stat-${label}`);
    if (!input) return;
    const val = input.type === "checkbox" ? (input.checked ? 1 : 0) : parseFloat(input.value) || 0;
    if (val !== 0) {
      breakdown += `${label}: ${val} x ${points} = ${format(val * points)}\n`;
      total += val * points;
    }
  });

  // DST Logic
  if (leagueKey === "dst") {
    const paInput = parseFloat(document.getElementById("stat-Points Allowed")?.value);
    if (!isNaN(paInput)) {
      const tier = league.pointsAllowedTiers.find(t => paInput <= t.max);
      if (tier) {
        breakdown += `Points Allowed: ${tier.points} pts\n`;
        total += tier.points;
      }
    }
  }

  // Bonus Logic
  const bonus = document.querySelector('input[name="bonus"]:checked');
  if (bonus) {
    const bPts = parseFloat(bonus.value);
    breakdown += `Bonus: ${bPts} pts\n`;
    total += bPts;
  }

  breakdown += `\nTotal FS: ${format(total)}`;
  breakdownBox.value = breakdown;
}

function clearInputs() {
  document.querySelectorAll(".stat-input").forEach(i => i.value = "");
  document.getElementById("breakdown").value = "";
  document.getElementById("fight-minutes").value = "";
  document.getElementById("fight-seconds").value = "";
  const checkedRound = document.querySelector('input[name="fightRound"]:checked');
  if (checkedRound) checkedRound.checked = false;
  const checkedBonus = document.querySelector('input[name="bonus"]:checked');
  if (checkedBonus) checkedBonus.checked = false;
}

function copyBreakdown() {
  const box = document.getElementById("breakdown");
  box.select();
  document.execCommand("copy");
}

// Added back Enter key support
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    calculateScore();
  }
});

window.onload = loadLeagues;
