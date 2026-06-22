# Hamburgueria (Smash) — Catálogo + Recomendações

Projeto de hamburgueria com **frontend em HTML/CSS/JS** e **backend Flask** que fornece **recomendações de itens** com base no histórico salvo em um `db.sqlite3`.

A recomendação é uma combinação de:
- **Backend (ML leve)**: similaridade **item-a-item** treinada a partir da tabela `pedidos`.
- **Frontend (fallback)**: caso o backend não responda, o frontend usa **heurísticas** para sugerir itens.

---

## 1) Como o fluxo funciona (visão do usuário)

1. O usuário entra no **Cardápio** (`cardapio.html`).
2. Ao clicar em **“Pedir Agora”**, o usuário é direcionado para:
   - `finalizarpedido.html?item=<key>`
3. Na tela de finalizar pedido, o JS tenta obter sugestões chamando:
   - `GET /api/recomendacoes?item=<key>&count=4`
4. Se a chamada falhar (backend offline, item desconhecido, banco vazio, etc.), o frontend exibe sugestões via fallback.
5. O botão “mais sugestões” muda a seed local e renderiza novamente.

---

## 2) Tecnologias

- **Frontend**: HTML, CSS, JavaScript (sem build step)
- **Backend**: Flask
- **ML**: scikit-learn (TF-IDF + cosseno) + fallback por co-ocorrência
- **Deploy**: Gunicorn (via `Procfile`)

---

## 3) Pré-requisitos

- Python 3.x
- Um arquivo **`db.sqlite3`** na **raiz do projeto** (mesmo nível do `/app`).

> Se o `db.sqlite3` não existir ou estiver vazio, o backend retorna um modelo vazio; o frontend deve funcionar usando fallback.

---

## 4) Dependências

As bibliotecas estão em `requirements.txt`.

---

## 5) Como rodar localmente

### Passo a passo

1. Instale dependências:

```bash
pip install -r requirements.txt
```

2. Inicie o servidor:

```bash
python app/app.py
```

3. Abra no navegador:

- `http://127.0.0.1:5501/`

> A porta pode ser sobrescrita pela variável de ambiente `PORT`. O padrão é **5501**.

---

## 6) API do backend (endpoints)

Base URL:
- `http://127.0.0.1:5501`

### 6.1) Recomendações

**GET** `/api/recomendacoes?item=<chave>&count=4`

- `item` (string): chave do item selecionado (ex.: `salada`, `batata`, `xtudo`, `batata_cheddar_bacon`, etc.)
- `count` (int): quantas recomendações retornar (backend limita entre 1 e 10; padrão 4)

**Resposta (JSON)**:

```json
{
  "item": "batata",
  "recs": [
    {
      "key": "batata_cheddar_bacon",
      "name": "Batata com Cheddar e Bacon",
      "img": "imagens/Batata frita com cheddar e bacon.jpg",
      "desc": "Cheddar + bacon irresistível."
    }
  ]
}
```

Exemplo via curl:

```bash
curl "http://127.0.0.1:5501/api/recomendacoes?item=batata&count=4"
```

---

### 6.2) Treinar novamente (manual)

**POST** `/api/recomendacoes/train`

Recarrega/treina o modelo com base no `db.sqlite3`.

Resposta:

```json
{ "status": "ok" }
```

---

### 6.3) Debug

**GET** `/debug`

Retorna informações simples para diagnóstico (ex.: lista de arquivos no diretório raiz usada pelo backend).

---

## 7) Como o backend aprende (db.sqlite3)

O backend lê a tabela:
- `pedidos`

E especificamente a coluna:
- `itens_json`

### Formato esperado de `itens_json`

- Deve ser um JSON **string** que representa uma lista de itens.
- Cada item é um objeto com, pelo menos:
  - `key` (string): chave do item
- Opcionalmente pode ter:
  - `quantidade` (número): se existir, influencia a multiplicidade usada no treino

Exemplo (ilustrativo):

```json
[
  {"key": "batata", "quantidade": 1},
  {"key": "coca", "quantidade": 1},
  {"key": "xtudo", "quantidade": 1}
]
```

> Observação: se `itens_json` estiver vazio, inválido ou a chave `key` não existir, aquele pedido é ignorado para a transação.

---

## 8) Como o modelo de recomendação funciona (ML)

Código: `app/ml_recommender.py`

### 8.1) Treino por similaridade (TF-IDF + cosseno)

1. Cada pedido vira um “documento”.
2. Os itens (`key`) do pedido viram **tokens** (um token por item; se houver `quantidade`, o token é repetido).
3. O modelo treina com **TF-IDF** e calcula similaridade **por cosseno** entre itens.
4. Gera um dicionário de scores do tipo:
   - `pair_scores[item_a][item_b] = score`

### 8.2) Fallback (co-ocorrência)

Se o TF-IDF não gerar resultados ou der erro, o backend usa fallback:
- Conta co-ocorrências: itens que aparecem juntos em pedidos são recomendados.
- Normaliza pelo total do item `a` para reduzir viés.

---

## 9) Como o frontend escolhe recomendações (fallback incluso)

Código principal: `pedido_finalizado.js`

### 9.1) Quando o backend funciona

- O JS chama a API em `http://127.0.0.1:5501/api/recomendacoes` usando a `item` que veio da URL.
- Renderiza cards com `img`, `name` e `desc` retornados pelo backend.

### 9.2) Quando o backend falha

Se a requisição falhar ou vier vazio, o frontend chama uma função local que:
- Usa as chaves do catálogo em `CAT`
- Calcula score por **regras/heurísticas** (ex.: `batata` sugere complementos “cheesy”)
- Ordena e renderiza sugestões

### 9.3) “Mais sugestões”

- Um seed é guardado em `localStorage`.
- O botão aumenta a seed e re-renderiza para variar o resultado (mesmo no modo fallback).

---

## 10) Catálogo e chaves (`key`)

As chaves (`key`) usadas no frontend e no backend devem bater.

- No `cardapio.html`, os links geram:
  - `finalizarpedido.html?item=<key>`

- No backend, o catálogo é definido em `app/app.py` (lista `CATALOG`).

Se uma `key` existir no frontend mas não existir no catálogo do backend, a API pode retornar menos/nenhuma sugestão.

---

## 11) Deploy (Gunicorn)

O `Procfile` define:

```txt
web: gunicorn --chdir app app:app
```

Ou seja:
- `--chdir app` muda o diretório para onde o Gunicorn procura o módulo
- `app:app` referencia `app.py` e a variável `app` (Flask instance)

---

## 12) Troubleshooting (problemas comuns)

### “db.sqlite3 não existe”
- Garanta que existe `db.sqlite3` na **raiz do projeto**.
- Se faltar, o backend tentará carregar transações e poderá falhar; nesse caso, o frontend deve cair para fallback.

### “Não aparece recomendação”
- Verifique se a `key` enviada na URL existe no catálogo do backend.
- Confira se `pedidos.itens_json` tem dados válidos (JSON com objetos contendo `key`).

### “Endpoint não responde / porta errada”
- Confirme a porta do Flask (padrão: 5501).
- Se estiver em ambiente diferente, ajuste `PORT` e/ou revise as URLs no frontend (hoje está hardcoded para `127.0.0.1:5501`).

---

## Estrutura do projeto (principais arquivos)

- `home.html`, `cardapio.html`, `finalizarpedido.html`, `pedido_finalizado.html` (páginas)
- `*.css`, `*.js` (estilos e lógica do frontend)
- `app/app.py` (Flask + rotas)
- `app/ml_recommender.py` (modelo e recomendação)
- `db.sqlite3` (banco de pedidos)
- `Procfile` (Gunicorn)

---

Se quiser, também posso adaptar este README para incluir o **schema real do banco** (CREATE TABLE) caso você tenha um exemplo do `db.sqlite3` ou consiga colar o conteúdo/estrutura da tabela `pedidos`.
