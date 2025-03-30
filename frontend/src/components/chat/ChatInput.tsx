import React, { useState, useRef, useEffect } from 'react';
import { Mic, Send, Paperclip, Pause, X } from 'lucide-react';

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
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const blobToFile = (blob: Blob, fileName: string): File => {
    return new File([blob], fileName, { type: 'audio/mpeg' });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mpeg' });
        setAudioBlob(audioBlob);
        audioChunksRef.current = [];
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
      setIsRecording(false);
    }
  };

  const stopRecording = (shouldSend: boolean = false) => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (shouldSend && audioBlob) {
        sendVoiceMessage();
      }
    }
  };

  const sendVoiceMessage = () => {
    if (audioBlob) {
      const audioFile = blobToFile(audioBlob, `voice_${Date.now()}.mp3`);
      onSend('voice', audioFile, duration);
      setAudioBlob(null);
      setDuration(0);
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

  const handleRecordClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stream?.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

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
            <div className="flex items-center justify-between bg-white/5 px-4 py-2 rounded-xl">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-white">{formatDuration(duration)}</span>
              </div>
              <button
                type="button"
                onClick={() => stopRecording()}
                className="text-white hover:text-red-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <input
              ref={inputRef}
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message"
              className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-amber-500/50 text-white placeholder-white/40 text-sm focus:outline-none transition-colors"
            />
          )}
        </div>

        <div className="flex items-center">
          {isRecording ? (
            <button
              type="button"
              onClick={() => stopRecording(true)}
              className="bg-amber-500 hover:bg-amber-600 text-white p-2 rounded-full transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          ) : (
            <>
              {message.trim() ? (
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-600 text-white p-2 rounded-full transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  className={`p-2 rounded-full transition-colors ${
                    isRecording ? 'bg-amber-500/20' : 'bg-transparent'
                  }`}
                  onClick={handleRecordClick}
                >
                  {isRecording ? (
                    <Pause className="w-5 h-5 text-amber-500" />
                  ) : (
                    <Mic className="w-5 h-5 text-amber-500" />
                  )}
                </button>
              )}
            </>
          )}
        </div>
      </form>
    </div>
  );
};

export default ChatInput;