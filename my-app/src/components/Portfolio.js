import React, { useState, useEffect } from 'react';
import './Portfolio.css';
import { useNavigate } from 'react-router-dom';

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
      console.log('fetchedData antes ')

      // Call fetchStocks and wait for the data
      const fetchedData = await fetchStocks(inputSymbol);

      console.log('fetchedData ', fetchedData)
      
      // Proceed only if fetchedData is not null
      if (fetchedData) {
        const stockData = {
          user_id: localStorage.getItem('user_id'),
          symbol: inputSymbol,
          quantity: inputQuantity,
          price_at_purchase: inputPrice,
          purchase_date: new Date().toISOString().split('T')[0],
        };
  
        // Send the combined data to the backend
        const addResponse = await fetch('https://mcsbt-stockapp.ey.r.appspot.com/add_stock', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(stockData),
        });
  
        if (addResponse.ok) {
          // If the stock was added successfully to the backend, update the state
          addFetchedStocksToState(fetchedData);
          setInputSymbol('');
          setInputQuantity(1);
          setInputPrice('');
          setErrorMessage('');
        } else {
          const addData = await addResponse.json();
          setErrorMessage(addData.error || 'Failed to add stock. Please try again.');
        }
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
  
  const handleLogout = () => {
    console.log('logging out');
    localStorage.removeItem('authToken');
    localStorage.removeItem('user_id');
    localStorage.removeItem('isLoggedIn');
    props.logout();
  }

  // Input handlers
  const handleQuantityChange = (event) => setInputQuantity(event.target.value);
  const handlePriceChange = (event) => setInputPrice(event.target.value);
  const handleSymbolInput = (event) => setInputSymbol(event.target.value.toUpperCase());
  const handleSubmit = async (event) => {
    event.preventDefault();
    await addStock();
  };



  return (
    <div>
      {errorMessage && <p className="error-message">{errorMessage}</p>}
      <form onSubmit={handleSubmit}>
        <input type="text" value={inputSymbol} onChange={handleSymbolInput} placeholder="Enter stock symbol" />
        <input type="number" min="1" value={inputQuantity} onChange={handleQuantityChange} placeholder="Quantity" />
        <input type="text" value={inputPrice} onChange={handlePriceChange} placeholder="Price at purchase" />
        <button type="submit">Add Stock</button>
      </form>
      <table>
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Volume</th>
            <th>Open</th>
            <th>High</th>
            <th>Low</th>
            <th>Close</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {stocks.map((stock, index) => (
            <tr key={index}>
              <td>{stock.symbol}</td>
              <td>{stock.volume}</td>
              <td>{stock.open}</td>
              <td>{stock.high}</td>
              <td>{stock.low}</td>
              <td>{stock.close}</td>
              <td>
                <button onClick={() => removeStock(stock.symbol)}>Remove</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}

export default Portfolio;
