'use client'

import { useState, useEffect } from 'react';
import styles from '@/styles/loader.module.css';
import { FaPlay } from 'react-icons/fa';
import { speakUpdate } from './VoiceAssistant';
import { sleep } from 'openai/core.mjs';

interface LoaderProps {
  onLoadingComplete: () => void;
  currentPrice: number;
}

export default function Loader({ onLoadingComplete, currentPrice }: LoaderProps) {
  const [progress, setProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsLoaded(true);
          return 100;
        }
        return prev + 1;
      });
    }, 20);

    return () => clearInterval(interval);
  }, []);

  const handleStart = async () => {
    setIsLoading(true);
    await sleep(2000); // Attendre 2 seconde avant de commencer le trading
    onLoadingComplete();
    await speakUpdate(currentPrice, 0, language, "pqHfZKP75CvOlQylNhV4");
   
  };

  return (
    <div className={styles.loaderContainer}>
      <div className={styles.loader}>
        <h1 className={styles.title}>TradeMate AI</h1>
        <p className={styles.subtitle}>Powered by ElevenLabs & OpenAI</p>
        <p className={styles.subtitle}>
          Made for the ElevenLabs x a16z Hackathon
        </p>
        
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill} 
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className={styles.progressText}>
          {progress}% {progress === 100 ? '- Ready!' : '- Loading...'}
        </div>

        {isLoaded && (
          <div className={styles.startSection}>
            <select 
              className={styles.languageSelect} 
              onChange={(e) => setLanguage(e.target.value)}
              value={language}
            >
              <option value="">Choose Your Language</option>
              <option value="en">🇬🇧 English</option>
              <option value="fr">🇫🇷 French</option>
            </select>
            
            {language ? (
              <button 
                className={styles.playButton}
                onClick={handleStart}
                disabled={isLoading}
              >
                <FaPlay className={styles.playIcon} />
                {isLoading ? "Initializing..." : "Start Trading"}
              </button>
            ) : (
              <p className={styles.audioWarning}>
                Please select your preferred language to continue
              </p>
            )}
            
            <p className={styles.audioWarning}>
              🔊 Enhanced Experience with Voice Feedback<br />
              Make sure your audio is enabled for the best trading experience
            </p>
          </div>
        )}
        
        <p className={styles.madeWithLove}>
          Crafted with ❤️ by <a href="https://github.com/ClarityRoad" target="_blank" rel="noopener noreferrer">ClarityRoad</a> © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
} 