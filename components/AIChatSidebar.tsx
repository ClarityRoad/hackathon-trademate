'use client'

import { useState, useEffect, useRef } from 'react';
import styles from '@/styles/aichat.module.css';
import { IoClose } from 'react-icons/io5';
import { FaMicrophone } from 'react-icons/fa';
import axios from 'axios';
import { AiFillSound } from "react-icons/ai";
import { IoCopy } from "react-icons/io5";
import { VoiceMessageAssistant } from './VoiceAssistant';
import { CandlestickData } from 'lightweight-charts';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  data: CandlestickData[];
  marketInfo: {
    high: number;
    low: number;
    volume: number;
    lastPrice: number;
    change24h: number;
  };
  language: string;
}

// Ajoutez cette interface pour le type de reconnaissance vocale
interface WebkitSpeechRecognition {
  continuous: boolean;
  lang: string;
  interimResults: boolean;
  onstart: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionError) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionError {
  error: string;
  message?: string;
}

interface SpeechRecognitionResult {
  transcript: string;
  isFinal: boolean;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

export default function AIChatSidebar({ isOpen, onClose, data, marketInfo, language }: AIChatSidebarProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: language === 'en' ? 'Hello, I am the TradeMate assistant. You can simply ask me for advice, a trading signal or ask me questions about finance.' : 'Bonjour, je suis l\'assistant TradeMate. Vous pouvez simplement me demander conseil, un signal de trading ou me poser des questions sur la finance.'
    }
  ]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const recognitionRef = useRef<WebkitSpeechRecognition | null>(null);
  const [copyIconRotating, setCopyIconRotating] = useState<number | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // UseEffect pour fermer la sidebar si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Fonction pour la reconnaissance vocale
  const VocalFunction = () => {

    

    async function checkMicrophoneAccess() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        stream.getTracks().forEach(track => track.stop()); 
        initializeSpeechRecognition();
      } catch (err) {
        console.error('Erreur d\'accès au microphone:', err);
        alert('L\'accès au microphone est nécessaire pour la reconnaissance vocale');
      }
    }

    function initializeSpeechRecognition() {
      if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {

        try {
          // @ts-expect-error webkitSpeechRecognition is not typed
          const recognition = new webkitSpeechRecognition();
          recognition.continuous = false; 
          recognition.lang = 'en-US';
          recognition.interimResults = false; 

          recognition.onstart = () => {

            setIsListening(true);
          };

          recognition.onresult = (event: SpeechRecognitionEvent) => {

            const transcript = Array.from(event.results)
              .map((result: SpeechRecognitionResult) => result)
              .map((result: SpeechRecognitionResult) => result.transcript)
              .join('');

            setInput(prev => prev + ' ' + transcript);
          };

          recognition.onerror = (event: SpeechRecognitionError) => {

            switch (event.error) {
              case 'network':
                console.log('Erreur réseau - Essayez en HTTPS ou sur un serveur local');
                break;
              case 'not-allowed':
                console.log('Accès au microphone refusé');
                break;
              case 'no-speech':
                console.log('Aucune parole détectée');
                break;
              default:
                console.error('Erreur de reconnaissance vocale:', event.error);
            }
            
            setIsListening(false);
          };

          recognition.onend = () => {

            setIsListening(false);
          };

          recognitionRef.current = recognition;
        } catch (error) {
          console.error('Erreur lors de l\'initialisation:', error);
        }
      } else {

      }
    }

    checkMicrophoneAccess();

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  };

  // Fonction pour le bouton de reconnaissance vocale
  const toggleListening = () => {

    VocalFunction();
    if (!recognitionRef.current) {
      console.error('Recognition non initialisée');
      alert('La reconnaissance vocale n\'est pas supportée par votre navigateur');
      return;
    }

    try {
      if (isListening) {

        recognitionRef.current.stop();
        setIsListening(false);
      } else {

        setInput('');
        recognitionRef.current.start();
      }
    } catch (error) {
      console.error('Erreur lors du toggle:', error);
      setIsListening(false);
    }
  };

  // Fonction pour l'appel à l'API OpenAI
  const aiCall = async (input: string) => {
    try {
      const response = await axios.post('/api/ai', {
        input,
        threadId,
        marketData: data,
        marketInfo: marketInfo
      });
      
      if (response.data.threadId) {
        setThreadId(response.data.threadId);
      }
      
      return response.data.response;
    } catch (error) {
      console.error('Erreur lors de l\'appel à l\'API:', error);
      throw error;
    }
  };

  // Fonction pour le bouton d'envoi du message
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const aiResponse = await aiCall(input);

      
      const assistantMessage: Message = {
        role: 'assistant',
        content: typeof aiResponse === 'string' ? aiResponse : aiResponse.text || 'Erreur de format de réponse'
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Erreur:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Désolé, une erreur s'est produite. Veuillez réessayer."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour le bouton de copie du message
  const handleCopy = (index: number, content: string) => {
    navigator.clipboard.writeText(content);
    setCopyIconRotating(index);
    setTimeout(() => setCopyIconRotating(null), 300);
  };

  // Fonction pour lire le message assistant
  const [isReading, setIsReading] = useState(false);
  const speakMessage = async (message: string) => {

    try {
      setIsReading(true);
      await VoiceMessageAssistant(message, "21m00Tcm4TlvDq8ikWAM");
      await new Promise(resolve => setTimeout(resolve, 1000));  
      setIsReading(false);
    } catch (error) {
      console.error("Erreur lors de la lecture du message:", error);
      setIsReading(false);
    }
  };

  return (
    <div 
      ref={sidebarRef}
      className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}
    >
      <div className={styles.header}>
        <h2>Assistant Trading</h2>
        <button onClick={onClose} className={styles.closeButton}>
          <IoClose />
        </button>
      </div>
      
      <div className={styles.messageContainer}>
        {messages.map((message, index) => (
          <div 
            key={index}
            className={`${styles.message} ${styles[message.role]} ${message.role === 'assistant' ? styles.assistantVoc : ''}`}
          >
            {message.role === 'assistant' ? (
              <>
                <div dangerouslySetInnerHTML={{ 
                  __html: message.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') 
                }} />
                <button 
                  onClick={() => speakMessage(message.content)} 
                  className={styles.soundIcon}
                >
                  {!isReading ? <AiFillSound /> : <AiFillSound color="blue"/>}
                </button>
                <button 
                  onClick={() => handleCopy(index, message.content)} 
                  className={`${styles.copyIcon} ${copyIconRotating === index ? styles.copyIconRotate : ''}`}
                >
                  <IoCopy />
                </button>
              </>
            ) : (
              message.content
            )}
          </div>
        ))}
        {isLoading && (
          <div className={styles.loading}>
            {language === 'en' ? 'The assistant is thinking...' : 'L\'assistant réfléchit...'}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className={styles.inputContainer}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={language === 'en' ? 'Ask your question...' : 'Posez votre question...'}
          className={styles.input}
          disabled={isLoading}
        />
        <button 
          type="button" 
          onClick={toggleListening}
          className={styles.voiceButton}
          title={isListening ? (language === 'en' ? "Stop dictation" : "Arrêter la dictée") : (language === 'en' ? "Start dictation" : "Commencer la dictée")}
          disabled={isLoading}
        >
          <FaMicrophone color={isListening ? '#00ff00' : '#000'} />
        </button>
        <button 
          type="submit" 
          className={styles.sendButton}
          disabled={isLoading}
        >
          {language === 'en' ? 'Send' : 'Envoyer'}
        </button>
      </form>
    </div>
  );
} 