// Recomendações via modelo em Python (Flask) treinado com o histórico no db.sqlite3.
// Objetivo: sugerir itens parecidos (ex.: batata -> batata com cheddar).

const REGS_KEY = 'pedido_ultima_recomendacao_seed';


function safeParseJSON(v, fallback) {
  try {
    return JSON.parse(v);
  } catch {
    return fallback;
  }
}

function getLastPedidoItemKey() {
  const raw = localStorage.getItem('ultimo_item_pedido');
  return raw ? String(raw) : null;
}

function setNewSeed(seed) {
  localStorage.setItem(REGS_KEY, String(seed));
}

function getSeed() {
  const raw = localStorage.getItem(REGS_KEY);
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) ? n : 1;
}

function seededRandom(seed) {
  // LCG simples e determinístico
  let x = seed % 2147483647;
  if (x <= 0) x += 2147483646;
  return function () {
    x = (x * 48271) % 2147483647;
    return x / 2147483647;
  };
}

// Catálogo (mesmas chaves que aparecem na URL do cardápio)
const CAT = [
  { key: 'salada', name: 'Smash Salada', img: 'imagens/salada.png', desc: 'Mais leve e crocante.' },
  { key: 'bacon', name: 'Smash Bacon', img: 'imagens/bacon.jpg', desc: 'Clássico com bacon.' },
  { key: 'xtudo', name: 'Smash Tudo', img: 'imagens/x tudo.jpg', desc: 'O mais completo da casa.' },
  { key: 'duplocheddar', name: 'Combo Duplo Cheddar', img: 'imagens/big cheddar.jpg', desc: 'Duas porções de cheddar.' },
  { key: 'ovo', name: 'Smash Ovo', img: 'imagens/ovo.jpg', desc: 'Sabor marcante e bem diferente.' },
  { key: 'frango', name: 'Smash Frango', img: 'imagens/frango.jpg', desc: 'Frango suculento.' },
  { key: 'frango_cheddar', name: 'Smash Frango com Cheddar', img: 'imagens/Frango com cheddar.jpg', desc: 'Cheddar cremoso.' },
  { key: 'batata', name: 'Batata Frita', img: 'imagens/Batata Frita.jpg', desc: 'Acompanhamento perfeito.' },
  { key: 'batata_cheddar_bacon', name: 'Batata com Cheddar e Bacon', img: 'imagens/Batata frita com cheddar e bacon.jpg', desc: 'Cheddar + bacon irresistível.' },
  { key: 'sprite', name: 'Sprite', img: 'imagens/Sprite.jpg', desc: 'Refrescância gelada.' },
  { key: 'coca', name: 'Coca-Cola', img: 'imagens/Coca.jpg', desc: 'Clássico para acompanhar.' },
  { key: 'fanta', name: 'Fanta', img: 'imagens/Fanta.jpg', desc: 'Frutado e gostoso.' },
];

function scoreByRule(itemKey, candidateKey) {
  // Heurística: se pediu algo, sugerimos "próximos" por similaridade fraca.
  // Isso simula um modelo ML leve (sem backend).
  let score = 0;

  if (!itemKey) {
    // Se não souber o que pediu, pontua aleatório
    return score + 0;
  }

  if (candidateKey === itemKey) return -999;

  const groups = {
    proteinas: new Set(['bacon', 'xtudo', 'duplocheddar', 'ovo', 'frango', 'frango_cheddar']),
    acompanhamentos: new Set(['batata', 'batata_cheddar_bacon', 'salada']),
    bebidas: new Set(['sprite', 'coca', 'fanta']),
  };

  // Se candidato é do mesmo grupo, pontua alto
  for (const g of Object.values(groups)) {
    if (g.has(itemKey) && g.has(candidateKey)) score += 6;
  }

  // Se pediu "xtudo", sugira variações (altas pontuações)
  if (itemKey === 'xtudo') {
    if (['duplocheddar', 'bacon', 'frango_cheddar'].includes(candidateKey)) score += 5;
  }

  // Se pediu salada, sugira mais "pesados"
  if (itemKey === 'salada' && ['bacon', 'xtudo', 'duplocheddar', 'ovo'].includes(candidateKey)) score += 7;

  // Se pediu batata, sugira complementos "cheesy"
  if (itemKey === 'batata' && ['batata_cheddar_bacon', 'duplocheddar', 'frango_cheddar'].includes(candidateKey)) score += 7;

  if (itemKey === 'batata_cheddar_bacon' && ['xtudo', 'duplocheddar', 'bacon'].includes(candidateKey)) score += 7;

  // Pequena pontuação para itens "não-iguais"
  score += 1;

  return score;
}

function buildRecs(count = 4) {
  const lastKey = getLastPedidoItemKey();
  const seed = getSeed();
  const rand = seededRandom(seed);

  // cria lista com score + ruído
  const scored = CAT.map((c) => {
    const base = scoreByRule(lastKey, c.key);
    const noise = rand() * 2; // aleatoriedade controlada
    return { ...c, _score: base + noise };
  })
    .filter((x) => x._score > -100)
    .sort((a, b) => b._score - a._score);

  // remove duplicados e pega topo
  const top = scored.slice(0, count);
  return top;
}

async function renderRecs() {
  const host = document.getElementById('recs');
  if (!host) return;

  const lastKey = getLastPedidoItemKey();

  // fallback: se não souber o item, usa a versão atual baseada em regras
  const fallback = () => {
    const recs = buildRecs(4);
    host.innerHTML = recs
      .map((r) => {
        return `
          <div class="card">
            <a href="finalizarpedido.html?item=${encodeURIComponent(r.key)}">
              <img src="${r.img}" alt="${r.name}">
              <div class="info">
                <div class="name">${r.name}</div>
                <div class="meta">${r.desc}</div>
              </div>
            </a>
          </div>
        `;
      })
      .join('');
  };

  try {
    if (!lastKey) return fallback();

    const url = `http://127.0.0.1:5501/api/recomendacoes?item=${encodeURIComponent(lastKey)}&count=4`;
    const res = await fetch(url);
    if (!res.ok) return fallback();

    const data = await res.json();
    const recs = Array.isArray(data?.recs) ? data.recs : [];
    if (!recs.length) return fallback();

    host.innerHTML = recs
      .map((r) => {
        return `
          <div class="card">
            <a href="finalizarpedido.html?item=${encodeURIComponent(r.key)}">
              <img src="${r.img}" alt="${r.name}">
              <div class="info">
                <div class="name">${r.name}</div>
                <div class="meta">${r.desc}</div>
              </div>
            </a>
          </div>
        `;
      })
      .join('');
  } catch (e) {
    fallback();
  }
}


const btnMais = document.getElementById('btn_mais_sugestoes');
if (btnMais) {
  btnMais.addEventListener('click', () => {
    // Mesmo com backend, mantemos a seed como fallback/variação caso caia no modo regras
    const seed = getSeed();
    setNewSeed(seed + 1);
    renderRecs();
  });
}

// init
renderRecs();


