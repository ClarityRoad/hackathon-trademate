'use client'

import { useState } from 'react';
import styles from '../styles/tradingsimulation.module.css';
import { CandlestickData } from 'lightweight-charts';
import axios from 'axios';
import { VoiceMessageAssistant } from './VoiceAssistant';
import Subtitles from './Subtitles';

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
  data: CandlestickData[];
  marketInfo: {
    high: number;
    low: number;
    volume: number;
    lastPrice: number;
    change24h: number;
  };
}

export default function TradingSimulation({ currentPrice, onPositionChange,  data, marketInfo }: TradingSimulationProps) {
  const [activePosition, setActivePosition] = useState<TradingPosition | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [tradeIAMsg, setTradeIAMsg] = useState<string>('');
  const [subtitlesText, setSubtitlesText] = useState('')
  const [isReading, setIsReading] = useState(false);

  const closePosition = () => {
    setActivePosition(null);
    if (onPositionChange) {
      onPositionChange(null);
    }
  };

  const calculatePnL = () => {
    if (!activePosition) return 0;
      if (activePosition.type === 'long') {
        return currentPrice - activePosition.entryPrice;
      } else {
        return activePosition.entryPrice - currentPrice;
      }
  };

  const speakMessage = async (message: string) => {

    try {
      await VoiceMessageAssistant(message, "21m00Tcm4TlvDq8ikWAM");
      await new Promise(resolve => setTimeout(resolve, 1000));  
    } catch (error) {
      console.error("Erreur lors de la lecture du message:", error);
    }
  };

  const tradeIASimu = async () => {

    setIsLoading(true);
    setTradeIAMsg('');
    
    try {


      const response = await axios.post('/api/trade', {
        input: `Analyze the BTC/USDT market data and determine if there is a trading opportunity.
If favorable conditions are detected, provide ONLY a trading signal in the following EXACT format:
TYPE: {Long/Short}, EP: {entryPrice}, TP: {takeProfit}, SL: {stopLoss}

Example of valid response:
TYPE: Long, EP: 65000, TP: 67000, SL: 64000

Rules:
- Only respond with the exact format above
- No additional text or explanations
- All numbers must be valid prices
- TP must be higher than EP for Long, lower for Short
- SL must be lower than EP for Long, higher for Short`,
        marketData: data,
        marketInfo: marketInfo
      });

      const responseData = await response.data;
      
      if (responseData && responseData.signal) {
        try {
          const signal = responseData.signal;
          const matches = signal.match(/TYPE: (Long|Short), EP: (\d+\.?\d*), TP: (\d+\.?\d*), SL: (\d+\.?\d*)/);
          
          if (matches) {
            const [_, type, entryPrice, takeProfit, stopLoss] = matches;
            
            
            console.log('🔍 Parsed values:', {
              test: _,
              type,
              entryPrice: Number(entryPrice),
              takeProfit: Number(takeProfit),
              stopLoss: Number(stopLoss)
            });

            const newPosition: TradingPosition = {
              type: type.toLowerCase() as 'long' | 'short',
              entryPrice: Number(entryPrice),
              takeProfit: Number(takeProfit),
              stopLoss: Number(stopLoss),
              size: 1,
              timestamp: Date.now()
            };
            

            setTradeIAMsg("Trading opportunity detected!");
            setActivePosition(newPosition);
            
            const message = `The AI has detected a ${newPosition.type} Trading opportunity. The entry price is ${newPosition.entryPrice}, the take profit is ${newPosition.takeProfit} and the stop loss is ${newPosition.stopLoss}.`;
            setSubtitlesText(message);
            setIsReading(true);
            setTradeIA(false);
            await speakMessage(message);
            setIsReading(false);
            

            if (onPositionChange) {
              onPositionChange(newPosition);
            }

          } else {
            console.error('❌ Invalid signal format:', signal);
            console.error('🔍 Expected format: TYPE: {Long/Short}, EP: {number}, TP: {number}, SL: {number}');
          }
        } catch (error) {
          console.error('🔥 Error parsing trading signal:', error);
        } 
      } else {
        setIsLoading(false);
        setTradeIAMsg('No trading signal received');
        await speakMessage('The AI did not find any opportunity');

      }
    } catch (error) {
      console.error('🔥 Error in tradeIASimu:', error);
    }
    setIsLoading(false);
    setSubtitlesText('');
    setTradeIAMsg('');  
    setIsReading(false);
  };

  const [tradeIA, setTradeIA] = useState(false);

  const handleTradeIASimu = () => {
    setTradeIA(true);
    setTradeIAMsg('');
  };

  return (
    <div className={styles.simulationContainer}>
      
      {!activePosition ? (
        <button 
          className={styles.newPositionButton}
         onClick={handleTradeIASimu}
        >
          Open AI Trading
        </button>
      ) : (
        <div className={styles.activePosition}>
          <div className={styles.infoItem}>Size: <span className={styles.value}>{activePosition.size}BTC</span></div>
          <div className={styles.infoItem}>Entry Price: <span className={styles.value}>${activePosition.entryPrice}</span></div>
          <div className={styles.infoItem}>Take Profit: <span className={styles.value}>${activePosition.takeProfit}</span></div>
          <div className={styles.infoItem}>Stop Loss: <span className={styles.value}>${activePosition.stopLoss}</span></div>
          <div className={styles.infoItem}>Current PnL: <span className={styles.value}>${calculatePnL().toFixed(2)}</span></div>
          <button 
            className={styles.closeButton}
            onClick={closePosition}
          >
            Close Position
          </button>
        </div>
      )}
     {tradeIA && (
        <div className={styles.autoTradingModal}>
          <div className={styles.autoTradingModalContent}>
            <div className={styles.autoTradingDescription}>
              <h4>Auto Trading</h4>
              <p>The AI will analyze market conditions to identify trading opportunities. If favorable conditions are detected, it will automatically open simulated trading positions.</p>
              <p>{tradeIAMsg ? tradeIAMsg : 'Waiting for AI signal...'}</p>
              <div className={styles.tradeIATime}>
                <button className={styles.closeButton} onClick={tradeIASimu}>{isLoading || isReading ? 'Loading...' : 'Try'}</button>
              <button 
                className={styles.closeButton} 
                onClick={() => setTradeIA(false)}
              >
                Close
              </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <Subtitles text={subtitlesText} isVisible={isLoading} />
    </div>
  );
} 