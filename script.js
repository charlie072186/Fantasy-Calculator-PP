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

  stats.forEach(([label, points]) => {
    const row = document.createElement("div");
    row.className = "stat-row";
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

    league.bonuses.forEach((bonus, index) => {
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

  stats.forEach(([label, points]) => {
    const val = parseFloat(document.getElementById(`stat-${label}`)?.value) || 0;
    if (val !== 0 || !document.getElementById("hideZero").checked) {
      breakdown += `${label}: ${val} × ${points} = ${(val * points).toFixed(2)}\n`;
    }
    total += val * points;
  });

  const bonus = document.querySelector('input[name="bonus"]:checked');
  if (bonus) {
    const bonusVal = parseFloat(bonus.value);
    total += bonusVal;
    breakdown += `Bonus: +${bonusVal}\n`;
  }

  document.getElementById("breakdown").value = breakdown + `\nTotal: ${total.toFixed(2)}`;
}

function clearInputs() {
  document.querySelectorAll(".stat-input").forEach(input => input.value = "");
  document.getElementById("breakdown").value = "";
  const selectedBonus = document.querySelector('input[name="bonus"]:checked');
  if (selectedBonus) selectedBonus.checked = false;
}

function copyBreakdown() {
  const breakdown = document.getElementById("breakdown");
  breakdown.select();
  document.execCommand("copy");
}

if (leagueKey === "tennis") {
  const ace = parseFloat(document.getElementById("tennis-ace").value) || 0;
  const doubleFault = parseFloat(document.getElementById("tennis-double-fault").value) || 0;

  let setsWon = 0;
  for (let i = 1; i <= 3; i++) {
    setsWon += parseInt(document.getElementById(`set1P${i}`).value) || 0;
  }

  const matchPlayed = 10;
  const setWon = setsWon * 3;
  const setLoss = (3 - setsWon) * -3;
  const aceScore = ace * 0.5;
  const dfScore = doubleFault * -0.5;

  const total = matchPlayed + setWon + setLoss + aceScore + dfScore;

  document.getElementById("breakdown").value =
    `Match Played: 1 × 10 = 10.00\nSet Won: ${setsWon} × 3 = ${setWon.toFixed(2)}\nSet Loss: ${(3 - setsWon)} × -3 = ${setLoss.toFixed(2)}\nAces: ${ace} × 0.5 = ${aceScore.toFixed(2)}\nDouble Faults: ${doubleFault} × -0.5 = ${dfScore.toFixed(2)}\n\nTotal: ${total.toFixed(2)}`;
  return;
}


window.onload = loadLeagues;
