'use client'

import { useState } from 'react';
import styles from '../styles/tradingsimulation.module.css';

export interface TradingPosition {
  entryPrice: number;
  takeProfit: number;
  stopLoss: number;
  type: 'long' | 'short';
  size: number;
  timestamp: number;
}

interface TradingSimulationProps {
  currentPrice: number;
  onPositionChange?: (position: TradingPosition | null) => void;
}

export default function TradingSimulation({ currentPrice, onPositionChange }: TradingSimulationProps) {
  const [activePosition, setActivePosition] = useState<TradingPosition | null>(null);

  const createTestPosition = () => {
    const newPosition: TradingPosition = {
      entryPrice: currentPrice,
      takeProfit: currentPrice + 100,
      stopLoss: currentPrice - 100,
      type: 'long',
      size: 1,
      timestamp: Date.now()
    };
    
    setActivePosition(newPosition);
    if (onPositionChange) {
      onPositionChange(newPosition);
    }
  };

  const closePosition = () => {
    setActivePosition(null);
    if (onPositionChange) {
      onPositionChange(null);
    }
  };

  const calculatePnL = () => {
    if (!activePosition) return 0;
    return currentPrice - activePosition.entryPrice;
  };

  return (
    <div className={styles.simulationContainer}>
      <h3>Trading Simulation</h3>
      
      {!activePosition ? (
        <button 
          className={styles.newPositionButton}
          onClick={createTestPosition}
        >
          Open Test Position (TP +100, SL -100)
        </button>
      ) : (
        <div className={styles.activePosition}>
          <div>Size: {activePosition.size}BTC</div>
          <div>Entry Price: ${activePosition.entryPrice}</div>
          <div>Take Profit: ${activePosition.takeProfit}</div>
          <div>Stop Loss: ${activePosition.stopLoss}</div>
          <div>Current PnL: ${calculatePnL().toFixed(2)}</div>
          <button 
            className={styles.closeButton}
            onClick={closePosition}
          >
            Close Position
          </button>
        </div>
      )}
    </div>
  );
} 