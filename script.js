
function calculateScore() {
    const weights = {
        points: 1,
        rebound: 1.2,
        assist: 1.5,
        block: 3,
        steal: 3,
        turnover: -1
    };

    let total = 0;
    let breakdown = [];

    for (let stat in weights) {
        let value = parseFloat(document.getElementById(stat).value) || 0;
        let score = value * weights[stat];
        total += score;
        breakdown.push(`${stat}: ${value} × ${weights[stat]} = ${score.toFixed(2)}`);
    }

    document.getElementById("result").value = breakdown.join("\n") + `\n\nTotal Score: ${total.toFixed(2)}`;
}

function clearInputs() {
    ['points','rebound','assist','block','steal','turnover'].forEach(id => {
        document.getElementById(id).value = '';
    });
    document.getElementById("result").value = '';
}
