function emptyTableState() {
    return '<tr><td colspan="7"><div class="empty-state"><div class="icon">🏀</div><p>Nenhuma estatística inserida</p></div></td></tr>';
}

function setStatsPageAlert(messageHtml) {
    const el = document.getElementById("stats-page-alert");
    if (!el) {
        return;
    }
    if (!messageHtml) {
        el.hidden = true;
        el.innerHTML = "";
        return;
    }
    el.hidden = false;
    el.innerHTML = messageHtml;
}

function isPlaceholderSumulaRow(item) {
    const nome = getJogadorLabel(item);
    if (nome && nome !== "—") {
        return false;
    }
    const st = item && item.stats;
    if (!st) {
        return true;
    }
    return !(st.pontos || st.assistencias || st.rebotes || st.tocos || st.roubos);
}

function getJogadorLabel(sumulaItem) {
    // Linha já normalizada em data-loader (nome) ou direto do JSON (Nome / jogador)
    if (sumulaItem && typeof sumulaItem.nome === "string" && sumulaItem.nome.trim()) {
        return sumulaItem.nome.trim();
    }
    if (sumulaItem && typeof sumulaItem.Nome === "string" && sumulaItem.Nome.trim()) {
        return sumulaItem.Nome.trim();
    }

    // Formato antigo: { jogadorCpf, nmrCamiseta, stats }
    if (sumulaItem && sumulaItem.jogadorCpf) {
        return sumulaItem.jogadorCpf;
    }

    if (sumulaItem && typeof sumulaItem.jogador === "string" && sumulaItem.jogador.trim()) {
        return sumulaItem.jogador.trim();
    }

    return "—";
}

function renderTeamStats(sumulas) {
    const rows = sumulas.filter((row) => !isPlaceholderSumulaRow(row));
    if (!rows.length) {
        return emptyTableState();
    }

    return rows
        .sort((a, b) => b.stats.pontos - a.stats.pontos)
        .map((item) => {
            const nome = getJogadorLabel(item);
            const numero = item && item.nmrCamiseta != null ? item.nmrCamiseta : "—";
            return `
                <tr>
                    <td>${numero}</td>
                    <td>${nome}</td>
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
        document.getElementById("topbar-game-label").textContent = "Estatísticas do Jogo";
        setStatsPageAlert(
            "Nenhum jogo selecionado. Use o link <strong>Estatísticas</strong> no calendário ou abra " +
                '<a href="index.html">a página inicial</a>.'
        );
        return;
    }

    const { times, jogos, sumulas } = await loadCampeonatoData();
    const jogo = jogos.find((item) => item.id === jogoId);
    if (!jogo) {
        document.getElementById("topbar-game-label").textContent = "Jogo não encontrado";
        setStatsPageAlert(
            `Não existe jogo com o id <code style="opacity:.9">${escapeHtml(jogoId)}</code>. ` +
                '<a href="index.html">Voltar ao calendário</a>'
        );
        return;
    }

    const teamById = toMap(times, "id");
    const winnerId = getWinnerId(jogo);

    const home = teamById.get(jogo.time1_id);
    const away = teamById.get(jogo.time2_id);
    if (!home || !away) {
        document.getElementById("topbar-game-label").textContent = `Jogo ${jogo.id}`;
        setStatsPageAlert("Dados do jogo incompletos (times não encontrados em times.json).");
        return;
    }

    setStatsPageAlert(null);

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

    document.getElementById("home-tbody").innerHTML = renderTeamStats(homeRows);
    document.getElementById("away-tbody").innerHTML = renderTeamStats(awayRows);
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

initJogoStatsPage().catch((error) => {
    console.error(error);
    document.getElementById("topbar-game-label").textContent = "Erro ao carregar";
    setStatsPageAlert(
        "Não foi possível carregar os dados (JSON em /data). Se você abriu o arquivo direto do disco, " +
            "use um servidor local (por exemplo <code>python -m http.server</code>) ou " +
            '<a href="index.html">tente de novo pelo site</a>.'
    );
});
