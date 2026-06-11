Backend Flask para recomendações por histórico (machine learning leve por co-ocorrência).

Rodar:
1) Instale deps: pip install -r requirements.txt
2) Rode: python app.py (a partir da pasta app)

Endpoint:
- GET http://127.0.0.1:5501/api/recomendacoes?item=<chave>&count=4

Ele lê db.sqlite3 tabela pedidos.itens_json e treina um recomendador item-a-item.

