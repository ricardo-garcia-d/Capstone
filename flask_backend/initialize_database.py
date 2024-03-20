from models import db, User, Stock, UserStock
from datetime import datetime




def initialize_data_for_symbol(app, symbol, quantity, price_at_purchase, purchase_date):
    with app.app_context():
        user = User.query.filter_by(username='new_user').first()
        if not user:
            user = User(username='new_user', password_hash='hashed_password')
            db.session.add(user)
            db.session.commit()

        stock = Stock.query.filter_by(symbol=symbol).first()
        if not stock:
            stock = Stock(symbol=symbol)
            db.session.add(stock)
            db.session.commit()

        # Create a new UserStock association if it does not exist
        user_stock = UserStock.query.filter_by(user_id=user.id, stock_id=stock.id).first()
        if not user_stock:
            user_stock = UserStock(
                user_id=user.id,
                stock_id=stock.id,
                quantity=quantity,
                price_at_purchase=price_at_purchase,
                purchase_date=purchase_date
            )
            db.session.add(user_stock)
            db.session.commit()
