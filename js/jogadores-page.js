function renderJogadoresTable(jogadoresDoTime) {
    if (!jogadoresDoTime.length) {
        return `
            <tbody>
                <tr class="standing-row">
                    <td class="team-name" colspan="3">Nenhum jogador cadastrado.</td>
                </tr>
            </tbody>
        `;
    }

    return `
        <tbody>
            ${jogadoresDoTime
                .sort((a, b) => a.nome.localeCompare(b.nome))
                .map((jogador, idx) => `
                    <tr class="standing-row">
                        <td class="position">${idx + 1}</td>
                        <td class="team-name">${jogador.nome}</td>
                        <td class="stat">${jogador.cpf}</td>
                    </tr>
                `)
                .join("")}
        </tbody>
    `;
}

async function initJogadoresPage() {
    const { times, jogadores } = await loadCampeonatoData();
    const container = document.getElementById("jogadoresContainer");
    const jogadoresPorTime = jogadores.reduce((acc, jogador) => {
        if (!acc[jogador.timeId]) {
            acc[jogador.timeId] = [];
        }
        acc[jogador.timeId].push(jogador);
        return acc;
    }, {});

    const sortedTimes = [...times].sort((a, b) =>
        (a.grupo || "").localeCompare(b.grupo || "") || a.nome.localeCompare(b.nome)
    );

    container.innerHTML = sortedTimes
        .map((time) => `
            <h2 class="group-title">${time.nome}</h2>
            <table class="standings-table">
                <thead>
                    <tr>
                        <th class="position">#</th>
                        <th class="team-name">Jogador</th>
                        <th class="stat">CPF</th>
                    </tr>
                </thead>
                ${renderJogadoresTable(jogadoresPorTime[time.id] || [])}
            </table>
        `)
        .join("");
}

initJogadoresPage().catch((error) => {
    console.error(error);
    document.getElementById("jogadoresContainer").innerHTML = "<p style='color:#fff'>Erro ao carregar jogadores.</p>";
});
