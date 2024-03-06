from flask import Flask, jsonify, request
import requests
from flask_cors import CORS


app = Flask(__name__)
CORS(app, resources={r"/api/get_stock_data": {"origins": "http://ie_stock_portfolio.storage.googleapis.com", "methods": ["POST", "OPTIONS"]}})

API_KEY = "ASDIVE6SCAN0YYZO"

@app.route('/')
def home():
    return jsonify({'message': 'Welcome to the Stock App!'})

@app.route('/api/get_stock_data', methods=['POST'])
def get_stock_data():
    symbol = request.json['symbol']
    url = f'https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol={symbol}&interval=5min&apikey={API_KEY}'
    response = requests.get(url)
    return jsonify(response.json())

if __name__ == '__main__':
    app.run(debug=True)
    

