const leagues = {
  "NBA": {
    "stats": {
      "Points": 1,
      "Rebound": 1.2,
      "Assist": 1.5,
      "Block": 3,
      "Steal": 3,
      "Turnover": -1
    }
  },
  "Soccer": {
    "stats": {
      "Goal": 5,
      "Assist": 4,
      "Goal from PEN": 3,
      "Shot on Target": 2,
      "Completed Pass": 0.1,
      "Missed Pass": -0.1,
      "Yellow Card": -1,
      "Red Card": -2
    }
  }
};

const leagueSelect = document.getElementById("league");
const statInputs = document.getElementById("statInputs");
const totalScore = document.getElementById("totalScore");
const breakdownArea = document.getElementById("breakdown");
const hideZerosCheckbox = document.getElementById("hideZeros");

function renderLeagueOptions() {
  Object.keys(leagues).forEach(league => {
    const option = document.createElement("option");
    option.value = league;
    option.textContent = league;
    leagueSelect.appendChild(option);
  });
}

function renderStatInputs(leagueName) {
  statInputs.innerHTML = "";
  const stats = leagues[leagueName].stats;

  Object.entries(stats).forEach(([label, points]) => {
    const row = document.createElement("div");
    row.className = "stat-row";
    row.innerHTML = `
      <label>${label} <span style="color:#bbb">— ${points} pts</span></label>
      <input type="number" min="0" data-stat="${label}" />
    `;
    statInputs.appendChild(row);
  });
}

function calculateScore() {
  const stats = leagues[leagueSelect.value].stats;
  let total = 0;
  let breakdown = "";

  document.querySelectorAll("#statInputs input").forEach(input => {
    const stat = input.dataset.stat;
    const value = parseFloat(input.value) || 0;
    const pts = stats[stat];
    const subtotal = value * pts;

    if (!hideZerosCheckbox.checked || value !== 0) {
      breakdown += `${stat}: ${value} × ${pts} = ${(subtotal).toFixed(2)}\n`;
    }

    total += subtotal;
  });

  totalScore.textContent = total.toFixed(2);
  breakdownArea.value = breakdown.trim();
}

function clearInputs() {
  document.querySelectorAll("#statInputs input").forEach(input => input.value = "");
  totalScore.textContent = "Fantasy Score";
  breakdownArea.value = "";
}

document.getElementById("calculateBtn").addEventListener("click", calculateScore);
document.getElementById("clearBtn").addEventListener("click", clearInputs);
document.getElementById("copyBtn").addEventListener("click", () => {
  breakdownArea.select();
  document.execCommand("copy");
});

leagueSelect.addEventListener("change", () => renderStatInputs(leagueSelect.value));

renderLeagueOptions();
renderStatInputs(leagueSelect.value);
