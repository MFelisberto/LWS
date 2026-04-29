async function loadCampeonatoData() {
    const [times, jogadores, rodadas, jogos, sumulas] = await Promise.all([
        fetch("data/times.json").then((r) => r.json()),
        fetch("data/jogadores.json").then((r) => r.json()),
        fetch("data/rodadas.json").then((r) => r.json()),
        fetch("data/jogos.json").then((r) => r.json()),
        fetch("data/sumulas.json").then((r) => r.json())
    ]);

    return { times, jogadores, rodadas, jogos, sumulas };
}

function toMap(items, key) {
    const map = new Map();
    items.forEach((item) => map.set(item[key], item));
    return map;
}

function getWinnerId(jogo) {
    if (!jogo.finalizado) {
        return null;
    }
    if (jogo.placar.time1 > jogo.placar.time2) {
        return jogo.time1_id;
    }
    if (jogo.placar.time2 > jogo.placar.time1) {
        return jogo.time2_id;
    }
    return null;
}

function computeClassificacao(times, jogos) {
    const rows = times.map((time) => ({
        timeId: time.id,
        equipe: time.nome,
        grupo: time.grupo || "Sem grupo",
        jogos: 0,
        vitorias: 0,
        derrotas: 0,
        pontosPro: 0,
        pontosContra: 0,
        saldo: 0,
        pontos: 0
    }));

    const byTime = toMap(rows, "timeId");

    jogos.forEach((jogo) => {
        if (!jogo.finalizado) {
            return;
        }

        const t1 = byTime.get(jogo.time1_id);
        const t2 = byTime.get(jogo.time2_id);
        if (!t1 || !t2) {
            return;
        }

        const p1 = Number(jogo.placar.time1 || 0);
        const p2 = Number(jogo.placar.time2 || 0);
        const winner = getWinnerId(jogo);

        t1.jogos += 1;
        t2.jogos += 1;
        t1.pontosPro += p1;
        t1.pontosContra += p2;
        t2.pontosPro += p2;
        t2.pontosContra += p1;

        if (winner === t1.timeId) {
            t1.vitorias += 1;
            t1.pontos += 2;
            t2.derrotas += 1;
            t2.pontos += 1;
        } else if (winner === t2.timeId) {
            t2.vitorias += 1;
            t2.pontos += 2;
            t1.derrotas += 1;
            t1.pontos += 1;
        } else {
            t1.pontos += 1;
            t2.pontos += 1;
        }
    });

    rows.forEach((row) => {
        row.saldo = row.pontosPro - row.pontosContra;
    });

    const grouped = {};
    rows.forEach((row) => {
        if (!grouped[row.grupo]) {
            grouped[row.grupo] = [];
        }
        grouped[row.grupo].push(row);
    });

    Object.keys(grouped).forEach((grupo) => {
        grouped[grupo].sort((a, b) =>
            b.pontos - a.pontos ||
            b.vitorias - a.vitorias ||
            b.saldo - a.saldo ||
            b.pontosPro - a.pontosPro ||
            a.equipe.localeCompare(b.equipe)
        );
    });

    return grouped;
}

function getSumulasPorTimeNoJogo(sumulas, jogoId, timeId) {
    const jogoSumula = sumulas.find((item) => item.jogoId === jogoId);
    if (!jogoSumula) {
        return [];
    }

    // Formato novo (recomendado):
    // { jogoId, times: [{ timeId, jogadores: [...] }] }
    if (Array.isArray(jogoSumula.times)) {
        const timeNode = jogoSumula.times.find((node) => node.timeId === timeId);
        return timeNode && Array.isArray(timeNode.jogadores) ? timeNode.jogadores : [];
    }

    // Compatibilidade com formato antigo plano:
    // [{ jogoId, timeId, jogadorCpf, nmrCamiseta, stats }]
    return sumulas.filter((item) => item.jogoId === jogoId && item.timeId === timeId);
}
