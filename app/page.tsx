'use client'

import styles from "@/styles/home.module.css";
import TradingChart from "@/components/TradingChart";
import { useEffect, useState } from "react";
import { CandlestickData, UTCTimestamp } from "lightweight-charts";
import Loader from "@/components/Loader";
import { FaRegCommentDots } from "react-icons/fa";
import AIChatSidebar from "@/components/AIChatSidebar";
import Footer from "@/components/Footer";

// Type pour les données brutes de Binance
interface BinanceKline {
  0: number;    // Open time
  1: string;    // Open
  2: string;    // High
  3: string;    // Low
  4: string;    // Close
  5: string;    // Volume
  // ... autres champs si nécessaires
}

export default function Home() {
  const [chartData, setChartData] = useState<CandlestickData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [marketInfo, setMarketInfo] = useState({
    high: 0,
    low: 0,
    volume: 0,
    lastPrice: 0,
    change24h: 0,
  });
  const [language, setLanguage] = useState('en');
  const [voice, setVoice] = useState('');

  useEffect(() => {
    const fetchHistoricalData = async () => {
      try {
        const response = await fetch('https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1m&limit=100');
        const data = await response.json();
        
        const historicalData: CandlestickData[] = data.map((candle: BinanceKline) => ({
          time: (candle[0] / 1000) as UTCTimestamp,
          open: parseFloat(candle[1]),
          high: parseFloat(candle[2]),
          low: parseFloat(candle[3]),
          close: parseFloat(candle[4]),
        }));

        setChartData(historicalData);

        const initialMarketInfo = calculateMarketInfo(historicalData);
        setMarketInfo(initialMarketInfo);
      } catch (error) {
        console.error('Erreur lors de la récupération des données historiques:', error);
      }
    };

    const calculateMarketInfo = (data: CandlestickData[]) => {
      if (data.length === 0) return { high: 0, low: 0, volume: 0, lastPrice: 0, change24h: 0 };

      const lastCandle = data[data.length - 1];
      
      const recentCandles = data.slice(-100);
      const firstCandle = recentCandles[0];

      // Calculer le volume total sur les 100 dernières bougies
      const totalVolume = recentCandles.reduce((acc, candle: CandlestickData & { volume?: number }) => {
        const candleVolume = parseFloat(String(candle.volume || 0));
        return acc + candleVolume;
      }, 0);

      // Calculer la variation de prix sur les 100 dernières bougies
      const priceChange = ((lastCandle.close - firstCandle.open) / firstCandle.open) * 100;

      return {
        high: Math.max(...recentCandles.map(candle => candle.high)),
        low: Math.min(...recentCandles.map(candle => candle.low)),
        volume: totalVolume,
        lastPrice: lastCandle.close,
        change24h: priceChange,
      };
    };

    fetchHistoricalData();

    const ws = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@kline_1m');
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const candlestick = data.k;
      const newCandle: CandlestickData = {
        time: (candlestick.t / 1000) as UTCTimestamp,
        open: parseFloat(candlestick.o),
        high: parseFloat(candlestick.h),
        low: parseFloat(candlestick.l),
        close: parseFloat(candlestick.c),
      };
      
      setChartData(prev => {
        const index = prev.findIndex(candle => candle.time === newCandle.time);
        let updatedData;
        
        if (index !== -1) {
          updatedData = [...prev];
          updatedData[index] = newCandle;
        } else {
          updatedData = [...prev, newCandle].slice(-100).sort((a, b) => 
            (a.time as number) - (b.time as number)
          );
        }

        const updatedMarketInfo = calculateMarketInfo(updatedData);
        setMarketInfo(updatedMarketInfo);

        return updatedData;
      });
    };

    return () => ws.close();
  }, []);

  const marketData = {
    marketInfo,
    chartData
  };

  const handleChatOpen = () => {
    setIsChatOpen(true);
  };

  return (
    <div className={styles.container}>
      {isLoading ? (
        <Loader 
          onLoadingComplete={() => setIsLoading(false)} 
          currentPrice={marketInfo.lastPrice}
        />
      ) : (
        <>
          <div className={styles.iacontainer}>
            <button 
              className={styles.iaButton}
              onClick={handleChatOpen}
            >
              <FaRegCommentDots />
            </button>
          </div>
          <div className={styles.chartContainer}>
            <TradingChart 
              data={chartData} 
              marketInfo={marketInfo}
              language={language}
              voice={voice}
              onLanguageChange={setLanguage}
              onVoiceChange={setVoice}
            />
          </div>
          <AIChatSidebar 
            isOpen={isChatOpen} 
            onClose={() => setIsChatOpen(false)} 
            data={chartData}
            marketInfo={marketInfo}
          />
          <Footer />
        </>
      )}
    </div>  
  );
}
