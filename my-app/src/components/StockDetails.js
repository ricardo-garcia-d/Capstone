import React, { useState, useEffect } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';
import './StockDetails.css';
import { useNavigate } from 'react-router-dom';

const StockDetail = () => {
  const { symbol } = useParams();
  const [stockData, setStockData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inputSymbol, setInputSymbol] = useState('');
  const [user_id, setUserId] = useState(localStorage.getItem('user_id'));
  const [currentSymbol, setCurrentSymbol] = useState(symbol);
  const navigate = useNavigate()

  const chartData = {
    labels: stockData ? stockData.map(item => item.date) :[],
    datasets: [
      {
        label: 'Closing Price',
        data: stockData ? stockData.map(item => item.closingPrice) : [],
        fill: false,
        backgroundColor: 'rgb(0,123,255)',
        borderColor: 'rgba(0,123,255)',
      },
    ], 
  };
  
  const chartOptions = {
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  const lastTenMonths = (data) => {
    if (!data || typeof data !== 'object') {
      // Return an empty array or handle the error appropriately if data is not an object
      console.error('Invalid data provided to lastTenMonths:', data);
      return [];
    }
  
    const sortedDates = Object.keys(data).sort((a, b) => new Date(b) - new Date(a));
    const lastTen = sortedDates.slice(0, 10);
    return lastTen.map(date => ({
      date,
      closingPrice: data[date]["4. close"]
    }));
  };


  const fetchStockDetails = async (stockSymbol) => {
    const symbolToFetch = stockSymbol || inputSymbol;
    try {
      // Using template literals to inject the stockSymbol into the URL
      const response = await fetch(`https://mcsbt-stockapp.ey.r.appspot.com/api/stock_details/${symbolToFetch}`, {
        method: 'POST', // Assuming this should be a GET request
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({symbol: symbolToFetch}),
      });
      if (!response.ok) throw new Error('Failed to fetch stock details');
      const data = await response.json();
      setCurrentSymbol(symbolToFetch);
      console.log(data); 
      const monthlyData = data["Monthly Time Series"];
      const lastTenData = lastTenMonths(monthlyData);
      setStockData(lastTenData);
      setLoading(false); // Set loading to false once data is loaded
    } catch (error) {
      console.error('Error fetching stock details:', error);
      setError(error.message); // Set error state
      setLoading(false);
    }
  };

  useEffect(() => {
    if (symbol) {
      fetchStockDetails(symbol);
      setCurrentSymbol(symbol);
    }
  }, [symbol]);

const handleSearch = (e) => {
    e.preventDefault();
    fetchStockDetails(inputSymbol);
};



const handleBackToPortfolio = () => {
    navigate('/portfolio');
};


if (loading) return <div>Loading...</div>;
if (error) return <div>{error}</div>;

return (
    <div>
      <h1>Stock Details for {currentSymbol}</h1>
      <form onSubmit={handleSearch}>
        <input
          type="text"
          value={inputSymbol}
          onChange={(e) => setInputSymbol(e.target.value.toUpperCase())}
          placeholder="Search for a stock"
        />
        <button type="submit">Search</button>
      </form>
      <div className="details-layout">
        <div className="table-container">
          {/* Table for the closing prices and dates */}
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Closing Price</th>
              </tr>
            </thead>
            <tbody>
              {stockData && stockData.map(({date, closingPrice}, index) => (
                <tr key={index}>
                  <td>{date}</td>
                  <td>${closingPrice}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="graph-container">
          <Line data={chartData} options={chartOptions}/>
        </div>
      </div>
      <button onClick={handleBackToPortfolio}>Back to Portfolio</button>
    </div>
  );
};

export default StockDetail;
  
