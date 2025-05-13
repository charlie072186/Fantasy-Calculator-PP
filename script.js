let leagues = {};
const leagueSelect = document.getElementById("league");
const statInputs = document.getElementById("statInputs");
const bonusSection = document.getElementById("bonusSection");
const bonusOptions = document.getElementById("bonusOptions");
const calculateBtn = document.getElementById("calculateBtn");
const clearBtn = document.getElementById("clearBtn");
const totalScore = document.getElementById("totalScore");
const breakdown = document.getElementById("breakdown");
const hideZeros = document.getElementById("hideZeros");
const copyBtn = document.getElementById("copyBtn");

fetch("leagues.json")
  .then(res => res.json())
  .then(data => {
    leagues = data;
    populateLeagues();
    renderInputs(leagueSelect.value);
  })
  .catch(err => {
    console.error("Error loading JSON:", err);
    statInputs.innerHTML = "<p style='color: red;'>Error loading league data.</p>";
  });

function populateLeagues() {
  leagueSelect.innerHTML = "";
  for (let league in leagues) {
    const option = document.createElement("option");
    option.value = league;
    option.textContent = leagues[league].name;
    leagueSelect.appendChild(option);
  }
}

function renderInputs(selectedLeague) {
  statInputs.innerHTML = "";
  bonusOptions.innerHTML = "";
  bonusSection.style.display = "none";

  const stats = leagues[selectedLeague].stats;
  const bonuses = leagues[selectedLeague].bonuses;

  for (let stat in stats) {
  const row = document.createElement("div");
  row.className = "stat-row";

  const label = document.createElement("label");
  label.setAttribute("for", stat);
  label.innerText = `${stat} (${stats[stat]} pts)`;

  const input = document.createElement("input");
  input.type = "number";
  input.id = stat;
  input.placeholder = " ";

  row.appendChild(label);
  row.appendChild(input);
  statInputs.appendChild(row);
}

  if (bonuses && Array.isArray(bonuses)) {
  bonusSection.style.display = "block";
  bonuses.forEach((bonus, i) => {
    const label = document.createElement("label");
    label.style.display = "block";
    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "bonus";
    radio.value = bonus.points;
    if (i === 0) radio.checked = true;
    label.appendChild(radio);
    label.append(` ${bonus.label} (+${bonus.points})`);
    bonusOptions.appendChild(label);
    });
  }
}

leagueSelect.addEventListener("change", () => {
  renderInputs(leagueSelect.value);
  totalScore.innerText = "0";
  breakdown.value = "";
});

calculateBtn.addEventListener("click", () => {
  const stats = leagues[leagueSelect.value].stats;
  let total = 0;
  let details = "";

  for (let stat in stats) {
    const val = parseFloat(document.getElementById(stat).value) || 0;
    const score = val * stats[stat];
    total += score;
    if (!hideZeros.checked || val !== 0) {
      details += `${stat}: ${stats[stat]} x ${val} = ${score.toFixed(2)}\n`;
    }
  }

  const selectedBonus = document.querySelector('input[name="bonus"]:checked');
  if (selectedBonus) {
    const bonusValue = parseFloat(selectedBonus.value);
    total += bonusValue;
    details += `Bonus: +${bonusValue}\n`;
  }

  totalScore.innerText = total.toFixed(2);
  breakdown.value = details + `\nTOTAL FS = ${total.toFixed(2)}`;
});

clearBtn.addEventListener("click", () => {
  const stats = leagues[leagueSelect.value].stats;
  for (let stat in stats) {
    document.getElementById(stat).value = "";
  }
  const selectedBonus = document.querySelector('input[name="bonus"]:checked');
  if (selectedBonus) selectedBonus.checked = false;
  totalScore.innerText = "0";
  breakdown.value = "";
});

copyBtn.addEventListener("click", () => {
  breakdown.select();
  document.execCommand("copy");
});

function renderStats(league) {
  const container = document.getElementById('statInputs');
  container.innerHTML = '';

  league.stats.forEach(stat => {
    const row = document.createElement('div');
    row.className = 'stat-row';

    const label = document.createElement('label');
    label.innerHTML = `${stat.label} <span class="points">(${stat.points} pts${stat.label.toLowerCase().includes("yards") ? "/yd" : ""})</span>`;

    const input = document.createElement('input');
    input.type = 'number';
    input.className = 'stat-input';
    input.setAttribute('data-label', stat.label);

    row.appendChild(label);
    row.appendChild(input);
    container.appendChild(row);
  });
}

