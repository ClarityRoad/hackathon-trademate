import styles from '../styles/header.module.css';
import { FaRegCommentDots } from "react-icons/fa";
import VoiceControls from './VoiceControls';

interface HeaderProps {
  handleChatOpen: () => void;
  price: number;
  change24h: number;
  language: string;
  voice: string;
  onLanguageChange: (lang: string) => void;
  onVoiceChange: (voice: string) => void;
}

export default function Header({ 
  handleChatOpen, 
  price, 
  change24h, 
  language, 
  voice, 
  onLanguageChange, 
  onVoiceChange 
}: HeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.iacontainer}>
        <button 
          className={styles.iaButton}
          onClick={handleChatOpen}
        >
          <FaRegCommentDots />
        </button>
      </div>
      <VoiceControls 
        price={price} 
        change24h={change24h} 
        language={language} 
        voice={voice} 
        onLanguageChange={onLanguageChange} 
        onVoiceChange={onVoiceChange} 
      />
    </header>
  );
}