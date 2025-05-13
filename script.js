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

// Load leagues.json
fetch("leagues.json")
  .then(res => res.json())
  .then(data => {
    leagues = data;
    populateLeagues();

    const firstLeagueName = Object.values(leagues)[0].name;
    leagueSelect.value = firstLeagueName;
    leagueSelect.dispatchEvent(new Event("change")); // trigger default render
  })
  .catch(err => {
    console.error("Error loading JSON:", err);
    statInputs.innerHTML = "<p style='color: red;'>Error loading league data.</p>";
  });

// Get league object by name
function getLeagueByName(name) {
  return Object.values(leagues).find(l => l.name === name);
}

// Populate dropdown
function populateLeagues() {
  leagueSelect.innerHTML = "";
  Object.values(leagues).forEach(league => {
    const option = document.createElement("option");
    option.value = league.name;
    option.textContent = league.name;
    leagueSelect.appendChild(option);
  });
}

// Render stat input fields and bonus radio buttons
function renderInputs(leagueName) {
  const league = getLeagueByName(leagueName);
  if (!league) return;

  statInputs.innerHTML = "";
  bonusOptions.innerHTML = "";
  bonusSection.style.display = "none";

  const statsArray = league.stats instanceof Array
    ? league.stats
    : Object.entries(league.stats).map(([label, points]) => ({ label, points }));

  statsArray.forEach(stat => {
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

  // Render bonus options if available
  if (league.bonuses && league.bonuses.length > 0) {
    bonusSection.style.display = "block";

    // Optional "None" radio
    const noneLabel = document.createElement("label");
    const noneRadio = document.createElement("input");
    noneRadio.type = "radio";
    noneRadio.name = "bonus";
    noneRadio.value = "0";
    noneRadio.checked = true;
    noneLabel.appendChild(noneRadio);
    noneLabel.append(" None (0 pts)");
    bonusOptions.appendChild(noneLabel);

    league.bonuses.forEach(bonus => {
      const label = document.createElement("label");
      label.style.display = "block";

      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = "bonus";
      radio.value = bonus.points;

      label.appendChild(radio);
      label.append(` ${bonus.label} (+${bonus.points})`);
      bonusOptions.appendChild(label);
    });
  }
}

// Handle league switch
leagueSelect.addEventListener("change", () => {
  renderInputs(leagueSelect.value);
  totalScore.innerText = "0";
  breakdown.value = "";
});

// Calculate score
calculateBtn.addEventListener("click", () => {
  const league = getLeagueByName(leagueSelect.value);
  if (!league) return;

  let total = 0;
  let details = "";

  const statsArray = league.stats instanceof Array
    ? league.stats
    : Object.entries(league.stats).map(([label, points]) => ({ label, points }));

  statsArray.forEach(stat => {
    const input = document.getElementById(stat.label);
    const val = parseFloat(input.value) || 0;
    const score = val * stat.points;
    total += score;

    if (!hideZeros.checked || val !== 0) {
      details += `${stat.label}: ${stat.points} x ${val} = ${score.toFixed(2)}\n`;
    }
  });

  // Add bonus if selected
  const selectedBonus = document.querySelector('input[name="bonus"]:checked');
  if (selectedBonus) {
    const bonusValue = parseFloat(selectedBonus.value);
    total += bonusValue;
    if (bonusValue > 0) {
      details += `Bonus: +${bonusValue}\n`;
    }
  }

  totalScore.innerText = total.toFixed(2);
  breakdown.value = `${details}\nTOTAL FS = ${total.toFixed(2)}`;
});

// Clear inputs
clearBtn.addEventListener("click", () => {
  const league = getLeagueByName(leagueSelect.value);
  if (!league) return;

  const statsArray = league.stats instanceof Array
    ? league.stats
    : Object.entries(league.stats).map(([label]) => ({ label }));

  statsArray.forEach(stat => {
    const input = document.getElementById(stat.label);
    if (input) input.value = "";
  });

  // Reset bonus radios
  document.querySelectorAll('input[name="bonus"]').forEach(radio => {
    radio.checked = radio.value === "0"; // Reset to "None"
  });

  totalScore.innerText = "0";
  breakdown.value = "";
});

// Copy breakdown to clipboard
copyBtn.addEventListener("click", () => {
  navigator.clipboard.writeText(breakdown.value)
    .then(() => alert("Copied to clipboard!"))
    .catch(() => alert("Failed to copy."));
});
