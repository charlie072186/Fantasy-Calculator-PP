// Load leagues.json and populate dropdown
fetch('league.json')
  .then(res => res.json())
  .then(data => {
    const leagueSelect = document.getElementById('league');
    const statInputs = document.getElementById('statInputs');
    const bonusSection = document.getElementById('bonusSection');
    const bonusOptions = document.getElementById('bonusOptions');
    const totalScoreEl = document.getElementById('totalScore');
    const breakdownTextarea = document.getElementById('breakdown');
    const hideZeros = document.getElementById('hideZeros');

    let currentLeague = null;

    // Populate dropdown
    Object.entries(data).forEach(([key, league]) => {
      const option = document.createElement('option');
      option.value = key;
      option.textContent = league.name;
      leagueSelect.appendChild(option);
    });

    // Load stat inputs when league changes
    leagueSelect.addEventListener('change', () => {
      const selectedKey = leagueSelect.value;
      currentLeague = data[selectedKey];
      statInputs.innerHTML = '';
      bonusOptions.innerHTML = '';
      bonusSection.style.display = currentLeague.bonuses ? 'block' : 'none';

      const stats = Array.isArray(currentLeague.stats)
        ? currentLeague.stats
        : Object.entries(currentLeague.stats).map(([label, points]) => ({ label, points }));

      stats.forEach(stat => {
        const row = document.createElement('div');
        row.className = 'stat-row';

        const label = document.createElement('label');
        label.textContent = `${stat.label} (${stat.points})`;

        const input = document.createElement('input');
        input.type = 'number';
        input.className = 'stat-input';
        input.dataset.points = stat.points;
        input.dataset.label = stat.label;

        row.appendChild(label);
        row.appendChild(input);
        statInputs.appendChild(row);
      });

      if (currentLeague.bonuses) {
        currentLeague.bonuses.forEach(bonus => {
          const label = document.createElement('label');
          const radio = document.createElement('input');
          radio.type = 'radio';
          radio.name = 'bonus';
          radio.value = bonus.points;
          label.appendChild(radio);
          label.appendChild(document.createTextNode(` ${bonus.label} (${bonus.points})`));
          bonusOptions.appendChild(label);
        });
      }
    });

    // Calculate button
    document.getElementById('calculateBtn').addEventListener('click', () => {
      const inputs = document.querySelectorAll('.stat-input');
      let total = 0;
      let breakdown = '';

      inputs.forEach(input => {
        const value = parseFloat(input.value) || 0;
        const points = parseFloat(input.dataset.points);
        const label = input.dataset.label;
        const subtotal = value * points;

        if (!hideZeros.checked || value !== 0) {
          breakdown += `${label}: ${value} × ${points} = ${subtotal}\n`;
        }

        total += subtotal;
      });

      const bonusRadio = document.querySelector('#bonusOptions input[type="radio"]:checked');
      if (bonusRadio) {
        const bonus = parseFloat(bonusRadio.value);
        total += bonus;
        breakdown += `Bonus: +${bonus}\n`;
      }

      totalScoreEl.textContent = total.toFixed(2);
      breakdownTextarea.value = breakdown.trim();
    });

    // Clear button
    document.getElementById('clearBtn').addEventListener('click', () => {
      document.querySelectorAll('.stat-input').forEach(input => input.value = '');
      document.querySelectorAll('#bonusOptions input[type="radio"]').forEach(radio => radio.checked = false);
      totalScoreEl.textContent = '0';
      breakdownTextarea.value = '';
    });

    // Copy breakdown
    document.getElementById('copyBtn').addEventListener('click', () => {
      navigator.clipboard.writeText(breakdownTextarea.value);
    });

    // Trigger initial render
    leagueSelect.dispatchEvent(new Event('change'));
  });
