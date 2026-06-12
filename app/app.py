import os
import sqlite3
from typing import Any, Dict, List

from flask import Flask, jsonify, request
from flask_cors import CORS

from ml_recommender import AssocModel, load_orders_from_sqlite, train_item_to_item_association, recommend


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(BASE_DIR)
DB_PATH = os.path.join(ROOT_DIR, 'db.sqlite3')

# Must match keys used by the frontend (pedido_finalizado.js)
CATALOG: List[Dict[str, str]] = [
    {"key": "salada", "name": "Smash Salada", "img": "imagens/salada.png", "desc": "Mais leve e crocante."},
    {"key": "bacon", "name": "Smash Bacon", "img": "imagens/bacon.jpg", "desc": "Clássico com bacon."},
    {"key": "xtudo", "name": "Smash Tudo", "img": "imagens/x tudo.jpg", "desc": "O mais completo da casa."},
    {"key": "duplocheddar", "name": "Combo Duplo Cheddar", "img": "imagens/big cheddar.jpg", "desc": "Duas porções de cheddar."},
    {"key": "ovo", "name": "Smash Ovo", "img": "imagens/ovo.jpg", "desc": "Sabor marcante e bem diferente."},
    {"key": "frango", "name": "Smash Frango", "img": "imagens/frango.jpg", "desc": "Frango suculento."},
    {"key": "frango_cheddar", "name": "Smash Frango com Cheddar", "img": "imagens/Frango com cheddar.jpg", "desc": "Cheddar cremoso."},
    {"key": "batata", "name": "Batata Frita", "img": "imagens/Batata Frita.jpg", "desc": "Acompanhamento perfeito."},
    {"key": "batata_cheddar_bacon", "name": "Batata com Cheddar e Bacon", "img": "imagens/Batata frita com cheddar e bacon.jpg", "desc": "Cheddar + bacon irresistível."},
    {"key": "sprite", "name": "Sprite", "img": "imagens/Sprite.jpg", "desc": "Refrescância gelada."},
    {"key": "coca", "name": "Coca-Cola", "img": "imagens/Coca.jpg", "desc": "Clássico para acompanhar."},
    {"key": "fanta", "name": "Fanta", "img": "imagens/Fanta.jpg", "desc": "Frutado e gostoso."},
]

CAT_BY_KEY = {x['key']: x for x in CATALOG}
CAT_KEYS = list(CAT_BY_KEY.keys())


def build_model() -> AssocModel:
    transactions = load_orders_from_sqlite(DB_PATH)
    # if db empty, still return empty model
    return train_item_to_item_association(transactions) if transactions else AssocModel(pair_scores={})


def create_app() -> Flask:
    # Serve os arquivos estáticos (HTML/CSS/JS/imagens) da raiz do projeto
    app = Flask(__name__, static_folder=ROOT_DIR, static_url_path='')


    model_holder: Dict[str, Any] = {}

    @app.before_request
    def _lazy_train():
        # lazy load once
        if 'model' not in model_holder:
            model_holder['model'] = build_model()

    @app.get('/api/recomendacoes')
    def recomendacoes():
        last_key = request.args.get('item', default='', type=str)
        count = request.args.get('count', default=4, type=int)
        count = max(1, min(10, count))

        rec_keys = recommend(model_holder['model'], last_key, k=count, catalog_keys=CAT_KEYS)
        recs = [CAT_BY_KEY[k] for k in rec_keys if k in CAT_BY_KEY]
        return jsonify({"item": last_key, "recs": recs})

    @app.post('/api/recomendacoes/train')
    def treinador():
        # re-train endpoint (manual)
        model_holder['model'] = build_model()
        return jsonify({"status": "ok"})

    return app


app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5501))
    app.run(host='0.0.0.0', port=port, debug=False)

