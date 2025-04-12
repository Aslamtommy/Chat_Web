import React, { useState, useRef, useEffect } from 'react';
import { Mic, Send, Paperclip } from 'lucide-react';
import Loading from '../common/Loading';

interface ChatInputProps {
  onSend: (
    messageType: 'text' | 'image' | 'voice',
    content: string | File,
    duration?: number
  ) => void;
  isDisabled: boolean;
  isUploading?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, isDisabled, isUploading = false }) => {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startRecording = async () => {
    if (isDisabled) return;
    try {
      setIsProcessing(true);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      startTimeRef.current = Date.now();

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });
        const finalDuration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        onSend('voice', audioFile, finalDuration);
        stream.getTracks().forEach((track) => track.stop());
        setIsProcessing(false);
        console.log('Recording stopped, final duration:', finalDuration);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setIsProcessing(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      console.log('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Failed to access microphone. Please allow microphone permissions.');
      setIsRecording(false);
      setIsProcessing(false);
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
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isDisabled) {
      onSend('text', message);
      setMessage('');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isDisabled) return;
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onSend('image', file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openFilePicker = () => {
    if (!isDisabled) fileInputRef.current?.click();
  };

  useEffect(() => {
    console.log('ChatInput rendered, isRecording:', isRecording, 'isDisabled:', isDisabled);
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isRecording, isDisabled]);

  return (
    <div className="p-4 bg-black/20 backdrop-blur-sm border-t border-white/10">
      <form onSubmit={handleSubmit} className="flex items-center gap-3">
        {!isRecording && !isDisabled && (
          <>
            <button
              type="button"
              onClick={openFilePicker}
              disabled={isUploading}
              className={`text-white/60 hover:text-amber-500 cursor-pointer w-5 h-5 transition-colors ${
                isUploading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isUploading ? (
                <Loading size="sm" variant="gold" />
              ) : (
                <Paperclip className="w-5 h-5" />
              )}
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
              disabled={isUploading}
            />
          </>
        )}

        <div className="flex-1 relative">
          {isRecording ? (
            <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-xl">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-white text-sm">Recording</span>
              {isProcessing ? (
                <div className="ml-auto">
                  <Loading size="sm" variant="gold" />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="bg-amber-500 hover:bg-amber-600 text-white p-2 rounded-full transition-colors ml-auto"
                >
                  <Send className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={isDisabled ? "No credits left. Buy more to chat." : "Type a message"}
              className={`w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-amber-500/50 text-white placeholder-white/40 text-sm focus:outline-none transition-colors ${
                isDisabled ? 'cursor-not-allowed opacity-50' : ''
              }`}
              disabled={isDisabled}
            />
          )}
        </div>

        <div className="flex items-center">
          {isRecording ? null : message.trim() && !isDisabled ? (
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
              className={`p-2 rounded-full transition-colors bg-transparent ${
                isDisabled || isProcessing ? 'cursor-not-allowed opacity-50' : ''
              }`}
              disabled={isDisabled || isProcessing}
            >
              {isProcessing ? (
                <Loading size="sm" variant="gold" />
              ) : (
                <Mic className="w-5 h-5 text-amber-500" />
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ChatInput;