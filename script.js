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
  container.innerHTML = "";
  bonusContainer.innerHTML = "";

  const stats = Array.isArray(league.stats)
    ? league.stats.map(s => [s.label, s.points])
    : Object.entries(league.stats);

  if (leagueKey === "nascar") {
    container.innerHTML = `
      <div class="stat-row nascar-row">
        <label>Starting Position</label>
        <input type="text" id="stat-Starting Position" />
      </div>
      <div class="stat-row nascar-row">
        <label>Finishing Position</label>
        <input type="text" id="stat-Finishing Position" />
      </div>
      <div class="stat-row nascar-row">
        <label>Fastest Laps × 0.45</label>
        <input type="text" id="stat-Fastest Laps" />
      </div>
      <div class="stat-row nascar-row">
        <label>Laps Led × 0.25</label>
        <input type="text" id="stat-Laps Led" />
      </div>
    `;
    return;
  }

  stats.forEach(([label, points]) => {
    const row = document.createElement("div");
    row.className = "stat-row";

    if (leagueKey === "mlb_pitcher") {
      if (label === "Innings Pitched") {
        row.innerHTML = `
          <div class="stat-label">${label}
            <span class="tooltip">ℹ️
              <span class="tooltiptext">1 IP = 3 outs; 0.1 IP = 1 out</span>
            </span>
          </div>
          <input type="text" class="stat-input" id="stat-${label}" />
        `;
        container.appendChild(row);
        return;
      }
      if (label === "Quality Start") {
        row.innerHTML = `
          <div class="stat-label">${label}
            <span class="tooltip">ℹ️
              <span class="tooltiptext">Pitch 6+ innings and allow ≤ 3 earned runs</span>
            </span>
          </div>
        `;
        container.appendChild(row);
        return;
      }
      if (label === "Win") {
        row.innerHTML = `
          <div class="stat-label">${label} — ${points} pts</div>
          <input type="checkbox" class="stat-input" id="stat-${label}" />
        `;
        container.appendChild(row);
        return;
      }
    }

    row.innerHTML = `
      <div class="stat-label">${label} — ${points} pts</div>
      <input type="text" class="stat-input" id="stat-${label}" />
    `;
    container.appendChild(row);
  });

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

function calculateScore() {
  const leagueKey = document.getElementById("league").value;
  const league = leagues[leagueKey];
  const stats = Array.isArray(league.stats)
    ? league.stats.map(s => [s.label, s.points])
    : Object.entries(league.stats);

  let total = 0;
  let breakdown = "";
  let innings = 0;
  let earnedRuns = 0;

  if (leagueKey === "nascar") {
    const start = parseInt(document.getElementById("stat-Starting Position").value);
    const finish = parseInt(document.getElementById("stat-Finishing Position").value);
    const fastest = parseFloat(document.getElementById("stat-Fastest Laps").value) || 0;
    const led = parseFloat(document.getElementById("stat-Laps Led").value) || 0;

    if (!isNaN(start) && !isNaN(finish)) {
      const diff = start - finish;
      breakdown += `Place Differential: ${diff} pts\n`;
      total += diff;
    }

    if (fastest) {
      const pts = fastest * 0.45;
      breakdown += `Fastest Laps: ${fastest} × 0.45 = ${pts.toFixed(2)}\n`;
      total += pts;
    }

    if (led) {
      const pts = led * 0.25;
      breakdown += `Laps Led: ${led} × 0.25 = ${pts.toFixed(2)}\n`;
      total += pts;
    }

    if (!isNaN(finish)) {
      const placePoints = [
        45, 42, 41, 40, 39, 38, 37, 36, 35, 34, 32, 31, 30, 29, 28,
        27, 26, 25, 24, 23, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12,
        10, 9, 8, 7, 6, 5, 4, 3, 2, 1
      ];
      const placeIndex = Math.max(0, Math.min(39, finish - 1));
      const points = placePoints[placeIndex] ?? 0;
      breakdown += `Finishing Place Points: ${points} pts\n`;
      total += points;
    }

    document.getElementById("breakdown").value = breakdown + `\nTotal: ${total.toFixed(2)}`;
    return;
  }

  stats.forEach(([label, points]) => {
    const input = document.getElementById(`stat-${label}`);
    if (!input) return;

    let val;
    if (input.type === "checkbox") {
      val = input.checked ? 1 : 0;
    } else {
      val = parseFloat(input.value);
    }
    if (isNaN(val)) return;

    if (leagueKey === "mlb_pitcher") {
      if (label === "Innings Pitched") {
        innings = val;
        const full = Math.floor(val);
        const decimal = val - full;
        const outs = full * 3 + Math.round(decimal * 10);
        breakdown += `${label}: ${val} IP (${outs} outs) = ${outs.toFixed(2)}\n`;
        total += outs;
        return;
      }
      if (label === "Earned Run") {
        earnedRuns = val;
      }
      if (label === "Quality Start") {
        return;
      }
    }

    if (val !== 0 || !document.getElementById("hideZero").checked) {
      breakdown += `${label}: ${val} × ${points} = ${(val * points).toFixed(2)}\n`;
    }
    total += val * points;
  });

  // MLB Pitcher: auto quality start
  if (leagueKey === "mlb_pitcher" && innings >= 6 && earnedRuns <= 3) {
    let qsPoints = 0;
    if (Array.isArray(league.stats)) {
      const qsStat = league.stats.find(s => s.label === "Quality Start");
      qsPoints = qsStat?.points || 0;
    } else {
      qsPoints = league.stats["Quality Start"] || 0;
    }
    breakdown += `Quality Start: 1 × ${qsPoints} = ${qsPoints.toFixed(2)}\n`;
    total += qsPoints;
  }

  const bonus = document.querySelector('input[name="bonus"]:checked');
  if (bonus) {
    const bonusVal = parseFloat(bonus.value);
    breakdown += `Bonus: +${bonusVal}\n`;
    total += bonusVal;
  }

  document.getElementById("breakdown").value = breakdown + `\nTotal: ${total.toFixed(2)}`;
}

function clearInputs() {
  document.querySelectorAll(".stat-input").forEach(input => {
    if (input.type === "checkbox") input.checked = false;
    else input.value = "";
  });
  document.getElementById("breakdown").value = "";
  const selectedBonus = document.querySelector('input[name="bonus"]:checked');
  if (selectedBonus) selectedBonus.checked = false;
}

function copyBreakdown() {
  const breakdown = document.getElementById("breakdown");
  breakdown.select();
  document.execCommand("copy");
}

window.onload = loadLeagues;
