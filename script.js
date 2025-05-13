const leagueSelect = document.getElementById('league');
const statInputsDiv = document.getElementById('statInputs');
const bonusSection = document.getElementById('bonusSection');
const bonusOptionsDiv = document.getElementById('bonusOptions');
const hideZeros = document.getElementById('hideZeros');
const totalScoreSpan = document.getElementById('totalScore');
const breakdownTextarea = document.getElementById('breakdown');

let leagueData = {}; // stores the fetched JSON data

fetch('leagues.json')
  .then(res => res.json())
  .then(data => {
    leagueData = data;
    Object.entries(data).forEach(([key, val]) => {
      const option = document.createElement('option');
      option.value = key;
      option.textContent = val.name;
      leagueSelect.appendChild(option);
    });
    renderInputs(); // render first league by default
  })
  .catch(() => {
    leagueSelect.innerHTML = '<option disabled>Error loading data</option>';
  });

leagueSelect.addEventListener('change', renderInputs);
hideZeros.addEventListener('change', renderInputs);

function renderInputs() {
  const selectedLeague = leagueData[leagueSelect.value];
  if (!selectedLeague) return;

  statInputsDiv.innerHTML = '';
  bonusOptionsDiv.innerHTML = '';
  bonusSection.style.display = 'none';

  const stats = Array.isArray(selectedLeague.stats)
    ? selectedLeague.stats.map(s => ({ label: s.label, points: s.points }))
    : Object.entries(selectedLeague.stats).map(([label, points]) => ({ label, points }));

  stats.forEach(stat => {
    const value = parseFloat(document.getElementById(`input-${stat.label}`)?.value || 0);
    if (hideZeros.checked && value === 0) return;

    const row = document.createElement('div');
    row.className = 'stat-row';

    const label = document.createElement('label');
    label.className = 'stat-label';
    label.textContent = `${stat.label} — ${stat.points} pts`;

    const input = document.createElement('input');
    input.type = 'number';
    input.min = 0;
    input.id = `input-${stat.label}`;
    input.className = 'stat-input';
    input.value = value;

    row.appendChild(label);
    row.appendChild(input);
    statInputsDiv.appendChild(row);
  });

  if (selectedLeague.bonuses && selectedLeague.bonuses.length) {
    bonusSection.style.display = 'block';
    selectedLeague.bonuses.forEach(bonus => {
      const label = document.createElement('label');
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'bonus';
      radio.value = bonus.points;
      label.appendChild(radio);
      label.append(` ${bonus.label} (+${bonus.points})`);
      bonusOptionsDiv.appendChild(label);
    });
  }
}

document.getElementById('calculateBtn').addEventListener('click', () => {
  const selectedLeague = leagueData[leagueSelect.value];
  if (!selectedLeague) return;

  let total = 0;
  let breakdown = '';

  const stats = Array.isArray(selectedLeague.stats)
    ? selectedLeague.stats.map(s => ({ label: s.label, points: s.points }))
    : Object.entries(selectedLeague.stats).map(([label, points]) => ({ label, points }));

  stats.forEach(stat => {
    const input = document.getElementById(`input-${stat.label}`);
    const val = parseFloat(input?.value || 0);
    const pts = val * stat.points;
    if (!hideZeros.checked || val !== 0) {
      breakdown += `${stat.label}: ${val} × ${stat.points} = ${pts.toFixed(2)}\n`;
    }
    total += pts;
  });

  const bonus = document.querySelector('input[name="bonus"]:checked');
  if (bonus) {
    const bonusPts = parseFloat(bonus.value);
    total += bonusPts;
    breakdown += `Bonus: +${bonusPts}\n`;
  }

  totalScoreSpan.textContent = total.toFixed(2);
  breakdownTextarea.value = breakdown;
});

document.getElementById('clearBtn').addEventListener('click', () => {
  document.querySelectorAll('#statInputs input').forEach(i => (i.value = '0'));
  document.querySelectorAll('input[name="bonus"]').forEach(r => (r.checked = false));
  totalScoreSpan.textContent = '0';
  breakdownTextarea.value = '';
});

document.getElementById('copyBtn').addEventListener('click', () => {
  navigator.clipboard.writeText(breakdownTextarea.value);
});
