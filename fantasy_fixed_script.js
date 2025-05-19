
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
  const extraContainer = document.getElementById("extra-breakdowns");
  container.innerHTML = "";
  bonusContainer.innerHTML = "";
  extraContainer.innerHTML = "";

  const stats = Array.isArray(league.stats)
    ? league.stats.map(s => [s.label, s.points])
    : Object.entries(league.stats);

  const addExtraBox = (id, label) => {
    const box = document.createElement("div");
    box.innerHTML = `<label>${label}:</label><textarea id="${id}" readonly class="extra-box"></textarea><button class="copy" onclick="copyBox('${id}')">Copy</button>`;
    extraContainer.appendChild(box);
  };

  if (leagueKey === "NBA") {
    addExtraBox("nba-breakdown", "NBA Breakdown (PRA, PA, PR, RA, Blk+Stl)");
  } else if (leagueKey === "mlb_hitter") {
    addExtraBox("mlb-breakdown", "MLB Hitter Breakdown");
  } else if (leagueKey === "nfl_cfb") {
    addExtraBox("nfl-breakdown", "NFL Offensive Breakdown");
  }

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
  const stats = Array.isArray(league.stats)
    ? league.stats.map(s => [s.label, s.points])
    : Object.entries(league.stats);

  let total = 0;
  let breakdown = "";
  let innings = 0, earnedRuns = 0;
  const hideZero = document.getElementById("hideZero")?.checked;

  const getVal = id => {
    const input = document.getElementById(`stat-${id}`);
    return input ? (input.type === "checkbox" ? (input.checked ? 1 : 0) : parseFloat(input.value) || 0) : 0;
  };

  stats.forEach(([label, points]) => {
    const val = getVal(label);
    if (isNaN(val)) return;

    if (leagueKey === "mlb_pitcher" && label === "Innings Pitched") {
      innings = val;
      const full = Math.floor(val);
      const decimal = Math.round((val - full) * 10);
      if (![0, 1, 2].includes(decimal)) {
        breakdown += `⚠️ Invalid IP decimal (use .0, .1, or .2)
`;
        return;
      }
      const outs = full * 3 + decimal;
      breakdown += `${label}: ${val} IP = ${outs} outs × ${points} = ${(outs * points).toFixed(2)}
`;
      total += outs * points;
      return;
    }

    if (label === "Earned Run") earnedRuns = val;
    if (label === "Quality Start") return;

    if (!hideZero || val !== 0) {
      breakdown += `${label}: ${val} × ${points} = ${(val * points).toFixed(2)}
`;
    }
    total += val * points;
  });

  if (leagueKey === "mlb_pitcher" && innings >= 6 && earnedRuns <= 3) {
    const pts = league.stats["Quality Start"];
    breakdown += `Quality Start: 1 × ${pts} = ${pts.toFixed(2)}
`;
    total += pts;
  }

  breakdown += `
Total FS: ${total.toFixed(2)}`;
  document.getElementById("breakdown").value = breakdown;
}

function copyBox(id) {
  const box = document.getElementById(id);
  box.select();
  document.execCommand("copy");
}

window.onload = loadLeagues;
