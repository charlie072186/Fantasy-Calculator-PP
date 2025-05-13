let leagues = {};
const leagueSelect = document.getElementById("league");

fetch("leagues.json")
  .then((res) => res.json())
  .then((data) => {
    leagues = data;
    populateLeagues();

    const firstKey = Object.keys(leagues)[0];
    leagueSelect.value = firstKey;
    renderInputs(firstKey);
  })
  .catch((err) => {
    console.error("Error loading league data:", err);
    const errorMsg = document.createElement("p");
    errorMsg.textContent = "Error loading league data.";
    errorMsg.style.color = "red";
    document.body.insertBefore(errorMsg, document.getElementById("statInputs"));
  });

function populateLeagues() {
  leagueSelect.innerHTML = "";
  Object.entries(leagues)
    .sort((a, b) => a[1].name.localeCompare(b[1].name))
    .forEach(([key, league]) => {
      const option = document.createElement("option");
      option.value = key; // store league key
      option.textContent = league.name;
      leagueSelect.appendChild(option);
    });
}

leagueSelect.addEventListener("change", () => {
  renderInputs(leagueSelect.value);
});

function renderInputs(key) {
  const league = leagues[key];
  const statInputs = document.getElementById("statInputs");
  statInputs.innerHTML = "";

  const stats = Array.isArray(league.stats)
    ? league.stats
    : Object.entries(league.stats).map(([label, points]) => ({ label, points }));

  stats.forEach((stat) => {
    const row = document.createElement("div");
    row.className = "stat-row";

    const label = document.createElement("label");
    label.textContent = `${stat.label} (${stat.points} pts)`;

    const input = document.createElement("input");
    input.type = "number";
    input.min = 0;
    input.dataset.label = stat.label;
    input.dataset.points = stat.points;

    row.appendChild(label);
    row.appendChild(input);
    statInputs.appendChild(row);
  });

  renderBonusOptions(league.bonuses || []);
}

function renderBonusOptions(bonuses) {
  const bonusSection = document.getElementById("bonusSection");
  const bonusOptions = document.getElementById("bonusOptions");
  bonusOptions.innerHTML = "";

  if (bonuses.length > 0) {
    bonusSection.style.display = "block";

    bonuses.forEach((bonus, index) => {
      const label = document.createElement("label");
      const input = document.createElement("input");
      input.type = "radio";
      input.name = "bonus";
      input.value = bonus.points;

      label.appendChild(input);
      label.append(` ${bonus.label} (${bonus.points} pts)`);
      bonusOptions.appendChild(label);
    });
  } else {
    bonusSection.style.display = "none";
  }
}
