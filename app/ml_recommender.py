import json
import os
import sqlite3
from collections import defaultdict
from dataclasses import dataclass
from typing import Dict, Iterable, List, Optional, Tuple

# Biblioteca ML
# (instalar via requirements.txt: scikit-learn)
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


@dataclass
class AssocModel:
    # Item-to-item similaridade (cosine) com TF-IDF
    # pair_scores[a][b] = score
    pair_scores: Dict[str, Dict[str, float]]


def _normalize_key(k: str) -> str:
    return (k or "").strip()


def load_orders_from_sqlite(db_path: str) -> List[List[str]]:
    """Retorna transações como lista de chaves de itens.

    Cada transação vem da tabela `pedidos` e da coluna `itens_json`.
    """
    if not os.path.exists(db_path):
        raise FileNotFoundError(db_path)

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    rows = cur.execute(
        "SELECT itens_json FROM pedidos WHERE itens_json IS NOT NULL AND itens_json != ''"
    ).fetchall()

    transactions: List[List[str]] = []
    for (itens_json,) in rows:
        try:
            items = json.loads(itens_json)
        except Exception:
            continue

        keys: List[str] = []
        if isinstance(items, list):
            for it in items:
                if isinstance(it, dict) and it.get("key") is not None:
                    key = _normalize_key(str(it.get("key")))
                    if key:
                        # multiplicidade por quantidade (se existir)
                        qtd = it.get("quantidade", 1)
                        try:
                            qtd_n = int(float(qtd))
                        except Exception:
                            qtd_n = 1
                        qtd_n = max(1, qtd_n)
                        keys.extend([key] * qtd_n)

        if keys:
            transactions.append(keys)

    conn.close()
    return transactions


def _transactions_to_documents(transactions: List[List[str]]) -> List[str]:
    # TF-IDF funciona melhor com "documentos"; aqui cada pedido é um documento.
    # Representamos itens como tokens separados por espaço: "batata cheddar bacon".
    return [" ".join(tx) for tx in transactions]


def train_item_to_item_tfidf(transactions: List[List[str]]) -> AssocModel:
    """Treina similaridade item-a-item usando TF-IDF + cosseno.

    Abordagem:
    - cada pedido vira um documento com tokens = itens
    - calculamos TF-IDF por token (item)
    - convertemos embeddings de item a partir da matriz TF-IDF por termos
    - score(a,b) = coseno( vetor(a), vetor(b) )

    Isso é um recomendador de similaridade baseado em biblioteca ML.
    """
    if not transactions:
        return AssocModel(pair_scores={})

    documents = _transactions_to_documents(transactions)

    # vetoriza com tokens já no formato de "item chave"
    # token_pattern: permite tokens com underscores
    vectorizer = TfidfVectorizer(
        token_pattern=r"(?u)\\b[\\w_]+\\b",
        lowercase=False,
        min_df=1,
        ngram_range=(1, 1),
    )

    X = vectorizer.fit_transform(documents)  # shape: [n_docs, n_items_terms]
    terms = list(vectorizer.get_feature_names_out())

    if X.shape[1] == 0:
        return AssocModel(pair_scores={})

    # Representação para cada item como a sua distribuição ao longo dos documentos.
    # A coluna do termo no TF-IDF vira um vetor.
    # Vamos calcular similaridade entre colunas via matriz de itens.
    # Transpor para: [n_items_terms, n_docs]
    item_matrix = X.T.tocsr()

    sim = cosine_similarity(item_matrix)  # [n_items, n_items]

    pair_scores: Dict[str, Dict[str, float]] = defaultdict(dict)
    for i, a in enumerate(terms):
        for j, b in enumerate(terms):
            if i == j:
                continue
            score = float(sim[i, j])
            # filtra quase zero para reduzir payload
            if score > 0.0:
                pair_scores[a][b] = score

    return AssocModel(pair_scores=dict(pair_scores))


def build_fallback_scores(transactions: List[List[str]], max_per_a: int = 10) -> AssocModel:
    # fallback caso TF-IDF não gere nada: co-ocorrência simples
    counts = defaultdict(int)
    pair_counts = defaultdict(lambda: defaultdict(int))

    for tx in transactions:
        for a in tx:
            counts[a] += 1
        uniq = list(dict.fromkeys(tx))
        for a in uniq:
            for b in uniq:
                if a != b:
                    pair_counts[a][b] += 1

    pair_scores: Dict[str, Dict[str, float]] = {}
    for a, targets in pair_counts.items():
        if not targets:
            continue
        ranked = sorted(targets.items(), key=lambda x: x[1], reverse=True)
        top = ranked[:max_per_a]
        # normalize por contagem de a
        denom = counts[a] or 1
        pair_scores[a] = {b: c / denom for b, c in top}

    return AssocModel(pair_scores=pair_scores)


def train_item_to_item_association(transactions: List[List[str]]) -> AssocModel:
    # Mantém nome antigo para compatibilidade com app.py.
    try:
        model = train_item_to_item_tfidf(transactions)
        if model.pair_scores:
            return model
    except Exception:
        # se der qualquer problema no TF-IDF, usa fallback simples
        pass

    return build_fallback_scores(transactions)


def recommend(
    model: AssocModel,
    last_item_key: Optional[str],
    k: int = 4,
    catalog_keys: Optional[Iterable[str]] = None,
) -> List[str]:
    last_item_key = _normalize_key(last_item_key) if last_item_key else ""
    if k <= 0:
        return []

    catalog_set = set(catalog_keys) if catalog_keys is not None else None

    # Se item conhecido, retorna similares
    if last_item_key and last_item_key in model.pair_scores:
        targets = model.pair_scores.get(last_item_key, {})
        if catalog_set is not None:
            targets = {b: s for b, s in targets.items() if b in catalog_set}
        ranked = sorted(targets.items(), key=lambda x: x[1], reverse=True)
        return [b for b, _s in ranked[:k] if b != last_item_key]

    # fallback: usa itens mais populares no modelo (maior soma de score)
    agg = []
    for a, targets in model.pair_scores.items():
        for b, s in targets.items():
            if b == last_item_key:
                continue
            agg.append((b, s))

    # agrupa por max score para estabilidade
    best = defaultdict(float)
    for b, s in agg:
        best[b] = max(best[b], s)

    if catalog_set is not None:
        best = {b: s for b, s in best.items() if b in catalog_set}

    ranked = sorted(best.items(), key=lambda x: x[1], reverse=True)
    return [b for b, _s in ranked[:k]]

