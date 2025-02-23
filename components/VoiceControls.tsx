'use client'

import { useState, useEffect, useRef, useCallback } from 'react';
import styles from '../styles/tradingchart.module.css';
import { speakUpdate } from './VoiceAssistant';
import Subtitles from './Subtitles';
import { FiVolume2, FiGlobe, FiClock } from 'react-icons/fi';
import { FaAngleDown } from 'react-icons/fa';
interface VoiceControlsProps {
  price: number;
  change24h: number;
  language: string;
  voice: string;
  onLanguageChange: (lang: string) => void;
  onVoiceChange: (voiceId: string) => void;
}

export default function VoiceControls({ price, change24h, language, voice, onLanguageChange, onVoiceChange }: VoiceControlsProps) {
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [intervalMinutes, setIntervalMinutes] = useState(5);
  const [isPlaying, setIsPlaying] = useState(false);
  const [subtitlesText, setSubtitlesText] = useState('');
  const intervalIdRef = useRef<number | null>(null);
  const [autoModeSettings, setAutoModeSettings] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [marketAnalysis, setMarketAnalysis] = useState(false);
  const [autoTrading, setAutoTrading] = useState(false);


  const generateMessage = useCallback(() => {
    const direction = change24h >= 0 ? 
      (language === 'en' ? 'increase' : 'augmentation') : 
      (language === 'en' ? 'decrease' : 'baisse');
    
    const formattedPrice = new Intl.NumberFormat('us-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
    
    return language === 'en' ?
      `The Bitcoin is in ${direction} by ${Math.abs(change24h).toFixed(2)}%, the current price is ${formattedPrice}` :
      `Le Bitcoin est en ${direction} de ${Math.abs(change24h).toFixed(2)}%, le prix actuel est de ${formattedPrice}`;
  }, [change24h, language, price]);



  const handleSpeak = useCallback(async () => {
    if (!isPlaying) {
      setIsPlaying(true);
      const message = generateMessage();
      setSubtitlesText(message);
      try {
        await speakUpdate(price, change24h, language, voice);
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error('Error speaking:', error);
      } finally {
        setIsPlaying(false);
        setSubtitlesText('');
      }
    }
  }, [generateMessage, isPlaying, price, change24h, language, voice]);

  const handleAutoSpeak = useCallback(() => {
    if (!isPlaying) {
      handleSpeak();
    }
  }, [handleSpeak, isPlaying]);

  // Utiliser useRef pour stocker la version la plus récente de handleAutoSpeak
  const handleAutoSpeakRef = useRef(handleAutoSpeak);
  useEffect(() => {
    handleAutoSpeakRef.current = handleAutoSpeak;
  }, [handleAutoSpeak]);
   useEffect(() => {
    if (isAutoMode) {
      // Appeler immédiatement la version stockée dans useRef
      handleAutoSpeakRef.current();

      // Configurer l'intervalle avec la version stockée dans useRef
      const id = window.setInterval(
        () => handleAutoSpeakRef.current(),
        intervalMinutes * 60 * 1000
      );
      intervalIdRef.current = id;
    }

    // Nettoyer l'intervalle lors du démontage ou lorsque isAutoMode change
    return () => {
      if (intervalIdRef.current) {
        window.clearInterval(intervalIdRef.current);
      }
    };
  }, [isAutoMode, intervalMinutes]);


  // Auto Trading Modal
  const [autoTradingModal, setAutoTradingModal] = useState(false);
  const handleAutoTradingModal = () => {
    setAutoTradingModal(!autoTradingModal);
  };

  // UseEffect pour fermer la modal si on clique en dehors
  useEffect(() => {
    const handleClickOutside = () => {
      if (autoTradingModal) {
        setAutoTradingModal(false);
      }
    };

    if (autoTradingModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [autoTradingModal]);

  return (
    <>
      <div className={styles.voiceControls}>

        <select 
          className={styles.voiceButton} 
          value={language}
          onChange={(e) => onLanguageChange(e.target.value)}
        >
          <option value="en">English</option>
          <option value="fr">Français</option>
        </select>
        {language === 'en' ? (
        <select 
          className={styles.voiceButton} 
          value={voice}
          onChange={(e) => onVoiceChange(e.target.value)}
        >
           <option value="">CHOOSE VOICE</option>
          <option value="UgBBYS2sOqTuMpoF3BR0">Mark</option>
          <option value="9BWtsMINqrJLrRacOk9x">Aria</option>
          <option value="Xb7hH8MSUJpSbSDYk0k2">Alice</option>
        </select>
        ):(
          <select 
          className={styles.voiceButton} 
          value={voice}      
          onChange={(e) => onVoiceChange(e.target.value)}
        >
          <option value="">CHOOSE VOICE</option>
          <option value="dYjOkSQBPiH2igolJfeH">Amalia</option>
          <option value="a5n9pJUnAhX4fn7lx3uo">Martin</option>
          <option value="McVZB9hVxVSk3Equu8EH">Audrey</option>
        </select>
        )}

        <button 
          className={styles.voiceButton}
          onClick={handleSpeak}
          disabled={isPlaying || isAutoMode || voice === '' || language === '' }
        >
          {language === 'en' ? '🎙️ Try Voice' : '🎙️ Essayer la voix'}
        </button>
        
        <div className={styles.autoMode}>
          <div className={styles.autoModeHeader}>
          <button 
              className={`${styles.toggleButton} ${isAutoMode ? styles.active : ''}`}
              onClick={() => setIsAutoMode(!isAutoMode)}
              disabled={voice === '' || language === ''}
            >
               {isAutoMode ? 'ON' : 'OFF'}
              <span className={styles.toggleTrack}>
                <span className={styles.toggleThumb} />
              </span>
             
            </button>
         {autoModeSettings ? (
            <h4>{language === 'en' ? 'Auto Mode Settings' : 'Paramètres Automatiques'}</h4>
         ):(
            <h4>{language === 'en' ? 'Auto Mode' : 'Auto Mode'}</h4>
         )}
            <button onClick={() => setAutoModeSettings(!autoModeSettings)} >
             <FaAngleDown className={`${styles.icon} ${autoModeSettings ? styles.automodeactive : ''}`} />
            </button>
          </div>

          {autoModeSettings && (
            <div className={`${styles.settingsGrid} ${autoModeSettings ? styles.visible : ''}`}>
              <div className={styles.settingItem}>
                <label><FiClock /> {language === 'en' ? 'Interval' : 'Intervalle'}</label>
                <input 
                  type="number" 
                  min="1"
                  value={intervalMinutes}
                  onChange={(e) => setIntervalMinutes(Math.max(1, Number(e.target.value)))}
                  className={styles.intervalInput}
                />
                <span>{intervalMinutes === 1 ? 'minute' : 'minutes'}</span>
              </div>

              <div className={styles.settingItem}>
                <label><FiVolume2 /> {language === 'en' ? 'Volume' : 'Volume'}</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  onChange={(e) => setVolume(Number(e.target.value))}
                  value={volume}
                  className={styles.volumeSlider}
                />
              </div>

              <div className={styles.settingItem}>
                <label><FiGlobe /> {language === 'en' ? 'Language' : 'Langue'}</label>
                <select className={styles.languageSelect} value={language} onChange={(e) => onLanguageChange(e.target.value)}>
                  <option value="en">English</option>
                  <option value="fr">Français</option>
                </select>
              </div>

              <div className={styles.advancedSettings}>
                <label className={styles.checkboxLabel}>
                  <input 
                    type="checkbox" 
                    onChange={(e) => {
                      setAutoTrading(e.target.checked);
                      handleAutoTradingModal();
                    }}
                    checked={autoTrading}
                    className={styles.checkboxInput}
                  />
                  {language === 'en' ? 'Trading auto' : 'Auto trading'}
                </label>
                
                <label className={styles.checkboxLabel}>
                  <input 
                    type="checkbox" 
                    onChange={(e) => setMarketAnalysis(e.target.checked)}
                    checked={marketAnalysis}
                    className={styles.checkboxInput}
                  />
                  {language === 'en' ? 'Market analysis' : 'Analyse marché'}
                </label>
              </div>
            </div>
          )}
        </div>
        
      </div>
      {autoTradingModal && (
        <div className={styles.autoTradingModal}>
          <div className={styles.autoTradingModalContent}>
            <div className={styles.autoTradingDescription}>
              <h4>{language === 'en' ? 'Auto Trading' : 'Trading automatique'}</h4>
              <p>
                {language === 'en' 
                  ? `The AI will analyze market conditions every ${intervalMinutes} minutes to identify trading opportunities. If favorable conditions are detected, it will automatically open simulated trading positions.
                     
                     During voice updates, you will also receive information about any open positions, including current profit/loss status.`
                  : `L'IA analysera les conditions du marché toutes les ${intervalMinutes} minutes pour identifier les opportunités de trading. Si des conditions favorables sont détectées, elle ouvrira automatiquement des positions de trading simulées.
                     
                     Lors des mises à jour vocales, vous recevrez également des informations sur les positions ouvertes, y compris l'état des profits/pertes latents.`
                }
              </p>
              <button 
                className={styles.closeButton} 
                onClick={() => setAutoTradingModal(false)}
              >
                {language === 'en' ? 'Close' : 'Fermer'}
              </button>
            </div>
          </div>
        </div>
      )}
      <Subtitles text={subtitlesText} isVisible={isPlaying} />
    </>
  );
} 