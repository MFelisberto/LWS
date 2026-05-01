async function fetchJsonSafe(path, fallbackValue) {
    try {
        const res = await fetch(path, { cache: "no-store" });
        if (!res.ok) {
            return fallbackValue;
        }
        return await res.json();
    } catch {
        return fallbackValue;
    }
}

async function fetchJsonFirstAvailable(paths, fallbackValue) {
    for (const path of paths) {
        const value = await fetchJsonSafe(path, null);
        if (value !== null) {
            return value;
        }
    }
    return fallbackValue;
}

function buildTimesFallbackFromJogos(jogos) {
    const ids = new Set();
    (Array.isArray(jogos) ? jogos : []).forEach((j) => {
        if (j && j.time1_id) ids.add(j.time1_id);
        if (j && j.time2_id) ids.add(j.time2_id);
    });
    return Array.from(ids).sort().map((id) => ({ id, nome: id }));
}

async function loadCampeonatoData() {
    const [rodadas, jogos, sumulas, times, rawJogadores] = await Promise.all([
        fetchJsonSafe("data/rodadas.json", []),
        fetchJsonSafe("data/jogos.json", []),
        fetchJsonFirstAvailable(["data/Sumulas.json", "data/sumulas.json"], []),
        fetchJsonSafe("data/times.json", []),
        fetchJsonSafe("data/jogadores.json", [])
    ]);

    const normalizedTimes = Array.isArray(times) && times.length ? times : buildTimesFallbackFromJogos(jogos);
    const { jogadores, jogadoresPorTime } = normalizeJogadores(rawJogadores);
    return { times: normalizedTimes, jogadores, jogadoresPorTime, rodadas, jogos, sumulas };
}

function normalizeJogadores(rawJogadores) {
    if (!Array.isArray(rawJogadores)) {
        return { jogadores: [], jogadoresPorTime: {} };
    }

    const groupedFormat = rawJogadores.every(
        (item) => item && typeof item === "object" && typeof item.timeId === "string" && Array.isArray(item.jogadores)
    );

    if (groupedFormat) {
        const jogadoresPorTime = {};
        const jogadores = [];

        rawJogadores.forEach((timeNode) => {
            const timeId = timeNode.timeId;
            const jogadoresDoTime = Array.isArray(timeNode.jogadores) ? timeNode.jogadores : [];
            jogadoresPorTime[timeId] = jogadoresDoTime.map((jogador) => ({ ...jogador, timeId }));
            jogadores.push(...jogadoresPorTime[timeId]);
        });

        return { jogadores, jogadoresPorTime };
    }

    const jogadoresPorTime = rawJogadores.reduce((acc, jogador) => {
        if (!jogador || !jogador.timeId) {
            return acc;
        }
        if (!acc[jogador.timeId]) {
            acc[jogador.timeId] = [];
        }
        acc[jogador.timeId].push(jogador);
        return acc;
    }, {});

    return { jogadores: rawJogadores, jogadoresPorTime };
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

function normalizeLooseId(value) {
    if (value == null) return "";
    return String(value)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "");
}

function isSameLooseId(a, b) {
    return normalizeLooseId(a) === normalizeLooseId(b);
}

/** Stats vindos de data/Sumulas.json podem usar assistencias ou o typo assitencias. */
function normalizeSumulaStats(stats) {
    if (!stats || typeof stats !== "object") {
        return { pontos: 0, assistencias: 0, rebotes: 0, tocos: 0, roubos: 0 };
    }
    const assistencias = Number(stats.assistencias ?? stats.assitencias ?? 0);
    return {
        pontos: Number(stats.pontos ?? 0),
        assistencias,
        rebotes: Number(stats.rebotes ?? 0),
        tocos: Number(stats.tocos ?? 0),
        roubos: Number(stats.roubos ?? 0)
    };
}

/**
 * Uma linha de súmula pode vir como:
 * - data/Sumulas.json: { Nome, nmrCamiseta, stats }
 * - legado: { jogador, nmrCamiseta, stats } ou { jogadorCpf, ... }
 */
function normalizeSumulaJogadorRow(item) {
    if (!item || typeof item !== "object") {
        return null;
    }
    const nome =
        (typeof item.nome === "string" && item.nome.trim()) ||
        (typeof item.Nome === "string" && item.Nome.trim()) ||
        (typeof item.jogador === "string" && item.jogador.trim()) ||
        "";
    const stats = normalizeSumulaStats(item.stats);
    return { ...item, nome, stats };
}

function mapSumulaJogadores(rows) {
    return (Array.isArray(rows) ? rows : [])
        .map(normalizeSumulaJogadorRow)
        .filter((row) => row !== null);
}

/**
 * Objeto de súmula por jogo (data/Sumulas.json): { jogoId, times: [...] }.
 */
function getSumulaPorJogoId(sumulas, jogoId) {
    if (!Array.isArray(sumulas) || !jogoId) {
        return null;
    }
    return sumulas.find((item) => item && item.jogoId === jogoId) || null;
}

function getSumulasPorTimeNoJogo(sumulas, jogoId, timeId) {
    const jogoSumula = getSumulaPorJogoId(sumulas, jogoId);
    if (!jogoSumula) {
        return [];
    }

    // Formato data/Sumulas.json:
    // { jogoId, times: [{ timeId, jogadores: [...] }] }
    if (Array.isArray(jogoSumula.times)) {
        const timeNode = jogoSumula.times.find((node) => node && isSameLooseId(node.timeId, timeId));
        return mapSumulaJogadores(timeNode && Array.isArray(timeNode.jogadores) ? timeNode.jogadores : []);
    }

    // Compatibilidade com formato antigo plano:
    // [{ jogoId, timeId, jogadorCpf, nmrCamiseta, stats }]
    return mapSumulaJogadores(sumulas.filter((item) => item.jogoId === jogoId && item.timeId === timeId));
}
