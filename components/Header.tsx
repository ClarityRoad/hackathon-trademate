import styles from '../styles/header.module.css';
import { FaRegCommentDots } from "react-icons/fa";
import VoiceControls from './VoiceControls';

export default function Header( {handleChatOpen}: {handleChatOpen: () => void}  ) {
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
          <VoiceControls price={0} change24h={0} language="en" voice="en" onLanguageChange={() => {}} onVoiceChange={() => {}} />
        </header>
    );
}