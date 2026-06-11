const urlParams = new URLSearchParams(window.location.search);
const item = urlParams.get("item");
const tituloElement = document.getElementById("titulo");
const fotoElement = document.getElementById("foto");
const precoElement = document.getElementById("preco");
const descricaoElement = document.getElementById("descricao");
const finalizarElement = document.getElementById("finalizar");

// VARIÁVEL DE CONTROLE: Verifica se o item da URL é válido
let temItemValido = false;

if (item === "salada") {
  temItemValido = true;
  tituloElement.textContent = "Smash Salada";
  fotoElement.src = "imagens/salada.png";
  precoElement.textContent = "R$ 20,90";
  descricaoElement.textContent = "Pão, blend de 150 gramas, alface, tomate, picles, queijo cheddar e molho especial.";
} else if (item === "xtudo") {
  temItemValido = true;
  tituloElement.textContent = "Smash Tudo";
  fotoElement.src = "imagens/x tudo.jpg";
  precoElement.textContent = "R$ 33,90";
  descricaoElement.textContent = "Pão, 3 blends de 150 gramas, queijo cheddar, alface, picles, bacon, batata frita e tomate.";
} else if (item === "bacon") {
  temItemValido = true;
  tituloElement.textContent = "Smash Bacon";
  fotoElement.src = "imagens/bacon.jpg";
  precoElement.textContent = "R$ 27,90";
  descricaoElement.textContent = "Pão, blend de 150 gramas, queijo cheddar e bacon.";
} else if (item === "duplocheddar") {
  temItemValido = true;
  tituloElement.textContent = "Combo Smash Duplo Cheddar ";
  fotoElement.src = "imagens/big cheddar.jpg";
  precoElement.textContent = "R$ 54,90";
  descricaoElement.textContent = "Pão, 2 blend de 150 gramas, queijo cheddar, bacon e batata frita";
} else if (item === "ovo") {
  temItemValido = true;
  tituloElement.textContent = "Smash Ovo";
  fotoElement.src = "imagens/ovo.jpg";
  precoElement.textContent = "R$ 23,90";
  descricaoElement.textContent = "Pão, blend de 150 gramas, queijo cheddar, bacon, alface, ovo e molho especial.";
} else if (item === "frango") {
  temItemValido = true;
  tituloElement.textContent = "Smash Frango";
  fotoElement.src = "imagens/frango.jpg";
  precoElement.textContent = "R$ 20,90";
  descricaoElement.textContent = "Pão, frango, molho especial e picles.";
}
else if (item === "frango_cheddar"){
  temItemValido = true;
  tituloElement.textContent = "Smash Frango com Cheddar";
  fotoElement.src = "imagens/Frango com cheddar.jpg";
  precoElement.textContent = "R$ 24,90";
  descricaoElement.textContent = "Pão, frango, cheddar, alface e picles ";
}
else if (item === "batata"){
  temItemValido = true;
  tituloElement.textContent = "Batata Frita";
  fotoElement.src = "imagens/Batata Frita.jpg";
  precoElement.textContent = "R$ 10,90";
  descricaoElement.textContent = "Porção de batata frita";
}
else if (item === "batata_cheddar_bacon"){
  temItemValido = true;
  tituloElement.textContent = "Batata com Cheddar e bacon";
  fotoElement.src = "imagens/Batata frita com cheddar e bacon.jpg";
  precoElement.textContent = "R$ 18,90";
  descricaoElement.textContent = "Porção de batata frita com cheddar e bacon";
}
else if (item === "sprite"){
  temItemValido = true;
  tituloElement.textContent = "Sprite";
  fotoElement.src = "imagens/Sprite.jpg";
  precoElement.textContent = "R$ 3,49";
  descricaoElement.textContent = "Sprite de 350ml";
}
else if (item === "coca"){
  temItemValido = true;
  tituloElement.textContent = "Coca-Cola";
  fotoElement.src = "imagens/Coca.jpg";
  precoElement.textContent = "R$ 4,49";
  descricaoElement.textContent = "Coca de 350ml";
}
else if (item === "fanta"){
  temItemValido = true;
  tituloElement.textContent = "Fanta";
  fotoElement.src = "imagens/Fanta.jpg";
  precoElement.textContent = "R$ 2,99";
  descricaoElement.textContent = "Fanta de 350ml";
}

let quantidade = 1;
let precoUnitario = 0;

// pega o preço do texto (R$ 27,90 → 27.90)
function pegarPreco() {
  // SÓ tenta ler o preço se houver um item válido na tela
  if (!temItemValido || !precoElement) return;
  let texto = precoElement.textContent;
  precoUnitario = parseFloat(texto.replace("R$", "").replace(",", "."));
}

// atualiza quantidade e preço
function atualizar() {
  const qtdEl = document.getElementById("quantidade");
  if (qtdEl) qtdEl.innerText = quantidade;

  if (temItemValido && precoElement) {
    let total = quantidade * precoUnitario;
    precoElement.innerText = "R$ " + total.toFixed(2).replace(".", ",");
  }
}

// botão +
function aumentar() {
  if (quantidade < 10) {
    quantidade++;
    atualizar();
  }
}

// botão -
function diminuir() {
  if (quantidade > 1) {
    quantidade--;
    atualizar();
  }
}

// inicia preenchimento do item do topo (se houver)
pegarPreco();
atualizar();

// Se NÃO houver item na URL, esconde a seção de detalhes do produto para não exibir campos vazios/quebrados
if (!temItemValido) {
  // Substitua '.container-detalhes' pela classe ou ID da div que engloba a foto/preço/botão de adicionar do topo
  const containerProduto = document.querySelector(".detalhes-produto") || document.getElementById("produto-secao");
  if (containerProduto) {
    containerProduto.style.display = "none"; 
  }
}

const CHAVE_CARRINHO = "carrinho";

function lerCarrinho() {
  try {
    const raw = localStorage.getItem(CHAVE_CARRINHO);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function salvarCarrinho(itens) {
  localStorage.setItem(CHAVE_CARRINHO, JSON.stringify(itens));
}

function somarQuantidade(itens) {
  return itens.reduce((acc, it) => acc + (Number(it.quantidade) || 0), 0);
}

function extrairItemAtual() {
  if (!temItemValido) return null; // Proteção para não extrair dados inexistentes

  const titulo = tituloElement.textContent.trim();
  const foto = fotoElement.getAttribute("src");
  const precoUnitarioLocal = precoUnitario;
  const nomeChave = item;

  return {
    key: nomeChave,
    titulo,
    imagem: foto,
    precoUnitario: precoUnitarioLocal,
    quantidade,
  };
}

function formatarPrecoBR(valor) {
  return "R$ " + Number(valor).toFixed(2).replace(".", ",");
}

function atualizarBadge() {
  const badge = document.getElementById("notificacao");
  if (!badge) return;

  const carrinho = lerCarrinho();
  const total = somarQuantidade(carrinho);

  badge.innerText = total;
  badge.style.display = total > 0 ? "block" : "none";
}

function renderizarCarrinho() {
  const itensEl = document.getElementById("itens_carrinho");
  const totalEl = document.getElementById("total_carrinho");
  if (!itensEl || !totalEl) return;

  const carrinho = lerCarrinho();

  if (!carrinho.length) {
    itensEl.innerHTML = '<p style="color:white; font-family: Montserrat, cursive;">Seu carrinho está vazio.</p>';
    totalEl.textContent = "R$ 0,00";
  } else {
    const itensHTML = carrinho
      .map((it) => {
        const subtotal = (Number(it.precoUnitario) || 0) * (Number(it.quantidade) || 0);
        return `
          <div class="item-no-carrinho" data-key="${it.key}">
            <div class="info-item">
              <p style="font-weight:700;">${it.titulo}</p>
              <div class="qtd_controls">
                <button type="button" class="btn_qtd" data-action="diminuir" aria-label="Diminuir">−</button>
                <span class="qtd_num" aria-label="Quantidade">${it.quantidade}</span>
                <button type="button" class="btn_qtd" data-action="aumentar" aria-label="Aumentar">+</button>
              </div>
              <p>${formatarPrecoBR(subtotal)}</p>
            </div>
            <button type="button" class="btn_remover" aria-label="Remover">Remover</button>
          </div>
        `;
      })
      .join("");

    itensEl.innerHTML = itensHTML;

    const total = carrinho.reduce((acc, it) => {
      return acc + (Number(it.precoUnitario) || 0) * (Number(it.quantidade) || 0);
    }, 0);

    totalEl.textContent = formatarPrecoBR(total);

    // delegação de evento para remover
    itensEl.querySelectorAll(".btn_remover").forEach((btn) => {
      btn.addEventListener("click", () => {
        const wrapper = btn.closest(".item-no-carrinho");
        const key = wrapper ? wrapper.getAttribute("data-key") : null;
        if (!key) return;

        const atual = lerCarrinho();
        const atualizado = atual.filter((x) => String(x.key) !== String(key));
        salvarCarrinho(atualizado);
        atualizarBadge();
        renderizarCarrinho();
      });
    });

    // Ajustar quantidade por item (+/-)
    itensEl.querySelectorAll(".btn_qtd").forEach((btn) => {
      btn.addEventListener("click", () => {
        const wrapper = btn.closest(".item-no-carrinho");
        const key = wrapper ? wrapper.getAttribute("data-key") : null;
        if (!key) return;

        const action = btn.getAttribute("data-action");
        const delta = action === "aumentar" ? 1 : -1;

        const atual = lerCarrinho();
        const idx = atual.findIndex((x) => String(x.key) === String(key));
        if (idx < 0) return;

        const qtdAtual = Number(atual[idx].quantidade) || 0;
        const novaQtd = qtdAtual + delta;

        if (novaQtd <= 0) {
          const atualizado = atual.filter((x) => String(x.key) !== String(key));
          salvarCarrinho(atualizado);
        } else {
          atual[idx].quantidade = novaQtd;
          salvarCarrinho(atual);
        }

        atualizarBadge();
        renderizarCarrinho();
      });
    });
  }
}

function adicionarAoCarrinho() {
  const novoItem = extrairItemAtual();
  
  // BLOQUEIO: Se tentarem adicionar sem ter um item selecionado na URL, cancela a operação
  if (!novoItem || !novoItem.key) return; 

  const carrinho = lerCarrinho();
  const idx = carrinho.findIndex((x) => String(x.key) === String(novoItem.key));
  
  if (idx >= 0) {
    carrinho[idx].quantidade = (Number(carrinho[idx].quantidade) || 0) + (Number(novoItem.quantidade) || 0);
  } else {
    carrinho.push(novoItem);
  }

  salvarCarrinho(carrinho);
  atualizarBadge();
  renderizarCarrinho();

  // Reseta a quantidade da página para 1 após adicionar
  quantidade = 1;
  atualizar();
}

// Abre/fecha modal
const modal = document.getElementById("modal_carrinho");
const abrirModalLink = document.getElementById("abrir_modal_carrinho");
const fecharModalBtn = document.getElementById("fechar_modal");

if (modal) {
  modal.classList.remove("aberto");
  modal.setAttribute("aria-hidden", "true");
}

if (abrirModalLink && modal) {
  abrirModalLink.addEventListener("click", (e) => {
    e.preventDefault();
    modal.classList.add("aberto");
    modal.setAttribute("aria-hidden", "false");
    renderizarCarrinho();
  });
}

if (fecharModalBtn && modal) {
  fecharModalBtn.addEventListener("click", () => {
    modal.classList.remove("aberto");
    modal.setAttribute("aria-hidden", "true");
  });
}

// Configurar o botão para chamar essa função
if (finalizarElement) {
  finalizarElement.addEventListener("click", function (event) {
    event.preventDefault();
    adicionarAoCarrinho();
  });
}

// Notificação ao finalizar pedido (botão #finalizar_pedido)
const finalizarPedidoElement = document.getElementById("finalizar_pedido");
function mostrarToastPedido(mensagem) {
  const toast = document.getElementById("toast_pedido");
  if (!toast) return;
  toast.textContent = mensagem;
  toast.classList.add("show");
  toast.setAttribute("aria-hidden", "false");
  // não remove automaticamente para não parecer “sumir” se houver recarregamento/atualização visual
  // (você pode remover se quiser manter o timeout)
}

async function enviarPedidoParaBackend({ nome, whatsapp, itens }) {
  const res = await fetch("http://127.0.0.1:5501/api/pedidos", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ nome, whatsapp, itens }),
  });

  if (!res.ok) {
    let msg = "Erro ao salvar pedido";
    try {
      const data = await res.json();
      if (data && data.error) msg = data.error;
    } catch (e) {
      // ignore
    }
    throw new Error(msg);
  }

  return res.json().catch(() => ({}));
}

if (finalizarPedidoElement) {
  finalizarPedidoElement.addEventListener("click", async (event) => {
    event.preventDefault();
    event.stopPropagation();

    const nomeEl = document.getElementById("nome");
    const whatsappEl = document.getElementById("whatsapp");

    const nome = (nomeEl?.value || "").trim();
    const whatsapp = (whatsappEl?.value || "").replace(/\D/g, "").slice(0, 11);

    if (!nome) {
      mostrarToastPedido("Preencha seu nome.");
      return;
    }

    if (!whatsapp || whatsapp.length < 10) {
      mostrarToastPedido("Preencha um WhatsApp válido.");
      return;
    }

    const itens = lerCarrinho();
    if (!itens.length) {
      mostrarToastPedido("Seu carrinho está vazio.");
      return;
    }

    // Não dependa do backend para finalizar (evita erro 405 quando POST não está habilitado).
    // limpa carrinho após finalizar
    salvarCarrinho([]);
    atualizarBadge();
    renderizarCarrinho();

    // redireciona para a página de sucesso
    mostrarToastPedido("Pedido finalizado!");
    window.location.href = "pedido_finalizado.html";
  });
}

// Limpar carrinho
const limparCarrinhoBtn = document.getElementById("limpar_carrinho");
if (limparCarrinhoBtn) {
  limparCarrinhoBtn.addEventListener("click", (e) => {
    e.preventDefault();
    salvarCarrinho([]);
    atualizarBadge();
    renderizarCarrinho();
  });
}

// Limitar entrada do WhatsApp para ficar com no máximo 11 dígitos (DDD + número)
const whatsappInput = document.getElementById("whatsapp");
if (whatsappInput) {
  const limitar = () => {
    const digits = (whatsappInput.value || "").replace(/\D/g, "");
    whatsappInput.value = digits.slice(0, 11);
  };

  whatsappInput.addEventListener("input", limitar);
  whatsappInput.addEventListener("paste", () => {
    setTimeout(limitar, 0);
  });
}

// Inicialização global da página
atualizarBadge();
renderizarCarrinho();

