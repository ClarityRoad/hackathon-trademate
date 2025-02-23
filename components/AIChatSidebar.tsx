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

interface MarketData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface MarketInfo {
  high: number;
  low: number;
  volume: number;
  lastPrice: number;
  change24h: number;
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

export default function AIChatSidebar({ isOpen, onClose, data, marketInfo }: AIChatSidebarProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Bonjour, je suis l\'assistant TradeMate. Vous pouvez simplement me demander conseil, un signal de trading ou me poser des questions sur la finance.'
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
    console.log('Initialisation de la reconnaissance vocale...');
    

    async function checkMicrophoneAccess() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('Accès au microphone accordé');
        stream.getTracks().forEach(track => track.stop()); 
        initializeSpeechRecognition();
      } catch (err) {
        console.error('Erreur d\'accès au microphone:', err);
        alert('L\'accès au microphone est nécessaire pour la reconnaissance vocale');
      }
    }

    function initializeSpeechRecognition() {
      if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
        console.log('webkitSpeechRecognition est disponible');
        try {
          // @ts-expect-error
          const recognition = new webkitSpeechRecognition();
          recognition.continuous = false; 
          recognition.lang = 'fr-FR';
          recognition.interimResults = false; 

          recognition.onstart = () => {
            console.log('Reconnaissance vocale démarrée');
            setIsListening(true);
          };

          recognition.onresult = (event: SpeechRecognitionEvent) => {
            console.log('Résultat reçu:', event);
            const transcript = Array.from(event.results)
              .map((result: SpeechRecognitionResult) => result)
              .map((result: SpeechRecognitionResult) => result.transcript)
              .join('');
            console.log('Transcript:', transcript);
            setInput(prev => prev + ' ' + transcript);
          };

          recognition.onerror = (event: SpeechRecognitionError) => {
            console.log('Erreur détaillée:', {
              error: event.error,
              message: event.message,
              eventDetails: JSON.stringify(event)
            });

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
            console.log('Reconnaissance vocale terminée');
            setIsListening(false);
          };

          recognitionRef.current = recognition;
        } catch (error) {
          console.error('Erreur lors de l\'initialisation:', error);
        }
      } else {
        console.log('webkitSpeechRecognition n\'est pas disponible');
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
    console.log('Toggle listening appelé, état actuel:', isListening);
    VocalFunction();
    if (!recognitionRef.current) {
      console.error('Recognition non initialisée');
      alert('La reconnaissance vocale n\'est pas supportée par votre navigateur');
      return;
    }

    try {
      if (isListening) {
        console.log('Arrêt de la reconnaissance');
        recognitionRef.current.stop();
        setIsListening(false);
      } else {
        console.log('Démarrage de la reconnaissance');
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
      console.log('Réponse reçue du serveur:', aiResponse); 
      
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
    console.log('message', message);
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
            L&lsquo;assistant réfléchit...
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className={styles.inputContainer}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Posez votre question..."
          className={styles.input}
          disabled={isLoading}
        />
        <button 
          type="button" 
          onClick={toggleListening}
          className={styles.voiceButton}
          title={isListening ? "Arrêter la dictée" : "Commencer la dictée"}
          disabled={isLoading}
        >
          <FaMicrophone color={isListening ? '#00ff00' : '#000'} />
        </button>
        <button 
          type="submit" 
          className={styles.sendButton}
          disabled={isLoading}
        >
          Envoyer
        </button>
      </form>
    </div>
  );
} 