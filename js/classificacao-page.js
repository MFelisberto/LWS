function saldoClass(value) {
    if (value > 0) {
        return "saldo positivo";
    }
    if (value < 0) {
        return "saldo negativo";
    }
    return "saldo";
}

function formatSaldo(value) {
    return value > 0 ? `+${value}` : String(value);
}

function rowClassByPosition(position) {
    if (position === 1) {
        return "standing-row gold";
    }
    if (position === 2) {
        return "standing-row silver";
    }
    if (position === 3) {
        return "standing-row bronze";
    }
    return "standing-row";
}

function renderTableRows(rows) {
    return rows
        .map((row, idx) => {
            const position = idx + 1;
            return `
                <tr class="${rowClassByPosition(position)}">
                    <td class="position">${position}</td>
                    <td class="team-name">${row.equipe}</td>
                    <td class="stat col-jogos">${row.jogos}</td>
                    <td class="stat col-vitorias">${row.vitorias}</td>
                    <td class="stat col-derrotas">${row.derrotas}</td>
                    <td class="stat points col-pontos">${row.pontos}</td>
                    <td class="stat col-saldo ${saldoClass(row.saldo)}">${formatSaldo(row.saldo)}</td>
                </tr>
            `;
        })
        .join("");
}

async function initClassificacaoPage() {
    const { times, jogos } = await loadCampeonatoData();
    const grouped = computeClassificacao(times, jogos);
    const container = document.getElementById("classificationContainer");
    const grupos = Object.keys(grouped).sort();

    container.innerHTML = grupos
        .map((grupo) => `
            <h2 class="group-title">${grupo}</h2>
            <div class="standings-scroll" role="region" aria-label="Tabela de classificação ${grupo}">
                <table class="standings-table">
                    <thead>
                        <tr>
                            <th class="position">#</th>
                            <th class="team-name">Equipe</th>
                            <th class="stat col-jogos">Jogos</th>
                            <th class="stat col-vitorias">Vitórias</th>
                            <th class="stat col-derrotas">Derrotas</th>
                            <th class="stat col-pontos">Pontos</th>
                            <th class="stat col-saldo">Saldo Pts</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${renderTableRows(grouped[grupo])}
                    </tbody>
                </table>
            </div>
        `)
        .join("");
}

initClassificacaoPage().catch((error) => {
    console.error(error);
    document.getElementById("classificationContainer").innerHTML = "<p style='color:#fff'>Erro ao carregar classificação. Verifique os JSONs da pasta data.</p>";
});
