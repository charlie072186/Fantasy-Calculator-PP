const statInputs = document.getElementById("statInputs");
const breakdown = document.getElementById("breakdown");
const totalScore = document.getElementById("totalScore");
const leagueSelect = document.getElementById("league");

let leagueStats = {};

fetch('leagues.json')
  .then(res => res.json())
  .then(data => {
    leagueStats = data;
    renderInputs(leagueSelect.value);
  });

leagueSelect.addEventListener("change", () => {
  renderInputs(leagueSelect.value);
});

function renderInputs(league) {
  statInputs.innerHTML = "";
  const stats = leagueStats[league];
  for (let stat in stats) {
    const inputId = stat.replace(/\s/g, "_");
    statInputs.innerHTML += \`
      <label>\${stat} (\${stats[stat]} pts)</label>
      <input type="number" id="\${inputId}" placeholder="0">
    \`;
  }
}

document.getElementById("calculateBtn").addEventListener("click", () => {
  const stats = leagueStats[leagueSelect.value];
  let total = 0;
  let details = "";
  for (let stat in stats) {
    const inputId = stat.replace(/\s/g, "_");
    const val = parseFloat(document.getElementById(inputId).value) || 0;
    const score = val * stats[stat];
    total += score;
    details += \`\${stat}: \${stats[stat]} pts x \${val} = \${score.toFixed(2)}\n\`;
  }
  totalScore.innerText = total.toFixed(2);
  breakdown.value = details;
});

document.getElementById("clearBtn").addEventListener("click", () => {
  const stats = leagueStats[leagueSelect.value];
  for (let stat in stats) {
    const inputId = stat.replace(/\s/g, "_");
    document.getElementById(inputId).value = "";
  }
  totalScore.innerText = "0";
  breakdown.value = "";
});
