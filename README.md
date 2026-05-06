# 🏀 Liga Will Sports 🏀

## Sobre este projeto
- **Objetivo**: transformar arquivos JSON (rodadas, jogos, times e súmulas) em páginas navegáveis e fáceis de consultar.
- **O que foi praticado**:
  - **HTML/CSS**: layout, responsividade e organização das telas
  - **JavaScript (Vanilla)**: manipulação do DOM, componentização “na unha”, navegação via querystring
  - **Dados em JSON**: leitura, validação e normalização de formatos diferentes
  - **Deploy**: publicação em **GitHub Pages**

## Acesso (GitHub Pages)

- **Site**: [https://mfelisberto.github.io/LWS/](https://mfelisberto.github.io/LWS/)

## Rodando localmente

Como o projeto carrega dados via `fetch()` (arquivos JSON), é recomendado servir via HTTP (e não abrir o HTML direto pelo `file://`).

- **Opção 1 (VS Code / Live Server)**:
  - Abra a pasta do projeto e use a extensão **Live Server** em `index.html`.

- **Opção 2 (qualquer servidor estático)**:
  - Sirva a pasta raiz com um servidor HTTP simples (ex.: qualquer “static server”).

## Estrutura do projeto

- **Páginas**
  - `index.html`: página principal (rodadas/jogos)
  - `classificacao.html`: classificação por grupos
  - `jogostats.html`: estatísticas/súmulas por jogo

- **Scripts**
  - `js/data-loader.js`: carrega e normaliza os dados do campeonato (JSON)
  - `js/index-page.js`: renderização da página inicial
  - `js/classificacao-page.js`: renderização da classificação
  - `js/jogostats-page.js`: renderização das estatísticas/súmulas do jogo

- **Dados (`data/`)**
  - `rodadas.json`
  - `jogos.json`
  - `times.json`
  - `Sumulas.json` (súmulas/estatísticas)

- **Estilos**
  - `styles/`
