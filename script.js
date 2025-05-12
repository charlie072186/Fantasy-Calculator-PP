
let leaguesData = {};
const leagueSelect = document.getElementById("league-select");
const inputArea = document.getElementById("stat-inputs");

fetch('leagues.json')
  .then(res => res.json())
  .then(data => {
    leaguesData = data;
    populateLeagues();
  });

function populateLeagues() {
  for (let league in leaguesData) {
    const option = document.createElement("option");
    option.value = league;
    option.textContent = league;
    leagueSelect.appendChild(option);
  }
  renderInputs(leagueSelect.value);
}

leagueSelect.addEventListener("change", () => {
  renderInputs(leagueSelect.value);
});

function renderInputs(league) {
  inputArea.innerHTML = "";
  const stats = leaguesData[league];
  for (let stat in stats) {
    const div = document.createElement("div");
    div.innerHTML = `<label>${stat}: <input type="number" id="${stat}" value="0"></label>`;
    inputArea.appendChild(div);
  }
}

document.getElementById("calculate-btn").addEventListener("click", () => {
  const stats = leaguesData[leagueSelect.value];
  let score = 0;
  for (let stat in stats) {
    const val = parseFloat(document.getElementById(stat).value) || 0;
    score += val * stats[stat];
  }
  document.getElementById("total-score").textContent = score.toFixed(2);
});
