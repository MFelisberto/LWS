function formatDateBR(dateIso) {
    const [y, m, d] = dateIso.split("-");
    return `${d}/${m}/${y}`;
}

function createMatchCard(jogo, teamById) {
    const t1 = teamById.get(jogo.time1_id);
    const t2 = teamById.get(jogo.time2_id);
    const winner = getWinnerId(jogo);

    const finished = jogo.finalizado;
    const badge = finished ? "FIM" : jogo.horario;
    const badgeClass = finished ? "time-badge time-finished" : "time-badge";

    if (!t1 || !t2) {
        return "";
    }

    if (finished) {
        const t1WinnerClass = winner === t1.id ? "team winner" : "team";
        const t2WinnerClass = winner === t2.id ? "team winner" : "team";
        const s1WinnerClass = winner === t1.id ? "score winner" : "score";
        const s2WinnerClass = winner === t2.id ? "score winner" : "score";
        return `
            <div class="match-card">
                <div class="${badgeClass}">${badge}</div>
                <div class="${t1WinnerClass}">${t1.nome}</div>
                <div class="score-container">
                    <span class="${s1WinnerClass}">${jogo.placar.time1}</span>
                    <span class="score-divider">-</span>
                    <span class="${s2WinnerClass}">${jogo.placar.time2}</span>
                </div>
                <div class="${t2WinnerClass}">${t2.nome}</div>
                <a href="jogostats.html?jogoId=${encodeURIComponent(jogo.id)}" class="stats-btn">📊 Estatísticas</a>
            </div>
        `;
    }

    return `
        <div class="match-card">
            <div class="${badgeClass}">${badge}</div>
            <div class="team">${t1.nome}</div>
            <div class="vs-badge">VS</div>
            <div class="team">${t2.nome}</div>
            <a href="jogostats.html?jogoId=${encodeURIComponent(jogo.id)}" class="stats-btn">📊 Estatísticas</a>
        </div>
    `;
}

function showRound(roundId, el) {
    document.querySelectorAll(".round-section").forEach((section) => section.classList.remove("active"));
    document.querySelectorAll(".round-tab").forEach((tab) => tab.classList.remove("active"));
    const current = document.getElementById(`round${roundId}`);
    if (current) {
        current.classList.add("active");
    }
    if (el) {
        el.classList.add("active");
    }
}

window.showRound = showRound;

async function initIndexPage() {
    const { times, rodadas, jogos } = await loadCampeonatoData();
    const teamById = toMap(times, "id");
    const jogoById = toMap(jogos, "id");
    const roundsContainer = document.getElementById("roundsContainer");
    const roundTabs = document.getElementById("roundTabs");

    const sortedRodadas = [...rodadas].sort((a, b) => a.id - b.id);
    const firstOpenRound = sortedRodadas.find((r) => {
        const rodadaJogos = (Array.isArray(r.jogosIds) ? r.jogosIds : [])
            .map((id) => jogoById.get(id))
            .filter(Boolean);
        return rodadaJogos.some((j) => !j.finalizado);
    });
    const activeRoundId = firstOpenRound ? firstOpenRound.id : (sortedRodadas[0] ? sortedRodadas[0].id : 1);

    roundTabs.innerHTML = sortedRodadas
        .map((rodada) => `
            <button class="round-tab ${rodada.id === activeRoundId ? "active" : ""}" onclick="showRound(${rodada.id}, this)">
                Rodada ${rodada.id}
            </button>
        `)
        .join("");

    roundsContainer.innerHTML = sortedRodadas
        .map((rodada) => {
            const rodadaJogos = (Array.isArray(rodada.jogosIds) ? rodada.jogosIds : [])
                .map((id) => jogoById.get(id))
                .filter(Boolean)
                .sort((a, b) => a.horario.localeCompare(b.horario));
            return `
                <div id="round${rodada.id}" class="round-section ${rodada.id === activeRoundId ? "active" : ""}">
                    <div class="round-header">
                        <h2>Rodada ${rodada.id}</h2>
                        <div class="date">${formatDateBR(rodada.data)}</div>
                    </div>
                    <div class="schedule-wrapper">
                        ${rodadaJogos.map((jogo) => createMatchCard(jogo, teamById)).join("")}
                    </div>
                    <div class="footer">Temporada 2026 • Liga Will Sports</div>
                </div>
            `;
        })
        .join("");
}

initIndexPage().catch((error) => {
    console.error(error);
    const roundsContainer = document.getElementById("roundsContainer");
    roundsContainer.innerHTML = '<div class="round-section active"><div class="footer">Erro ao carregar dados. Verifique os arquivos JSON em /data.</div></div>';
});
