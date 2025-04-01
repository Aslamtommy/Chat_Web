import React, { useState, useRef, useEffect } from 'react';
import { Mic, Send, Paperclip } from 'lucide-react';

interface ChatInputProps {
  onSend: (
    messageType: 'text' | 'image' | 'voice',
    content: string | File,
    duration?: number
  ) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend }) => {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [, forceUpdate] = useState(0); // Dummy state to force re-render
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });
        onSend('voice', audioFile, duration);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);

      // Clear any existing timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      timerRef.current = setInterval(() => {
        setDuration((prev) => {
          const newDuration = prev + 1;
          console.log('Timer tick, duration:', newDuration); // Debug log
          forceUpdate(newDuration); // Force re-render
          return newDuration;
        });
      }, 1000);

      console.log('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Failed to access microphone. Please allow microphone permissions.');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      console.log('Recording stopped, final duration:', duration);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSend('text', message);
      setMessage('');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onSend('image', file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isRecording]);

  return (
    <div className="p-4 bg-black/20 backdrop-blur-sm border-t border-white/10">
      <form onSubmit={handleSubmit} className="flex items-center gap-3">
        {!isRecording && (
          <>
            <Paperclip
              onClick={openFilePicker}
              className="text-white/60 hover:text-amber-500 cursor-pointer w-5 h-5 transition-colors"
            />
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />
          </>
        )}

        <div className="flex-1 relative">
          {isRecording ? (
            <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-xl">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-white text-sm">
                {formatDuration(duration)}
              </span>
              <button
                type="button"
                onClick={stopRecording}
                className="bg-amber-500 hover:bg-amber-600 text-white p-2 rounded-full transition-colors ml-auto"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message"
              className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-amber-500/50 text-white placeholder-white/40 text-sm focus:outline-none transition-colors"
            />
          )}
        </div>

        <div className="flex items-center">
          {isRecording ? null : message.trim() ? (
            <button
              type="submit"
              className="bg-amber-500 hover:bg-amber-600 text-white p-2 rounded-full transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={startRecording}
              className="p-2 rounded-full transition-colors bg-transparent"
            >
              <Mic className="w-5 h-5 text-amber-500" />
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ChatInput;