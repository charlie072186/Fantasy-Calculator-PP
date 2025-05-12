let leagueData = {};
fetch('leagues.json')
  .then(res => res.json())
  .then(data => {
    leagueData = data;
    populateLeagueOptions();
    renderInputs(Object.keys(leagueData)[0]);
  });

const leagueSelect = document.getElementById("league");
const statInputs = document.getElementById("statInputs");
const breakdown = document.getElementById("breakdown");
const totalScore = document.getElementById("totalScore");

function populateLeagueOptions() {
  for (let league in leagueData) {
    const option = document.createElement("option");
    option.value = league;
    option.textContent = league.replace(/_/g, ' ').toUpperCase();
    leagueSelect.appendChild(option);
  }
}

function renderInputs(league) {
  statInputs.innerHTML = "";
  const stats = leagueData[league];
  for (let stat in stats) {
    statInputs.innerHTML += \`
      <label>\${stat} (\${stats[stat]} pts)</label>
      <input type="number" id="\${stat}" placeholder="0">
    \`;
  }
}

leagueSelect.addEventListener("change", () => renderInputs(leagueSelect.value));

document.getElementById("calculateBtn").addEventListener("click", () => {
  const stats = leagueData[leagueSelect.value];
  let total = 0;
  let details = "";
  for (let stat in stats) {
    const val = parseFloat(document.getElementById(stat)?.value) || 0;
    const score = val * stats[stat];
    total += score;
    details += \`\${stat}: \${stats[stat]} x \${val} = \${score.toFixed(2)}\n\`;
  }
  totalScore.innerText = total.toFixed(2);
  breakdown.value = details;
});

document.getElementById("clearBtn").addEventListener("click", () => {
  const stats = leagueData[leagueSelect.value];
  for (let stat in stats) {
    document.getElementById(stat).value = "";
  }
  totalScore.innerText = "0";
  breakdown.value = "";
});