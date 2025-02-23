import styles from '@/styles/footer.module.css';

export default function Footer() {
    return (
        <footer className={styles.footer}>
                <p>
                    Powered by 
                    <a href="https://elevenlabs.io/" style={{textDecoration: 'underline'}} target="_blank" rel="noopener noreferrer">
                        ElevenLabs
                    </a>
                    & 
                    <a href="https://openai.com/" style={{textDecoration: 'underline'}} target="_blank" rel="noopener noreferrer">
                        OpenAI
                    </a>
                    <br/>
                    For 
                    <a href="https://hackathon.elevenlabs.io/" style={{textDecoration: 'underline'}} target="_blank" rel="noopener noreferrer">
                         ElevenLabs x a16z Hackathon — Online Version
                    </a>
                    <br/>
                    Made with ❤️ by 
                    <a href="https://github.com/ClarityRoad" style={{textDecoration: 'underline'}} target="_blank" rel="noopener noreferrer">
                        ClarityRoad 
                    </a>
                    © {new Date().getFullYear()}
                </p>
        </footer>
    );
}