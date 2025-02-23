import styles from '@/styles/footer.module.css';
import Link from 'next/link';

export default function Footer() {
    return (
        <footer className={styles.footer}>
                <p>
                    Powered by 
                    <a href="https://elevenlabs.io/" style={{textDecoration: 'underline'}}>
                        ElevenLabs
                    </a>
                    & 
                    <a href="https://openai.com/" style={{textDecoration: 'underline'}}>
                        OpenAI
                    </a>
                    <br/>
                    For 
                    <a href="https://hackathon.elevenlabs.io/" style={{textDecoration: 'underline'}}>
                        Hackathon ElevenLabs x a16z Hackathon — Online Version
                    </a>
                    <br/>
                    Made with ❤️ by 
                    <a href="https://github.com/ClarityRoad" style={{textDecoration: 'underline'}}>
                        ClarityRoad 
                    </a>
                    © {new Date().getFullYear()}
                </p>
        </footer>
    );
}

{/* 
    
    export default function Footer() {
  return (
    <footer className={styles.footer}>
        <div className={styles.section}>
          <h3>TradeAI</h3>
          <p>L'analyse de marché intelligente<br/>Powered by AI</p>
          <div className={styles.socials}>
            <a href="https://github.com" target="_blank" rel="noopener">GitHub</a>
            <a href="/docs" target="_blank">Documentation</a>
          </div>
        </div>
      
      <div className={styles.copyright}>
        © {new Date().getFullYear()} TradeAI - Projet Hackathon 
        <span>🚀 Développé avec passion en 48h</span>
      </div>
    </footer>
  );
}
    
    */}