import React, { useState } from 'react';
import './Portfolio.css';

function Portfolio() {
  const [stocks, setStocks] = useState([]);
  const [inputSymbol, setInputSymbol] = useState('');
  const [errorMessage, setErrorMessage] = useState(''); // State to hold error messages

  const fetchStocks = async (symbol) => {
    const response = await fetch('https://mcsbt-stockapp.ey.r.appspot.com/api/get_stock_data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ symbol })
    });
    const data = await response.json();
    if (data["Time Series (5min)"]) {
      const latestTimestamp = Object.keys(data["Time Series (5min)"]).sort().pop();
      const latestData = data["Time Series (5min)"][latestTimestamp];
      setStocks([...stocks, {
        symbol: symbol,
        open: latestData["1. open"],
        high: latestData["2. high"],
        low: latestData["3. low"],
        close: latestData["4. close"],
        volume: latestData["5. volume"]
      }]);
      setErrorMessage('');
    } else {
      setErrorMessage('The stock symbol does not exist or was input incorrectly.');
    }
  };

  const removeStock = (symbol) => {
    setStocks(stocks.filter(stock => stock.symbol !== symbol));
  };

  const handleSymbolInput = (event) => {
    setInputSymbol(event.target.value.toUpperCase());
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    fetchStocks(inputSymbol);
  };

  return (
    <div>
      {errorMessage && <p className="error-message">{errorMessage}</p>} {/* Display error message */}
      <form onSubmit={handleSubmit}>
        <input type="text" value={inputSymbol} onChange={handleSymbolInput} placeholder="Enter stock symbol" />
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
            <th>Portfolio Percentage</th>
            <th>Remove</th>
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
              <td>{(100 / stocks.length).toFixed(2)}%</td>
              <td><button onClick={() => removeStock(stock.symbol)}>Remove</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Portfolio;
