import React, { useState, useRef } from 'react';

interface VoiceRecorderProps {
  onStop: (audioBlob: Blob, duration: number) => void;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onStop }) => {
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      });

      mediaRecorder.addEventListener('stop', () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mpeg' });
        const duration = (Date.now() - startTimeRef.current) / 1000;
        onStop(audioBlob, duration);
      });

      mediaRecorder.start();
      startTimeRef.current = Date.now();
      setRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  return (
    <div>
      {recording ? (
        <button
          onClick={stopRecording}
          className="bg-red-500 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Stop Recording
        </button>
      ) : (
        <button
          onClick={startRecording}
          className="bg-green-500 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Record Voice
        </button>
      )}
    </div>
  );
};

export default VoiceRecorder;
