import React, { useState, useEffect } from 'react';

function App() {
  const [formData, setFormData] = useState({ 
    temp: 33, 
    humidity: 65, 
    wind_speed: 14, 
    pan_area_acres: 5 
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [rainAlert, setRainAlert] = useState({ 
    isRaining: false, 
    message: "Clear Skies: Active crystallization window." 
  });

  useEffect(() => {
    calculateYield(); 
    const continuousMonitor = setInterval(() => {
      calculateYield(); 
    }, 5 * 60 * 1000);
    return () => clearInterval(continuousMonitor);
  }, []);

  const triggerAudioAlarm = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, ctx.currentTime); 
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.5);
    } catch (e) {
      console.log("Audio block bypass state", e);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: parseFloat(value) || 0 });
  };

  const calculateYield = async (customFormData = null) => {
    setLoading(true);
    const dataToSend = customFormData || formData;
    try {
      const response = await fetch('http://localhost:8000/api/predict-yield', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });
      const data = await response.json();
      setResult(data);
      if (data.is_raining) {
        setRainAlert({ isRaining: true, message: data.alert_message });
        triggerAudioAlarm();
      } else {
        setRainAlert({ isRaining: false, message: data.alert_message });
      }
    } catch (error) {
      console.error("Connection link offline:", error);
    } finally {
      setLoading(false);
    }
  };

  const simulateWeather = (type) => {
    if (type === 'rain') {
      const rainData = { temp: 24, humidity: 95, wind_speed: 28, pan_area_acres: formData.pan_area_acres };
      setFormData(rainData);
      calculateYield(rainData);
    } else {
      const clearData = { temp: 37, humidity: 60, wind_speed: 16, pan_area_acres: formData.pan_area_acres };
      setFormData(clearData);
      calculateYield(clearData);
    }
  };
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-6 font-sans">
      <header className="max-w-4xl mx-auto mb-4 bg-blue-900 text-white p-6 rounded-2xl shadow-md">
        <h1 className="text-2xl font-bold tracking-tight">Thoothukudi Smart Salt Dashboard</h1>
        <p className="text-blue-200 text-sm mt-1">AI-Driven Yield Optimization & Weather Prediction Engine</p>
      </header>

      <div className={`max-w-4xl mx-auto mb-6 p-4 rounded-xl flex items-center justify-between border transition-all duration-300 ${ 
        rainAlert.isRaining ? 'bg-red-50 border-red-500 text-red-800 shadow-md animate-pulse' : 'bg-emerald-50 border-emerald-200 text-emerald-800 shadow-sm' 
      }`}>
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{rainAlert.isRaining ? '⛈️' : '☀️'}</span>
          <div>
            <span className="block text-[10px] uppercase tracking-wider font-bold opacity-70">System State Tracker</span>
            <p className={`text-sm mt-0.5 ${rainAlert.isRaining ? 'font-bold text-red-900' : 'font-medium text-emerald-900'}`}>{rainAlert.message}</p>
          </div>
        </div>
        {rainAlert.isRaining && <div className="text-[10px] bg-red-600 text-white px-2.5 py-1 rounded-md font-bold">SIREN ACTIVE</div>}
      </div>

      <main className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-semibold mb-4 text-slate-700">Live Field Conditions</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Temperature ({formData.temp}°C)</label>
                <input type="range" name="temp" min="20" max="45" value={formData.temp} onChange={handleInputChange} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Relative Humidity ({formData.humidity}%)</label>
                <input type="range" name="humidity" min="30" max="100" value={formData.humidity} onChange={handleInputChange} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Wind Speed ({formData.wind_speed} km/h)</label>
                <input type="range" name="wind_speed" min="0" max="40" value={formData.wind_speed} onChange={handleInputChange} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Total Pan Area (Acres)</label>
                <input type="number" name="pan_area_acres" value={formData.pan_area_acres} onChange={handleInputChange} className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Pitch Deck Demo Controls</span>
            <div className="flex gap-2">
              <button type="button" onClick={() => simulateWeather('clear')} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-1.5 px-3 text-xs rounded-lg cursor-pointer">Set Clear Sky</button>
              <button type="button" onClick={() => simulateWeather('rain')} className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 font-semibold py-1.5 px-3 text-xs rounded-lg cursor-pointer">Force Rain Alert</button>
            </div>
          </div>

          <button onClick={() => calculateYield(null)} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2.5 rounded-lg transition text-sm mt-4 shadow-sm cursor-pointer">
            {loading ? 'Analyzing Sensors...' : 'Run Prediction Engine'}
          </button>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-semibold mb-4 text-slate-700">Predictive Yield Outputs</h2>
            {result ? (
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <span className="block text-xs text-slate-400 font-medium uppercase tracking-wider">Calculated Evaporation</span>
                  <span className="text-2xl font-bold text-slate-800">{result.evaporation_mm_per_day} <span className="text-sm font-normal text-slate-500">mm / day</span></span>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <span className="block text-xs text-slate-400 font-medium uppercase tracking-wider">Estimated Harvest Weight</span>
                  <span className={`text-2xl font-bold ${rainAlert.isRaining ? 'text-slate-400' : 'text-blue-600'}`}>{result.estimated_daily_yield_tons} <span className="text-sm font-normal text-slate-500">Tons daily</span></span>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <span className="block text-xs text-slate-400 font-medium uppercase tracking-wider">Time Remaining until Crystal Harvest</span>
                  <span className={`text-2xl font-bold ${rainAlert.isRaining ? 'text-red-500' : 'text-emerald-600'}`}>{rainAlert.isRaining ? 'DELAYED' : `${result.days_until_crystallization} Days`}</span>
                </div>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl">
                <p className="text-sm text-slate-400 text-center px-4">Initialize prediction calculation to stream metrics data loop.</p>
              </div>
            )}
          </div>
          
          {result && (
            <div className={`mt-4 p-3 rounded-xl text-center text-xs font-semibold border ${
              rainAlert.isRaining ? 'bg-red-600 text-white border-red-700' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              STATUS: {result.harvest_status}
            </div>
          )}
        </div>
      </main>

      <footer className="max-w-4xl mx-auto bg-slate-900 text-slate-200 p-4 rounded-xl border border-slate-800 shadow-sm font-mono text-xs">
        <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-2">📡 Field Telemetry & Cellular Gateway Logs</span>
        <div className="space-y-1">
          {result && result.sms_dispatch_logs ? (
            result.sms_dispatch_logs.map((log, index) => (
              <p key={index} className={rainAlert.isRaining ? "text-amber-400 animate-pulse" : "text-emerald-400"}>
                {log}
              </p>
            ))
          ) : (
            <p className="text-slate-500">[System Idle]: Run prediction analysis pipeline to begin tracking cellular data.</p>
          )}
        </div>
      </footer>
    </div>
  );
}

export default App;
