let leagues = {};
const leagueSelect = document.getElementById("league");
const statInputs = document.getElementById("statInputs");
const calculateBtn = document.getElementById("calculateBtn");
const clearBtn = document.getElementById("clearBtn");
const totalScore = document.getElementById("totalScore");
const breakdown = document.getElementById("breakdown");

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
  const leagueData = leagues[selectedLeague];
  const stats = leagueData.stats;

  for (let stat in stats) {
    const label = document.createElement("label");
    label.innerText = `${stat} (${stats[stat]} pts)`;
    const input = document.createElement("input");
    input.type = "number";
    input.id = stat;
    input.placeholder = " ";
    statInputs.appendChild(label);
    statInputs.appendChild(input);
  }

  // If bonuses exist (for combat sports), render bonus radio buttons
  if (leagueData.bonuses) {
    const bonusGroup = document.createElement("div");
    bonusGroup.style.marginTop = "1rem";
    bonusGroup.innerHTML = "<strong>Fight Outcome Bonus:</strong><br>";
    leagueData.bonuses.forEach((bonus, index) => {
      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = "bonus";
      radio.value = bonus.points;
      radio.id = `bonus_${index}`;

      const label = document.createElement("label");
      label.htmlFor = radio.id;
      label.innerText = ` ${bonus.label} (${bonus.points} pts)`;

      const line = document.createElement("div");
      line.appendChild(radio);
      line.appendChild(label);
      bonusGroup.appendChild(line);
    });
    statInputs.appendChild(bonusGroup);
  }
}

leagueSelect.addEventListener("change", () => {
  renderInputs(leagueSelect.value);
  totalScore.innerText = "0";
  breakdown.value = "";
});

calculateBtn.addEventListener("click", () => {
  const leagueData = leagues[leagueSelect.value];
  const stats = leagueData.stats;
  let total = 0;
  let details = "";

  for (let stat in stats) {
    const val = parseFloat(document.getElementById(stat).value) || 0;
    const score = val * stats[stat];
    total += score;
    details += `${stat}: ${stats[stat]} x ${val} = ${score.toFixed(2)}\n`;
  }

  // Add bonus if selected
  const selectedBonus = document.querySelector("input[name='bonus']:checked");
  if (selectedBonus) {
    const bonusPoints = parseFloat(selectedBonus.value);
    total += bonusPoints;
    details += `Bonus: ${bonusPoints.toFixed(2)} pts\n`;
  }

  totalScore.innerText = total.toFixed(2);
  breakdown.value = details;
});

clearBtn.addEventListener("click", () => {
  const leagueData = leagues[leagueSelect.value];
  const stats = leagueData.stats;
  for (let stat in stats) {
    document.getElementById(stat).value = "";
  }
  const selectedBonus = document.querySelector("input[name='bonus']:checked");
  if (selectedBonus) {
    selectedBonus.checked = false;
  }
  totalScore.innerText = "0";
  breakdown.value = "";
});
