let leagues = [];

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
    renderInputs(leagues[0].name); // default league
  })
  .catch(err => {
    console.error("Error loading JSON:", err);
    statInputs.innerHTML = "<p style='color: red;'>Error loading league data.</p>";
  });

function getLeagueByName(name) {
  return leagues.find(l => l.name === name);
}

function populateLeagues() {
  leagueSelect.innerHTML = "";
  leagues.forEach(league => {
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

  league.stats.forEach(stat => {
    const row = document.createElement("div");
    row.className = "stat-row";

    const label = document.createElement("label");
    const unit = stat.label.toLowerCase().includes("yard") ? "/yd" : "";
    label.innerHTML = `${stat.label} <span class="points">(${stat.points} pts${unit})</span>`;

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

  league.stats.forEach(stat => {
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

  league.stats.forEach(stat => {
    const input = document.getElementById(stat.label);
    if (input) input.value = "";
  });

  const selectedBonus = document.querySelector('input[name="bonus"]:checked');
  if (selectedBonus) selectedBonus.checked = false;

  totalScore.innerText = "0";
  breakdown.value = "";
});

copyBtn.addEventListener("click", () => {
  breakdown.select();
  document.execCommand("copy");
});
