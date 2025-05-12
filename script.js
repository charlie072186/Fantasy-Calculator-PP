
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
  const stats = leagues[selectedLeague].stats;

  for (let stat in stats) {
    const label = document.createElement("label");
    label.innerText = `${stat} (${stats[stat]} pts)`;
    const input = document.createElement("input");
    input.type = "number";
    input.id = stat;
    input.placeholder = "0";
    statInputs.appendChild(label);
    statInputs.appendChild(input);
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
    details += `${stat}: ${stats[stat]} x ${val} = ${score.toFixed(2)}\n`;
  }

  totalScore.innerText = total.toFixed(2);
  breakdown.value = details;
});

clearBtn.addEventListener("click", () => {
  const stats = leagues[leagueSelect.value].stats;
  for (let stat in stats) {
    document.getElementById(stat).value = "";
  }
  totalScore.innerText = "0";
  breakdown.value = "";
});
