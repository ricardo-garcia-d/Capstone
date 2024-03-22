import React, { useState, useEffect, useCallback } from 'react';
import './Portfolio.css';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';

function Portfolio(props) {  
  const [stocks, setStocks] = useState([]);
  const [inputSymbol, setInputSymbol] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [inputQuantity, setInputQuantity] = useState(1);
  const [inputPrice, setInputPrice] = useState('');
  const [user_id, setUserId] = useState(localStorage.getItem('user_id'));
  const navigate = useNavigate();

  // Fetch stock data
  const addFetchedStocksToState = (data) => {
    const latestTimestamp = Object.keys(data["Time Series (5min)"]).sort().pop();
    const latestData = data["Time Series (5min)"][latestTimestamp];
    setStocks(currentStocks => [...currentStocks, {
      symbol: inputSymbol,
      open: latestData["1. open"],
      high: latestData["2. high"],
      low: latestData["3. low"],
      close: latestData["4. close"],
      volume: latestData["5. volume"]
    }]);
  };

  // Function to fetch stock data from the API
  const fetchStocks = async () => {
    try {
      const response = await fetch('https://mcsbt-stockapp.ey.r.appspot.com/api/get_stock_data', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ symbol: inputSymbol }),
      });
      const data = await response.json();
      if (data["Time Series (5min)"]) {
        return(data);
      } else {
        setErrorMessage('The stock symbol does not exist or was input incorrectly.');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setErrorMessage('An error occurred while fetching stocks. Please try again later.');
      return null;
    }
  };

  // Add stock
  const addStock = async () => {
    try {
      // Call fetchStocks and wait for the data
      const fetchedData = await fetchStocks(inputSymbol);
  
      // Proceed only if fetchedData is not null
      if (fetchedData) {
        const latestTimestamp = Object.keys(fetchedData["Time Series (5min)"]).sort().pop();
        const latestData = fetchedData["Time Series (5min)"][latestTimestamp];
  
        const stockData = {
          user_id: localStorage.getItem('user_id'),
          symbol: inputSymbol,
          quantity: Number(inputQuantity),
          price_at_purchase: Number(inputPrice),
          purchase_date: new Date().toISOString().split('T')[0],
          close: latestData["4. close"],
          open: latestData["1. open"],
          high: latestData["2. high"],
          low: latestData["3. low"],
          volume: latestData["5. volume"]
        };
  
        // Send the combined data to the backend
        const addResponse = await fetch('https://mcsbt-stockapp.ey.r.appspot.com/add_stock', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(stockData),
        });
  
        if (addResponse.ok) {
          setStocks(currentStocks => {
            const newStocks = [...currentStocks, stockData];
            const newTotalInvestment = newStocks.reduce((total, stock) => total + (stock.quantity * stock.price_at_purchase), 0);
  
            return newStocks.map(stock => {
              const investment = stock.quantity * stock.price_at_purchase;
              const portfolioPercentage = ((investment / newTotalInvestment) * 100).toFixed(2);
              const currentValue = stock.close * stock.quantity;
              const roi = (((currentValue - investment) / investment) * 100).toFixed(2);
  
              return {...stock, portfolioPercentage, roi};
            });
          });
          
          setInputSymbol('');
          setInputQuantity(1);
          setInputPrice('');
          setErrorMessage('');
        } else {
          const addData = await addResponse.json();
          setErrorMessage(addData.error || 'Failed to add stock. Please try again.');
        }
      } else {
        setErrorMessage('Failed to fetch stock data. Please try again.');
      }
    } catch (error) {
      console.error('Add stock error:', error);
      setErrorMessage('An error occurred while adding the stock. Please try again later.');
    }
  };
  

  // Remove stock
  const removeStock = async (stockSymbol) => {
    const user_id = localStorage.getItem('user_id')
    console.log(user_id)

    try {
      const response = await fetch('https://mcsbt-stockapp.ey.r.appspot.com/remove_stock', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id, symbol: stockSymbol }),
      });
      if (response.ok) {
        setStocks(currentStocks => currentStocks.filter(stock => stock.symbol !== stockSymbol));
      } else {
        setErrorMessage('Failed to remove stock. Please try again.');
      }
    } catch (error) {
      console.error('Remove stock error:', error);
      setErrorMessage('An error occurred while removing the stock. Please try again later.');
    }
  };
  const calculateTotalInvestment = useCallback(() => {
    return stocks.reduce((total, stock) => {
      const quantity = Number(stock.quantity);
      const priceAtPurchase = Number(stock.price_at_purchase);
      return total + (quantity * priceAtPurchase);}, 0);
  },[stocks]);

  const totalInvestment = calculateTotalInvestment();



  const fetchUserStocks = async () => {
    try {
      const response = await fetch(`https://mcsbt-stockapp.ey.r.appspot.com/get_user_stocks?user_id=${user_id}`);
      if (!response.ok) throw new Error('Failed to fetch stocks');
      const userStocksData = await response.json();
      setStocks(userStocksData); // assuming 'stocks' is the state holding the portfolio
    } catch (error) {
      console.error('Fetch user stocks error:', error);
      setErrorMessage('An error occurred while fetching the user stocks. Please try again later.');
    }
  };
  
  useEffect(() => {
    if(user_id) {
      fetchUserStocks();
    }
  }, [user_id]);
  
  const handleLogout = useCallback(async () => {
    try {
      const response = await fetch(`https://mcsbt-stockapp.ey.r.appspot.com/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id }),
      });
      if (response.ok) {
        console.log('logging out');
        localStorage.removeItem('authToken');
        localStorage.removeItem('user_id');
        localStorage.removeItem('isLoggedIn');
        props.logout();
      } else {
        throw new Error('logout failed');
      }
    } catch (error) {
      console.error('logout error', error);
    }
  }, []);

  // Input handlers
  const handleQuantityChange = (event) => setInputQuantity(event.target.value);
  const handlePriceChange = (event) => setInputPrice(event.target.value);
  const handleSymbolInput = (event) => setInputSymbol(event.target.value.toUpperCase());
  const handleSubmit = async (event) => {
    event.preventDefault();
    await addStock();
  };



  return (
    <div className="container">
      {errorMessage && <p className="error-message">{errorMessage}</p>}
      <div className='header'>
        <h1> Your Portfolio </h1>
      </div>
      <div className='form-container'>
        <form onSubmit={handleSubmit}>
          <input type="text" value={inputSymbol} onChange={handleSymbolInput} placeholder="Enter stock symbol" />
          <input type="number" min="1" value={inputQuantity} onChange={handleQuantityChange} placeholder="Quantity" />
          <input type="text" value={inputPrice} onChange={handlePriceChange} placeholder="Price at purchase" />
          <button type="submit"> Add Stock </button>
        </form>
      </div>
      <div className='stock-table-cotainer'>
        <table>
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Close</th>
              <th>Open</th>
              <th>Portfolio %</th>
              <th>ROI</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {stocks.map((stock, index) => {
              const quantity = Number(stock.quantity);
              const priceAtPurchase = Number(stock.price_at_purchase);
              const closingPrice = Number(stock.close);
            const investment = quantity * priceAtPurchase;
            const portfolioPercentage = totalInvestment ? ((investment / totalInvestment) * 100).toFixed(2): '0.00';
            const currentValue = closingPrice * quantity;
            const roi = investment ? (((currentValue - investment) / investment) * 100).toFixed(2): '0.00';
            return (
              <tr key={index}>
                <td>
                  <Link to={`/stock/${stock.symbol}`}>{stock.symbol}</Link>
                </td>
                <td>${parseFloat(stock.close).toFixed(2)}</td>
                <td>${parseFloat(stock.open).toFixed(2)}</td>
                <td>{portfolioPercentage}%</td>
                <td>{roi}%</td>
                <td>
                  <button onClick={() => removeStock(stock.symbol)}>Remove</button>
                </td>
              </tr>
            );
            })}
          </tbody>
        </table>
      </div>
      <div className='logout-button-container'>
        <button className='logout-button' onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
}

export default Portfolio;
