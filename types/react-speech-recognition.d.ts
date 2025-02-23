declare module 'react-speech-recognition' {
  interface SpeechRecognition {
    startListening: (options?: { continuous?: boolean; language?: string }) => void;
    stopListening: () => void;
    abortListening: () => void;
  }

  interface UseSpeechRecognitionResult {
    transcript: string;
    listening: boolean;
    resetTranscript: () => void;
    browserSupportsSpeechRecognition: () => boolean;
  }

  const SpeechRecognition: SpeechRecognition;
  export const useSpeechRecognition: () => UseSpeechRecognitionResult;
  export default SpeechRecognition;
} 