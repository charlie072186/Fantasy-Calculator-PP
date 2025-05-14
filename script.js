let leagues = {};

async function loadLeagues() {
  const res = await fetch("leagues.json");
  leagues = await res.json();
  const select = document.getElementById("league");
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
  container.innerHTML = "";
  const stats = league.stats || [];
  const bonus = league.bonus || [];

  stats.forEach(({ label, points }) => {
    const row = document.createElement("div");
    row.className = "stat-row";
    row.innerHTML = `
      <div class="stat-label">${label} — ${points} pts</div>
      <input type="text" class="stat-input" id="stat-${label}" />
    `;
    container.appendChild(row);
  });

  if (bonus.length > 0) {
    const bonusGroup = document.createElement("div");
    bonusGroup.className = "checkbox-group";
    bonusGroup.innerHTML = `<strong>Bonus:</strong><br/>`;
    bonus.forEach(({ label, points }, index) => {
      bonusGroup.innerHTML += `
        <label><input type="radio" name="bonus" value="${points}" data-label="${label}" /> ${label} — ${points} pts</label>
      `;
    });
    container.appendChild(bonusGroup);
  }
}

function calculateScore() {
  const leagueKey = document.getElementById("league").value;
  const league = leagues[leagueKey];
  const stats = league.stats || [];
  let total = 0;
  let breakdown = "";

  stats.forEach(({ label, points }) => {
    const val = parseFloat(document.getElementById(`stat-${label}`)?.value) || 0;
    if (val !== 0 || !document.getElementById("hideZero").checked) {
      breakdown += `${label}: ${val} × ${points} = ${(val * points).toFixed(2)}\n`;
    }
    total += val * points;
  });

  const bonusInput = document.querySelector('input[name="bonus"]:checked');
  if (bonusInput) {
    const bonusPoints = parseFloat(bonusInput.value);
    const bonusLabel = bonusInput.dataset.label;
    breakdown += `${bonusLabel}: ${bonusPoints} pts\n`;
    total += bonusPoints;
  }

  document.getElementById("breakdown").value = breakdown + `\nTotal: ${total.toFixed(2)}`;
}

function clearInputs() {
  document.querySelectorAll(".stat-input").forEach(input => input.value = "");
  document.querySelectorAll('input[name="bonus"]').forEach(input => input.checked = false);
  document.getElementById("breakdown").value = "";
}

function copyBreakdown() {
  const breakdown = document.getElementById("breakdown");
  breakdown.select();
  document.execCommand("copy");
}

window.onload = loadLeagues;