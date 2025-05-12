
const sheetID = "1gO8Ko4Ro0jXrCgvof_5mq6CvNSyxU1xyw4V9MdLijXY";
const baseURL = `https://docs.google.com/spreadsheets/d/${sheetID}/gviz/tq?tqx=out:json&sheet=`;
const leagueSelect = document.getElementById("leagueSelect");
const statsContainer = document.getElementById("statsContainer");
let currentScoring = {};

const leagues = [
  "League1", "League2", "League3", "League4"
];

leagues.forEach(league => {
  const option = document.createElement("option");
  option.value = league;
  option.textContent = league;
  leagueSelect.appendChild(option);
});

leagueSelect.addEventListener("change", async () => {
  const league = leagueSelect.value;
  const url = baseURL + encodeURIComponent(league);
  try {
    const response = await fetch(url);
    const text = await response.text();
    const json = JSON.parse(text.substr(47).slice(0, -2));
    const rows = json.table.rows;

    currentScoring = {};
    statsContainer.innerHTML = "";

    rows.forEach(row => {
      const stat = row.c[0].v;
      const value = parseFloat(row.c[1].v);
      currentScoring[stat] = value;

      const label = document.createElement("label");
      label.textContent = stat;
      const input = document.createElement("input");
      input.type = "number";
      input.id = `stat_${stat}`;
      input.value = "0";
      statsContainer.appendChild(label);
      statsContainer.appendChild(input);
    });
  } catch (error) {
    console.error("Error loading scoring rules:", error);
  }
});

function calculateScore() {
  let total = 0;
  for (const stat in currentScoring) {
    const input = document.getElementById(`stat_${stat}`);
    const value = parseFloat(input.value) || 0;
    total += value * currentScoring[stat];
  }
  document.getElementById("totalScore").textContent = total.toFixed(2);
}

function calculateTOI() {
  const minutes = parseInt(document.getElementById("toiMinutes").value) || 0;
  const seconds = parseInt(document.getElementById("toiSeconds").value) || 0;
  const decimalTOI = minutes + seconds / 60;
  document.getElementById("toiResult").textContent = decimalTOI.toFixed(2);
}

window.onload = () => {
  leagueSelect.dispatchEvent(new Event("change"));
};
