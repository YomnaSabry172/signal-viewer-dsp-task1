/**
 * Team#16 - Trading Signal Data
 * Fetches real data from free APIs (Alpha Vantage, etc.) - uses fallback mock when API unavailable
 */

const MOCK_STOCKS = [
  { symbol: 'AAPL', name: 'Apple', data: generateMockPrices(100, 0.02) },
  { symbol: 'GOOGL', name: 'Google', data: generateMockPrices(140, 0.015) },
  { symbol: 'MSFT', name: 'Microsoft', data: generateMockPrices(380, 0.018) },
  { symbol: 'AMZN', name: 'Amazon', data: generateMockPrices(175, 0.012) },
  { symbol: 'TSLA', name: 'Tesla', data: generateMockPrices(250, 0.03) },
];

const MOCK_MINERALS = [
  { name: 'Gold', symbol: 'XAU', data: generateMockPrices(2050, 0.005) },
  { name: 'Silver', symbol: 'XAG', data: generateMockPrices(24.5, 0.008) },
  { name: 'Copper', symbol: 'HG', data: generateMockPrices(3.85, 0.01) },
  { name: 'Platinum', symbol: 'XPT', data: generateMockPrices(980, 0.006) },
];

function generateMockPrices(base, volatility, days = 90) {
  const data = [];
  let price = base;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  for (let i = 0; i < days; i++) {
    price *= 1 + (Math.random() - 0.5) * volatility;
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    data.push([d.toISOString().split('T')[0], parseFloat(price.toFixed(2))]);
  }
  return data;
}

export async function fetchStockData(symbol = 'AAPL') {
  try {
    // Try to fetch from backend API using environment variable
    const apiEndpoint = process.env.NEXT_PUBLIC_ECG_ENDPOINT || 'http://127.0.0.1:8000';
    const res = await fetch(`${apiEndpoint}/gold/stock`);
    if (res.ok) {
      const json = await res.json();
      if (json.ok && json.data && json.data.length > 0) {
        // Extract currency name from pair (e.g., "Algerian Dinar/USD" -> "Algerian Dinar")
        const stockName = symbol;
        // Extract currency data from backend
        return json.data.map(row => [row.Date, row[stockName] || null]).filter(([, v]) => v !== null);
      }
    }
  } catch (e) {
    console.log('Backend stock API failed, trying Alpha Vantage...');
  }

  try {
    const res = await fetch(
      `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=demo&outputsize=compact`
    );
    const json = await res.json();
    const ts = json['Time Series (Daily)'];
    if (ts) {
      return Object.entries(ts)
        .map(([date, o]) => [date, parseFloat(o['4. close'])])
        .reverse();
    }
  } catch (e) {}
  return MOCK_STOCKS.find(s => s.symbol === symbol)?.data || MOCK_STOCKS[0].data;
}

export async function fetchCurrencyData(pair = 'EUR/USD') {
  try {
    // Try to fetch from backend API using environment variable
    const apiEndpoint = process.env.NEXT_PUBLIC_ECG_ENDPOINT || 'http://127.0.0.1:8000';
    const res = await fetch(`${apiEndpoint}/gold/currency`);
    if (res.ok) {
      const json = await res.json();
      if (json.ok && json.data && json.data.length > 0) {
        // Extract currency name from pair (e.g., "Algerian Dinar/USD" -> "Algerian Dinar")
        const currencyName = pair.split('/')[0];
        // Extract currency data from backend
        return json.data.map(row => [row.Date, row[currencyName] || null]).filter(([, v]) => v !== null);
      }
    }
  } catch (e) {
    console.log('Backend currency API failed, trying Alpha Vantage...');
  }

  try {
    // Fallback to Alpha Vantage API
    const to = pair.split('/')[0];
    const from = pair.split('/')[1] || 'USD';
    const res = await fetch(
      `https://www.alphavantage.co/query?function=FX_DAILY&from_symbol=${from}&to_symbol=${to}&apikey=demo`
    );
    const json = await res.json();
    const ts = json['Time Series FX (Daily)'];
    if (ts) {
      return Object.entries(ts)
        .map(([date, o]) => [date, parseFloat(o['4. close'])])
        .reverse();
    }
  } catch (e) {}
  
  return MOCK_CURRENCIES.find(c => c.pair === pair)?.data || MOCK_CURRENCIES[0].data;
}

export async function fetchMineralData(symbol = 'XAU') {
  try {
    // Try to fetch from backend API using environment variable
    const apiEndpoint = process.env.NEXT_PUBLIC_ECG_ENDPOINT || 'http://127.0.0.1:8000';
    const res = await fetch(`${apiEndpoint}/gold/minerals`);
    if (res.ok) {
      const json = await res.json();
      if (json.ok && json.data && json.data.length > 0) {
        // Extract currency name from pair (e.g., "Algerian Dinar/USD" -> "Algerian Dinar")
        const mineralName = symbol;
        // Extract currency data from backend
        return json.data.map(row => [row.Date, row[mineralName] || null]).filter(([, v]) => v !== null);
      }
    }
  } catch (e) {
    console.log('Backend mineral API failed, trying Alpha Vantage...');
  }


  try {
    const commodity = symbol === 'XAU' ? 'GOLD' : symbol === 'XAG' ? 'SILVER' : 'COPPER';
    const res = await fetch(
      `https://www.alphavantage.co/query?function=${commodity}&interval=daily&apikey=demo`
    );
    const json = await res.json();
    const key = Object.keys(json).find(k => k.includes('Time Series'));
    if (key) {
      return Object.entries(json[key])
        .map(([date, o]) => [date, parseFloat(o['value'] || o['4. close'] || 0)])
        .reverse();
    }
  } catch (e) {}
  return MOCK_MINERALS.find(m => m.symbol === symbol)?.data || MOCK_MINERALS[0].data;
}

export function predictNext(prices, method = 'moving_avg') {
  if (!prices?.length) return null;
  const vals = prices.map(([, v]) => v);
  if (method === 'moving_avg') {
    const window = Math.min(7, Math.floor(vals.length / 3));
    const avg = vals.slice(-window).reduce((a, b) => a + b, 0) / window;
    const trend = (vals[vals.length - 1] - vals[vals.length - window]) / window;
    return { predicted: avg + trend, method: 'Moving Average', confidence: 0.6 };
  }
  if (method === 'linear') {
    const n = vals.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += vals[i];
      sumXY += i * vals[i];
      sumX2 += i * i;
    }
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    return { predicted: intercept + slope * n, method: 'Linear Regression', confidence: 0.65 };
  }
  return { predicted: vals[vals.length - 1], method: 'Last Value', confidence: 0.5 };
}

export { MOCK_STOCKS, MOCK_MINERALS };
