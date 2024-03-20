from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from flask_migrate import Migrate
import oracledb
from sqlalchemy.pool import NullPool
import requests
from datetime import datetime
from models import db
from flask import current_app


app = Flask(__name__)
CORS(app)
#API_KEY = "ASDIVE6SCAN0YYZO"
API_KEY = "PZNQSKBY7F4YB4E8"

un = 'ADMIN'
pw = 'Capstone#2024'
dsn = '(description= (retry_count=20)(retry_delay=3)(address=(protocol=tcps)(port=1521)(host=adb.eu-madrid-1.oraclecloud.com))(connect_data=(service_name=g13f0d37cf1f87d_stocksportfolio_high.adb.oraclecloud.com))(security=(ssl_server_dn_match=yes)))'

pool = oracledb.create_pool(user=un, password=pw, dsn=dsn)

app.config['SQLALCHEMY_DATABASE_URI'] = 'oracle+oracledb://'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'creator': pool.acquire,
    'poolclass': NullPool
}
app.config['SQLALCHEMY_ECHO'] = True


with app.app_context():
    from models import User, Stock, UserStock
    db.init_app(app)  # Initialize SQLAlchemy with the Flask app
    Migrate(app, db)  # Initialize Flask-Migrate

    # Checking table creation at startup instead of first request
    db.create_all()

@app.route('/register', methods=['POST'])
def register():
    data = request.json
    username = data['username']
    password = data['password']

    existing_user = User.query.filter_by(username=username).first()
    if existing_user:
        return jsonify({'success': False, 'message': 'Username already exists'}), 400

    hashed_password = generate_password_hash(password, method='pbkdf2:sha256')
    new_user = User(username=username, password=hashed_password)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({'success': True, 'message': 'User registered successfully'}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data['username']
    password = data['password']

    user = User.query.filter_by(username=username).first()
    if user and check_password_hash(user.password, password):
        return jsonify({'success': True, 'message': 'Login successful', 'user_id': user.id}), 200
    else:
        return jsonify({'success': False, 'message': 'Invalid credentials'}), 401

@app.route('/')
def home():
    return jsonify({'message': 'Welcome to the Stock App!'})

@app.route('/api/get_stock_data', methods=['POST'])
def get_stock_data():
    symbol = request.json['symbol']
    url = f'https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol={symbol}&interval=5min&apikey={API_KEY}'
    response = requests.get(url)
    return jsonify(response.json())

@app.route('/add_stock', methods=['POST'])
def add_stock():
    if not request.is_json:
        return jsonify({'error': 'Request must be JSON'}), 400

    data = request.get_json()
    current_app.logger.debug(f"Receive add stock data: {data}")

    # Validate required fields
    for field in ['user_id', 'symbol', 'quantity']:
        if field not in data:
            return jsonify({'error': f'Missing {field} in data'}), 400

    # Parse and validate data
    try:
        user_id = int(data['user_id'])
        symbol = data['symbol']
        quantity = int(data['quantity'])  # Ensure this is an integer
        price_at_purchase = float(data['price_at_purchase'])  # Ensure this is a float
        purchase_date = datetime.strptime(data['purchase_date'], "%Y-%m-%d")
    except (ValueError, TypeError) as e:
        current_app.logger.error(f"Data parsing error: {e}")
        return jsonify({'error': 'Invalid data format'}), 400

    # Check if stock exists, if not, add it
    stock = Stock.query.filter_by(symbol=symbol).first()
    if not stock:
        stock = Stock(symbol=symbol)
        db.session.add(stock)
        db.session.flush()  # Assigns ID to the stock without committing

    # Check if user already has this stock
    user_stock = UserStock.query.filter_by(user_id=user_id, stock_id=stock.id).first()

    if user_stock:
        user_stock.quantity += quantity
        user_stock.price_at_purchase = price_at_purchase
        user_stock.purchase_date = purchase_date
    else:
        new_user_stock = UserStock(
            user_id=user_id,
            stock_id=stock.id, 
            quantity=quantity,
            price_at_purchase=price_at_purchase,
            purchase_date=purchase_date
        )
        db.session.add(new_user_stock)

    # Commit to database
    try:
        db.session.commit()
        return jsonify({'message': 'Stock added successfully'}), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Failed to add stock: {e}')
        return jsonify({'error': 'Failed to add stock', 'exception': str(e)}), 500

@app.route('/remove_stock', methods=['POST'])
def remove_stock():
    if not request.json or not 'user_id' in request.json or not 'symbol' in request.json:
        return jsonify({'error': 'Missing data'}), 400

    user_id = request.json['user_id']
    symbol = request.json['symbol']

    stock = Stock.query.filter_by(symbol=symbol).first()
    if stock is None:
        return jsonify({'error': 'Stock symbol does not exist'}), 404

    user_stock = UserStock.query.filter_by(user_id=user_id, stock_id=stock.id).first()
    if user_stock:
        db.session.delete(user_stock)
        db.session.commit()
        return jsonify({'message': 'Stock removed from portfolio'}), 200
    else:
        return jsonify({'error': 'Stock not found in portfolio'}), 404
    

@app.route('/initialize_stock', methods=['POST'])
def initialize_stock():
    from initialize_database import initialize_data_for_symbol
    data = request.get_json()
    symbol = data.get('symbol')
    quantity = data.get('quantity')
    price_at_purchase = data.get('price_at_purchase')
    purchase_date = data.get('purchase_date', datetime.now(datetime.UTC))  # Assuming purchase date is the current time

    initialize_data_for_symbol(app, symbol, quantity, price_at_purchase, purchase_date)

    return jsonify({'message': 'Stock data initialized successfully'})

@app.route('/get_user_stocks', methods=['GET'])
def get_user_stocks():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'error': 'Missing user_id'}), 400

    try:
        user_id = int(user_id)
    except ValueError:
        return jsonify({'error': 'user_id must be an integer'}), 400

    user_stocks = UserStock.query.filter_by(user_id=user_id).all()
    stocks_data = []

    for user_stock in user_stocks:
        stock = Stock.query.get(user_stock.stock_id)
        if stock:
            # Make an API call to get live data
            live_data_response = requests.get(
                f'https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol={stock.symbol}&interval=5min&apikey={API_KEY}')
            live_data = live_data_response.json()
            latest_data = next(iter(live_data["Time Series (5min)"].values()))


            stocks_data.append({
                'symbol': stock.symbol,
                'quantity': user_stock.quantity,
                'price_at_purchase': user_stock.price_at_purchase,
                'purchase_date': user_stock.purchase_date.strftime('%Y-%m-%d'),
                'volume': latest_data['5. volume'],
                'open': latest_data['1. open'],
                'high': latest_data['2. high'],
                'low': latest_data['3. low'],
                'close': latest_data['4. close'],
            })

    return jsonify(stocks_data), 200



if __name__ == '__main__':
    app.run(debug=True)

