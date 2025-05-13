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
    const firstKey = Object.keys(leagues)[0];
    leagueSelect.value = leagues[firstKey].name;
    renderInputs(leagues[firstKey].name);
  })
  .catch(err => {
    console.error("Error loading JSON:", err);
    statInputs.innerHTML = "<p style='color: red;'>Error loading league data.</p>";
  });

function getLeagueByName(name) {
  return Object.values(leagues).find(l => l.name === name);
}

function populateLeagues() {
  leagueSelect.innerHTML = "";
  Object.values(leagues)
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach(league => {
      const option = document.createElement("option");
      option.value = league.name;
      option.textContent = league.name;
      leagueSelect.appendChild(option);
    });
}

function renderInputs(leagueName) {
  const league = getLeagueByName(leagueName);
  if (!league) return;

  statInputs.innerHTML = "";
  bonusOptions.innerHTML = "";
  bonusSection.style.display = "none";

  const stats = league.stats instanceof Array
    ? league.stats
    : Object.entries(league.stats).map(([label, points]) => ({ label, points }));

  stats.forEach(stat => {
    const row = document.createElement("div");
    row.className = "stat-row";

    const label = document.createElement("label");
    label.innerHTML = `${stat.label} <span class="points">(${stat.points} pts)</span>`;

    const input = document.createElement("input");
    input.type = "number";
    input.id = stat.label;
    input.placeholder = " ";

    row.appendChild(label);
    row.appendChild(input);
    statInputs.appendChild(row);
  });

  if (league.bonuses && league.bonuses.length > 0) {
    bonusSection.style.display = "block";
    league.bonuses.forEach((bonus, i) => {
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
  const league = getLeagueByName(leagueSelect.value);
  if (!league) return;

  let total = 0;
  let details = "";

  const stats = league.stats instanceof Array
    ? league.stats
    : Object.entries(league.stats).map(([label, points]) => ({ label, points }));

  stats.forEach(stat => {
    const val = parseFloat(document.getElementById(stat.label).value) || 0;
    const score = val * stat.points;
    total += score;
    if (!hideZeros.checked || val !== 0) {
      details += `${stat.label}: ${stat.points} x ${val} = ${score.toFixed(2)}\n`;
    }
  });

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
  const league = getLeagueByName(leagueSelect.value);
  if (!league) return;

  const stats = league.stats instanceof Array
    ? league.stats
    : Object.entries(league.stats).map(([label]) => ({ label }));

  stats.forEach(stat => {
    const input = document.getElementById(stat.label);
    if (input) input.value = "";
  });

  document.querySelectorAll('input[name="bonus"]').forEach(radio => {
    radio.checked = false;
  });

  totalScore.innerText = "0";
  breakdown.value = "";
});

copyBtn.addEventListener("click", () => {
  breakdown.select();
  document.execCommand("copy");
});
