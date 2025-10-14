let filmes = [];
    let minMax = {
      ano: {min: Infinity, max: -Infinity},
      duracao: {min: Infinity, max: -Infinity},
      avaliacao: {min: Infinity, max: -Infinity},
      numAvaliacoes: {min: Infinity, max: -Infinity}
    };

    const pesos = {
      genero: 0.4,
      ano: 0.2,
      duracao: 0.1,
      avaliacao: 0.2,
      numAvaliacoes: 0.1
    };

    function simGenero(g1, g2) {
      if (!g1 || !g2) return 0;
      const a = g1.toLowerCase().split(',').map(x => x.trim());
      const b = g2.toLowerCase().split(',').map(x => x.trim());
      const inter = a.filter(x => b.includes(x));
      if (inter.length > 0) return 1;
      if (a.some(x => b.some(y => y.includes(x)))) return 0.6;
      return 0;
    }

    function simNum(v1, v2, min, max) {
      if (max === min) return 1;
      const n1 = (v1 - min) / (max - min);
      const n2 = (v2 - min) / (max - min);
      return 1 - Math.abs(n1 - n2);
    }

    function simGlobal(f, entrada) {
      return (
        simGenero(entrada.genero, f.genero) * pesos.genero +
        simNum(entrada.ano, f.ano, minMax.ano.min, minMax.ano.max) * pesos.ano +
        simNum(entrada.duracao, f.duracao, minMax.duracao.min, minMax.duracao.max) * pesos.duracao +
        simNum(entrada.avaliacao, f.avaliacao, minMax.avaliacao.min, minMax.avaliacao.max) * pesos.avaliacao +
        simNum(entrada.numAvaliacoes, f.numAvaliacoes, minMax.numAvaliacoes.min, minMax.numAvaliacoes.max) * pesos.numAvaliacoes
      );
    }

    function topSimilares(entrada, topN = 5, excluirTitulo = "") {
      const lista = filmes
        .filter(f => f.titulo !== excluirTitulo)
        .map(f => ({
          filme: f,
          sim: simGlobal(f, entrada)
        }));
      lista.sort((a, b) => b.sim - a.sim);
      return lista.slice(0, topN);
    }

    document.getElementById("upload-csv").addEventListener("change", e => {
      const file = e.target.files[0];
      if (!file) return;

      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: results => {
          filmes = results.data.map(f => {
            let generos = "";
            try {
              const parsed = JSON.parse(f.genres);
              if (Array.isArray(parsed)) {
                generos = parsed.map(g => g.name).join(", ");
              } else {
                generos = String(f.genres);
              }
            } catch {
              generos = String(f.genres || "").replace(/[\[\]{}"]/g, "");
            }

            return {
              titulo: f.title || '',
              genero: generos.toLowerCase(),
              ano: f.release_date ? new Date(f.release_date).getFullYear() : 0,
              duracao: Number(f.runtime) || 0,
              avaliacao: Number(f.vote_average) || 0,
              numAvaliacoes: Number(f.vote_count) || 0
            };
          }).filter(f => f.titulo && f.genero);

          filmes.forEach(f => {
            minMax.ano.min = Math.min(minMax.ano.min, f.ano);
            minMax.ano.max = Math.max(minMax.ano.max, f.ano);
            minMax.duracao.min = Math.min(minMax.duracao.min, f.duracao);
            minMax.duracao.max = Math.max(minMax.duracao.max, f.duracao);
            minMax.avaliacao.min = Math.min(minMax.avaliacao.min, f.avaliacao);
            minMax.avaliacao.max = Math.max(minMax.avaliacao.max, f.avaliacao);
            minMax.numAvaliacoes.min = Math.min(minMax.numAvaliacoes.min, f.numAvaliacoes);
            minMax.numAvaliacoes.max = Math.max(minMax.numAvaliacoes.max, f.numAvaliacoes);
          });

          localStorage.setItem('filmesCSV', JSON.stringify(filmes));
          localStorage.setItem('minMaxCSV', JSON.stringify(minMax));
          document.getElementById("entrada").style.display = "block";
          alert(`Base carregada (${filmes.length} filmes). Dados salvos localmente!`);
        }
      });
    });

    // NOVA EXIBIÇÃO EM CARDS
    document.getElementById("buscar").addEventListener("click", () => {
      if (filmes.length === 0 && localStorage.getItem("filmesCSV")) {
        filmes = JSON.parse(localStorage.getItem("filmesCSV"));
        minMax = JSON.parse(localStorage.getItem("minMaxCSV"));
      }

      const entrada = {
        genero: document.getElementById("genero").value,
        ano: Number(document.getElementById("ano").value),
        duracao: Number(document.getElementById("duracao").value),
        avaliacao: Number(document.getElementById("avaliacao").value),
        numAvaliacoes: Number(document.getElementById("numAvaliacoes").value)
      };

      const divRes = document.getElementById("resultados");
      divRes.innerHTML = "";
      divRes.className = "grupo-resultado";

      const top3 = topSimilares(entrada, 3);

      top3.forEach((item, i) => {
        const card = document.createElement("div");
        card.className = "card-filme";

        card.innerHTML = `
          <h3>🎞️ ${item.filme.titulo}</h3>
          <div class="info-filme">
            <strong>Similaridade:</strong> ${(item.sim * 100).toFixed(2)}%<br>
            🎭 ${item.filme.genero}<br>
            📅 ${item.filme.ano} | ⭐ ${item.filme.avaliacao}
          </div>
          <div class="similares">
            <h4>TOP 5 Similares</h4>
            <ul id="similares-${i}"></ul>
          </div>
        `;

        const similares5 = topSimilares(item.filme, 5, item.filme.titulo);
        const ul = card.querySelector(`#similares-${i}`);

        similares5.forEach(s => {
          const li = document.createElement("li");
          li.innerHTML = `
            <strong>${s.filme.titulo}</strong>
            <span>🎭 ${s.filme.genero}</span>
            <span>📅 ${s.filme.ano} | ⭐ ${s.filme.avaliacao}</span>
            <span>💡 ${(s.sim * 100).toFixed(2)}%</span>
          `;
          ul.appendChild(li);
        });

        divRes.appendChild(card);
      });
    });