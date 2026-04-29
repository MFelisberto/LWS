function emptyTableState() {
    return '<tr><td colspan="7"><div class="empty-state"><div class="icon">🏀</div><p>Nenhuma estatística inserida</p></div></td></tr>';
}

function renderTeamStats(sumulas, jogadorByCpf) {
    if (!sumulas.length) {
        return emptyTableState();
    }

    return sumulas
        .sort((a, b) => b.stats.pontos - a.stats.pontos)
        .map((item) => {
            const jogador = jogadorByCpf.get(item.jogadorCpf);
            const nome = jogador ? jogador.nome : item.jogadorCpf;
            return `
                <tr>
                    <td>${item.nmrCamiseta} - ${nome}</td>
                    <td>${item.stats.pontos}</td>
                    <td>${item.stats.rebotes}</td>
                    <td>${item.stats.assistencias}</td>
                    <td>${item.stats.tocos}</td>
                    <td>${item.stats.roubos}</td>
                </tr>
            `;
        })
        .join("");
}

async function initJogoStatsPage() {
    const params = new URLSearchParams(window.location.search);
    const jogoId = params.get("jogoId");
    if (!jogoId) {
        return;
    }

    const { times, jogadores, jogos, sumulas } = await loadCampeonatoData();
    const jogo = jogos.find((item) => item.id === jogoId);
    if (!jogo) {
        return;
    }

    const teamById = toMap(times, "id");
    const jogadorByCpf = toMap(jogadores, "cpf");
    const winnerId = getWinnerId(jogo);

    const home = teamById.get(jogo.time1_id);
    const away = teamById.get(jogo.time2_id);
    if (!home || !away) {
        return;
    }

    document.getElementById("home-name").textContent = home.nome;
    document.getElementById("away-name").textContent = away.nome;
    document.getElementById("home-section-title").textContent = home.nome;
    document.getElementById("away-section-title").textContent = away.nome;
    document.getElementById("home-score").textContent = String(jogo.placar.time1);
    document.getElementById("away-score").textContent = String(jogo.placar.time2);
    document.getElementById("topbar-game-label").textContent = `Jogo ${jogo.id}`;

    const homeBlock = document.getElementById("home");
    const awayBlock = document.getElementById("away");
    homeBlock.classList.remove("winner");
    awayBlock.classList.remove("winner");
    if (winnerId === home.id) {
        homeBlock.classList.add("winner");
    } else if (winnerId === away.id) {
        awayBlock.classList.add("winner");
    }

    const homeRows = getSumulasPorTimeNoJogo(sumulas, jogo.id, home.id);
    const awayRows = getSumulasPorTimeNoJogo(sumulas, jogo.id, away.id);

    document.getElementById("home-tbody").innerHTML = renderTeamStats(homeRows, jogadorByCpf);
    document.getElementById("away-tbody").innerHTML = renderTeamStats(awayRows, jogadorByCpf);
}

initJogoStatsPage().catch((error) => {
    console.error(error);
});
