const urlParams = new URLSearchParams(window.location.search);
const item = urlParams.get("item");
const tituloElement = document.getElementById("titulo");
const fotoElement = document.getElementById("foto");
const precoElement = document.getElementById("preco");
const descricaoElement = document.getElementById("descricao");
const finalizarElement = document.getElementById("finalizar");

if (item === "salada") {
  tituloElement.textContent = "Smash Salada";
  fotoElement.src = "imagens/salada.png";
  precoElement.textContent = "R$ 20,90";
  descricaoElement.textContent =
    "Pão, blend de 150 gramas, alface, tomate, picles, queijo cheddar e molho especial.";
} else if (item === "xtudo") {
  tituloElement.textContent = "Smash Tudo";
  fotoElement.src = "imagens/x tudo.jpg";
  precoElement.textContent = "R$ 33,90";
  descricaoElement.textContent =
    "Pão, 3 blends de 150 gramas, queijo cheddar, alface, picles, bacon, batata frita e tomate.";
} else if (item === "bacon") {
  tituloElement.textContent = "Smash Bacon";
  fotoElement.src = "imagens/bacon.jpg";
  precoElement.textContent = "R$ 27,90";
  descricaoElement.textContent =
    "Pão, blend de 150 gramas, queijo cheddar e bacon.";
} else if (item === "duplocheddar") {
  tituloElement.textContent = "Combo Smash Duplo Cheddar ";
  fotoElement.src = "imagens/big cheddar.jpg";
  precoElement.textContent = "R$ 54,90";
  descricaoElement.textContent =
    "Pão, 2 blend de 150 gramas, queijo cheddar, bacon e batata frita";
} else if (item === "ovo") {
  tituloElement.textContent = "Smash Ovo";
  fotoElement.src = "imagens/ovo.jpg";
  precoElement.textContent = "R$ 23,90";
  descricaoElement.textContent =
    "Pão, blend de 150 gramas, queijo cheddar, bacon, alface, ovo e molho especial.";
} else if (item === "frango") {
  tituloElement.textContent = "Smash Frango";
  fotoElement.src = "imagens/frango.jpg";
  precoElement.textContent = "R$ 20,90";
  descricaoElement.textContent = "Pão, frango, molho especial e picles.";
}
let quantidade = 1;
let precoUnitario = 0;

// pega o preço do texto (R$ 27,90 → 27.90)
function pegarPreco() {
  let texto = precoElement.textContent;
  precoUnitario = parseFloat(texto.replace("R$", "").replace(",", "."));
}

// atualiza quantidade e preço
function atualizar() {
  document.getElementById("quantidade").innerText = quantidade;

  let total = quantidade * precoUnitario;

  precoElement.innerText = "R$ " + total.toFixed(2).replace(".", ",");
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


// inicia
pegarPreco();
atualizar();

let totalItensNoCarrinho = 0;

function adicionarAoCarrinho() {
    // 1. Soma a quantidade selecionada ao total global
    totalItensNoCarrinho += quantidade;

    // 2. Pega o elemento do badge
    const badge = document.getElementById("notificacao");

    // 3. Atualiza o texto e mostra a bolinha
    badge.innerText = totalItensNoCarrinho;
    badge.style.display = "block";

    // Opcional: Feedback visual de que funcionou
    alert(quantidade + " item(ns) adicionado(s) ao carrinho!");
    
    // Reseta a quantidade da página para 1 após adicionar
    quantidade = 1;
    atualizar();
}

// Configurar o botão para chamar essa função
document.getElementById("finalizar").addEventListener("click", function(event) {
    event.preventDefault(); // Evita que o link tente navegar
    adicionarAoCarrinho();
});

