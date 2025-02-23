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
        <p className={styles.subtitle}>For Hackathon ElevenLabs x a16z Hackathon — Online Version</p>
        
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill} 
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className={styles.progressText}>
          {progress}%
        </div>

        {isLoaded && (
          <div className={styles.startSection}>
            <select className={styles.languageSelect} onChange={(e) => setLanguage(e.target.value)}>
              <option value="">Select Language</option>
              <option value="en">English</option>
              <option value="fr">French</option>
            </select>
            {language !== '' ? (
              <button 
                className={styles.playButton}
                onClick={handleStart}
            >
              <FaPlay className={styles.playIcon} />
              {isLoading ? "Loading..." : "Start Trading"}
            </button>
            ) : (
              <p>Please select a language</p>
            )}
            <p className={styles.audioWarning}>
              🔊 This application uses voice feedback.<br /> Please ensure your sound is enabled.
            </p>
          </div>

        )}
        <p className={styles.madeWithLove}>Made with ❤️ by <a href="https://github.com/ClarityRoad" style={{textDecoration: 'underline'}}>ClarityRoad</a>  © {new Date().getFullYear()}</p>
      </div>
    </div>
  );
} 