'use client'

import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, CandlestickData, IChartApi, IPriceLine, ISeriesApi } from 'lightweight-charts';
import styles from '../styles/tradingchart.module.css';
import VoiceControls from './VoiceControls';
import TradingSimulation from './TradingSimulation';
import { TradingPosition } from './TradingSimulation';

interface TradingChartProps {
  data: CandlestickData[];
  marketInfo: {
    high: number;
    low: number;
    volume: number;
    lastPrice: number;
    change24h: number;
  };
  language: string;
  voice: string;
  onLanguageChange: (lang: string) => void;
  onVoiceChange: (voiceId: string) => void;
}

export default function TradingChart({ data, marketInfo, language, voice, onLanguageChange, onVoiceChange }: TradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const positionLinesRef = useRef<{entry?: IPriceLine, tp?: IPriceLine, sl?: IPriceLine}>({});
  const [activePosition, setActivePosition] = useState<TradingPosition | null>(null);

  const handlePositionChange = (position: TradingPosition | null) => {
    setActivePosition(position);
    if (!candleSeriesRef.current) return;

    if (positionLinesRef.current.entry) {
      candleSeriesRef.current.removePriceLine(positionLinesRef.current.entry);
    }
    if (positionLinesRef.current.tp) {
      candleSeriesRef.current.removePriceLine(positionLinesRef.current.tp);
    }
    if (positionLinesRef.current.sl) {
      candleSeriesRef.current.removePriceLine(positionLinesRef.current.sl);
    }

    if (position) {
      positionLinesRef.current.entry = candleSeriesRef.current.createPriceLine({
        price: position.entryPrice,
        color: '#2196F3',
        lineWidth: 2,
        lineStyle: 2,
        axisLabelVisible: true,
        title: 'Entry',
      });

      positionLinesRef.current.tp = candleSeriesRef.current.createPriceLine({
        price: position.takeProfit,
        color: '#4CAF50',
        lineWidth: 2,
        lineStyle: 2,
        axisLabelVisible: true,
        title: 'TP',
      });

      positionLinesRef.current.sl = candleSeriesRef.current.createPriceLine({
        price: position.stopLoss,
        color: '#FF5252',
        lineWidth: 2,
        lineStyle: 2,
        axisLabelVisible: true,
        title: 'SL',
      });
    }
  };

  useEffect(() => {
    if (!chartContainerRef.current || data.length === 0) return;

    const handleResize = () => {
      chart.applyOptions({
        width: chartContainerRef.current?.clientWidth ?? 800,
      });
    };

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#ffffff' },
        textColor: '#333',
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      grid: {
        vertLines: { color: '#f0f0f0' },
        horzLines: { color: '#f0f0f0' },
      },
      crosshair: {
        mode: 0,
      },
      rightPriceScale: {
        borderColor: '#f0f0f0',
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
      timeScale: {
        borderColor: '#f0f0f0',
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 6,
      },
    });
    chartRef.current = chart;

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });
    candleSeriesRef.current = candleSeries;

    candleSeries.setData(data);

    if (activePosition) {
      handlePositionChange(activePosition);
    }

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data, activePosition]);

  return (
    <div className={styles.tradingContainer}>
       <div className={styles.voiceCard}>
        <VoiceControls 
            price={marketInfo.lastPrice}
            change24h={marketInfo.change24h}
            language={language}
            voice={voice}
            onLanguageChange={onLanguageChange}
            onVoiceChange={onVoiceChange}
          />
        </div>
      <div className={styles.marketInfo}>
        <div className={styles.infoCard}>
          <h3>Informations du marché</h3>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span>Prix actuel</span>
              <span className={styles.value}>${marketInfo.lastPrice.toFixed(2)}</span>
            </div>
            <div className={styles.infoItem}>
              <span>Plus Haut</span>
              <span className={styles.value}>${marketInfo.high.toFixed(2)}</span>
            </div>
            <div className={styles.infoItem}>
              <span>Plus Bas</span>
              <span className={styles.value}>${marketInfo.low.toFixed(2)}</span>
            </div>
            <div className={styles.infoItem}>
              <span>Volume 24h</span>
              <span className={styles.value}>{marketInfo.volume.toFixed(2)}</span>
            </div>
            <div className={styles.infoItem}>
              <span>Variation 1h</span>
              <span className={`${styles.value} ${marketInfo.change24h >= 0 ? styles.positive : styles.negative}`}>
                {marketInfo.change24h.toFixed(2)}%
              </span>
            </div>
          </div>
          
         
        </div>
       
      
     
      <div className={styles.chartSection}>
        <div ref={chartContainerRef} className={styles.chart} />
        <TradingSimulation 
          currentPrice={marketInfo.lastPrice} 
          onPositionChange={handlePositionChange}
        />
      </div>
      </div>
    </div>
  );
} 