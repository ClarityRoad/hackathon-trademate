'use client'

import styles from '../styles/subtitles.module.css';

interface SubtitlesProps {
  text: string;
  isVisible: boolean;
}

export default function Subtitles({ text, isVisible }: SubtitlesProps) {
  return (
    <div className={`${styles.subtitlesContainer} ${isVisible ? styles.visible : ''}`}>
      <div className={styles.subtitlesText}>
        {text}
      </div>
    </div>
  );
} 