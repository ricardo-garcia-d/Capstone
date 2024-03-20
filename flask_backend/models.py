from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import Sequence

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, Sequence('user_id_seq'), primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)
    # Add other fields as necessary

class Stock(db.Model):
    id = db.Column(db.Integer, Sequence('stock_id_seq'), primary_key=True)
    symbol = db.Column(db.String(10), unique=True, nullable=False)
    # Add other stock-related fields

class UserStock(db.Model):
    id = db.Column(db.Integer, Sequence('user_stock_id_seq'), primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    stock_id = db.Column(db.Integer, db.ForeignKey('stock.id'), nullable=False)
    quantity = db.Column(db.Integer)
    price_at_purchase = db.Column(db.Float)
    purchase_date = db.Column(db.DateTime)
