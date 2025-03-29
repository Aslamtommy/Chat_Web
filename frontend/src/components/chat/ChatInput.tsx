import React, { useState, useRef } from 'react';
import { Mic, Send, Paperclip, X } from 'lucide-react'; // Using lucide icons

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
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // ✅ Convert Blob to File
  const blobToFile = (blob: Blob, fileName: string): File => {
    return new File([blob], fileName, { type: 'audio/mpeg' });
  };

  // ✅ Start Recording
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

      // Start timer
      const timerId = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);

      setTimer(timerId);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  // ✅ Stop Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);

      if (timer) {
        clearInterval(timer);
        setTimer(null);
      }
    }
  };

  // ✅ Send Voice Message
  const sendVoiceMessage = () => {
    if (audioBlob) {
      const audioFile = blobToFile(audioBlob, `voice_${Date.now()}.mp3`);
      onSend('voice', audioFile, duration);
      setAudioBlob(null);
      setDuration(0);
      setIsRecording(false);
    }
  };

  // ✅ Handle Form Submission (Text Message)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSend('text', message);
      setMessage('');
    }
  };

  // ✅ Handle File Upload (Images)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onSend('image', file);
    }
  };

  // ✅ Open File Picker
  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  // ✅ Format Duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="p-3 bg-gray-100 border-t border-gray-300">
      <form onSubmit={handleSubmit} className="flex items-center space-x-2">

        {/* Attach Icon */}
        <Paperclip
          onClick={openFilePicker}
          className="text-gray-500 cursor-pointer hover:text-blue-500 w-5 h-5"
        />

        {/* File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept="image/*"
          className="hidden"
        />

        {/* Voice Recorder */}
        {isRecording ? (
          <div className="flex items-center space-x-1">
            <span className="text-xs text-gray-700">{formatDuration(duration)}</span>
            <X
              onClick={stopRecording}
              className="text-red-500 cursor-pointer w-5 h-5"
            />
          </div>
        ) : (
          <Mic
            onClick={startRecording}
            className="text-green-500 cursor-pointer w-5 h-5 hover:text-green-600"
          />
        )}

        {/* Text Input */}
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message"
          className="flex-1 p-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm"
        />

        {/* Send Button */}
        {audioBlob ? (
          <Send
            onClick={sendVoiceMessage}
            className="text-blue-500 cursor-pointer w-5 h-5 hover:text-blue-600"
          />
        ) : (
          <button
            type="submit"
            className="bg-blue-500 text-white px-2 py-1 rounded-lg hover:bg-blue-600"
          >
            <Send size={16} />
          </button>
        )}
      </form>
    </div>
  );
};

export default ChatInput;
