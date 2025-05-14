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
  const bonusContainer = document.getElementById("bonus-container");
  container.innerHTML = "";
  bonusContainer.innerHTML = "";

  const stats = Array.isArray(league.stats)
    ? league.stats.map(s => [s.label, s.points])
    : Object.entries(league.stats);

  stats.forEach(([label, points]) => {
    const row = document.createElement("div");
    row.className = "stat-row";
    row.innerHTML = \`
      <div class="stat-label">\${label} — \${points} pts</div>
      <input type="text" class="stat-input" id="stat-\${label}" />
    \`;
    container.appendChild(row);
  });

  if (league.bonus && league.bonus.length) {
    const bonusHTML = league.bonus.map((b, i) => \`
      <label><input type="\${league.bonusExclusive ? 'radio' : 'checkbox'}" name="bonus" value="\${b.points}" /> \${b.label} — \${b.points} pts</label>
    \`).join("<br>");
    bonusContainer.innerHTML = "<strong>Bonus:</strong><br>" + bonusHTML;
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
    const val = parseFloat(document.getElementById(\`stat-\${label}\`)?.value) || 0;
    if (val !== 0 || !document.getElementById("hideZero").checked) {
      breakdown += \`\${label}: \${val} × \${points} = \${(val * points).toFixed(2)}\n\`;
    }
    total += val * points;
  });

  const bonuses = document.querySelectorAll("#bonus-container input:checked");
  bonuses.forEach(b => {
    const pts = parseFloat(b.value);
    breakdown += \`\${b.nextSibling.textContent.trim()} = \${pts.toFixed(2)}\n\`;
    total += pts;
  });

  document.getElementById("breakdown").value = breakdown + \`\nTotal: \${total.toFixed(2)}\`;
}

function clearInputs() {
  document.querySelectorAll(".stat-input").forEach(input => input.value = "");
  document.getElementById("breakdown").value = "";
}

function copyBreakdown() {
  const breakdown = document.getElementById("breakdown");
  breakdown.select();
  document.execCommand("copy");
}

window.onload = loadLeagues;