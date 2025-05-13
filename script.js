const leagues = {
  "NBA": { name: "NBA FS", stats: { Points: 1, Rebound: 1.2, Assist: 1.5, Block: 3, Steal: 3, Turnover: -1 } },
  "mlb_pitcher": { name: "MLB Pitcher FS", stats: { "Win": 6, "Quality Start": 4, "Earned Run": -3, "Strikeout": 3, "Innings Pitched": 3 } },
  "mlb_hitter": { name: "MLB Hitter FS", stats: { "Single": 3, "Double": 5, "Triple": 8, "Home Run": 10, "Run": 2, "RBI": 2, "BB": 2, "HBP": 2, "SB": 5 } },
  "tennis": { name: "Tennis FS", stats: { "Match Played": 10, "Game Won": 1, "Game Loss": -1, "Set Won": 3, "Set Loss": -3, "Ace": 0.5, "Double Fault": -0.5 } },
  "mma": {
    name: "MMA",
    stats: { significantStrikes: 0.5, submissionAttempt: 4, takedown: 5, knockdown: 10 },
    bonuses: [ { label: "1st Round Win", points: 50 }, { label: "2nd Round Win", points: 40 }, { label: "Decision Win", points: 10 }, { label: "Draw", points: 0 } ]
  },
  "boxing": {
    name: "Boxing FS",
    stats: { "Punch Landed": 0.5, "Knockdown on Opponent": 12, "Being Knocked by Opponent": -12 },
    bonuses: [ { label: "Win Rounds 1-2", points: 100 }, { label: "Win Rounds 3-6", points: 75 }, { label: "Win Rounds 7-10", points: 50 }, { label: "Win Rounds 11-12", points: 25 }, { label: "Decision Win", points: 20 } ]
  },
  "nfl_cfb": {
    name: "Football Offensive FS",
    stats: [
      { label: "Passing Yards", points: 0.04 }, { label: "Passing TDs", points: 4 }, { label: "Interceptions", points: -1 },
      { label: "Rushing Yards", points: 0.1 }, { label: "Rushing TDs", points: 6 }, { label: "Receiving Yards", points: 0.1 },
      { label: "Receiving TDs", points: 6 }, { label: "Receptions", points: 1 }, { label: "Fumbles Lost", points: -1 },
      { label: "2 Point Conversions", points: 2 }, { label: "Offensive Fumble Recovery TD", points: 6 }, { label: "Kick/Punt/Field Goal Return TD", points: 6 }
    ],
    bonuses: []
  },
  "soccer": {
    name: "Soccer",
    stats: {
      "Goal": 5, "Assist": 4, "Goal from PEN": 3, "Shot on Target": 2,
      "Completed Pass": 0.1, "Missed Pass": -0.1, "Yellow Card": -1, "Red Card": -2
    }
  }
};

function loadStats() {
  const leagueKey = document.getElementById("league").value;
  const league = leagues[leagueKey];
  const container = document.getElementById("stats-container");
  container.innerHTML = "";
  const stats = Array.isArray(league.stats)
    ? league.stats.map(s => [s.label, s.points])
    : Object.entries(league.stats);

  stats.forEach(([label, points]) => {
    const row = document.createElement("div");
    row.className = "stat-row";
    row.innerHTML = `
      <div class="stat-label">${label} — ${points} pts</div>
      <input type="text" class="stat-input" id="stat-${label}" />
    `;
    container.appendChild(row);
  });
}

function calculateScore() {
  const leagueKey = document.getElementById("league").value;
  const league = leagues[leagueKey];
  const stats = Array.isArray(league.stats)
    ? league.stats.map(s => [s.label, s.points])
    : Object.entries(league.stats);
  let total = 0;
  let breakdown = "";

  stats.forEach(([label, points]) => {
    const val = parseFloat(document.getElementById(`stat-${label}`)?.value) || 0;
    if (val !== 0 || !document.getElementById("hideZero").checked) {
      breakdown += `${label}: ${val} × ${points} = ${val * points}\n`;
    }
    total += val * points;
  });

  document.getElementById("breakdown").value = breakdown + `\nTotal: ${total.toFixed(2)}`;
}

function clearInputs() {
  document.querySelectorAll(".stat-input").forEach(input => input.value = "");
  document.getElementById("breakdown").value = "";
}

function copyBreakdown() {
  const breakdown = document.getElementById("breakdown");
  breakdown.select();
  document.execCommand("copy");
}

window.onload = () => {
  const select = document.getElementById("league");
  Object.entries(leagues).forEach(([key, val]) => {
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = val.name;
    select.appendChild(opt);
  });
  loadStats();
};
