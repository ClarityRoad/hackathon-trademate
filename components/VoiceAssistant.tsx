'use client'

import { ElevenLabsClient } from "elevenlabs";
import { useState, useEffect, useCallback } from 'react';

interface VoiceAssistantProps {
  price: number;
  change24h: number;
  isAutoMode: boolean;
  interval: number; // en minutes
  language: string;
  voice: string;
}

// Fonction pour l'appel unique
export const speakUpdate = async (price: number, change24h: number, language: string, voice: string) => {
  const apiKey = process.env.NEXT_PUBLIC_ELEVEN_LABS_API_KEY;
  if (!apiKey) {
    console.error("Clé API ElevenLabs non trouvée");
    return;
  }

  const client = new ElevenLabsClient({ apiKey });
  const direction = change24h >= 0 ? 
    (language === 'en' ? 'increase' : 'augmentation') : 
    (language === 'en' ? 'decrease' : 'baisse');
  
  const message = language === 'en' ?
    `The Bitcoin is in ${direction} by ${Math.abs(change24h).toFixed(2)}%, the current price is ${new Intl.NumberFormat('us-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price)}` :
    `Le Bitcoin est en ${direction} de ${Math.abs(change24h).toFixed(2)}%, le prix actuel est de ${new Intl.NumberFormat('us-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price)}`;

  try {
    const audio = await client.textToSpeech.convert(voice, {
      text: message,
      model_id: "eleven_multilingual_v2",
      output_format: "mp3_44100_128",
    });

    const chunks = [];
    for await (const chunk of audio) {
      chunks.push(chunk);
    }
    const audioBuffer = Buffer.concat(chunks);
    const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
    const audioUrl = URL.createObjectURL(audioBlob);
    const audioElement = new Audio(audioUrl);

    return new Promise((resolve) => {
      audioElement.onended = () => {
        URL.revokeObjectURL(audioUrl);
        resolve(true);
      };
      audioElement.play();
    });
  } catch (error) {
    console.error("Erreur lors de la synthèse vocale:", error);
    throw error;
  }
};

// Composant pour le mode automatique
export const VoiceAssistant = ({ price, change24h, isAutoMode, interval, language, voice }: VoiceAssistantProps) => {
  const [timerId, setTimerId] = useState<NodeJS.Timeout | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const speak = useCallback(async () => {
    if (isPlaying) return; // Éviter les appels multiples
    
    setIsPlaying(true);
    await speakUpdate(price, change24h, language, voice);
    setIsPlaying(false);
  }, [price, change24h, isPlaying]);

  useEffect(() => {
    if (isAutoMode && !timerId) {
      const intervalMs = interval * 60 * 1000;
      const Fivemin = 5 * 60 * 1000; // 5 minutes
      speak(); // Premier appel

      const timer = setInterval(speak, Fivemin);
      setTimerId(timer);

      return () => {
        clearInterval(timer);
        setTimerId(null);
      };
    }

    if (!isAutoMode && timerId) {
      clearInterval(timerId);
      setTimerId(null);
    }
  }, [isAutoMode, interval, speak]);

  // Nettoyer l'intervalle quand le composant est démonté
  useEffect(() => {
    return () => {
      if (timerId) {
        clearInterval(timerId);
      }
    };
  }, [timerId]);

  return null;
};

export const VoiceMessageAssistant = async (message: string, voice: string) => {
  const apiKey = process.env.NEXT_PUBLIC_ELEVEN_LABS_API_KEY;
  if (!apiKey) {
    console.error("Clé API ElevenLabs non trouvée");
    return;
  }

  try {
    const client = new ElevenLabsClient({ apiKey });
    const audio = await client.textToSpeech.convert(voice, {
      text: message,
      model_id: "eleven_multilingual_v2",
      output_format: "mp3_44100_128",
    });

    const chunks = [];
    for await (const chunk of audio) {
      chunks.push(chunk);
    }
    const audioBuffer = Buffer.concat(chunks);
    const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
    const audioUrl = URL.createObjectURL(audioBlob);
    const audioElement = new Audio(audioUrl);

    return new Promise((resolve) => {
      audioElement.onended = () => {
        URL.revokeObjectURL(audioUrl);
        resolve(true);
      };
      audioElement.play();
    });
  } catch (error) {
    console.error("Erreur lors de la synthèse vocale:", error);
    throw error;
  }
};