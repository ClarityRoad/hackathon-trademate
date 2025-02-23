import styles from '@/styles/footer.module.css';

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