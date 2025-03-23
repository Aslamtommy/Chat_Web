import React, { useState, useRef  } from 'react';
import Button from '../common/Button';
import { FaImage, FaMicrophone, FaStop } from 'react-icons/fa';

interface MessageInputProps {
  sendMessage: (message: string | File, messageType: 'text' | 'image' | 'voice') => void;
}

const MessageInput: React.FC<MessageInputProps> = ({ sendMessage }) => {
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0); // Timer in seconds
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Start recording audio with timer
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach((track) => track.stop());
        setRecordingTime(0); // Reset timer
        if (timerRef.current) clearInterval(timerRef.current);
      };

      mediaRecorder.start();
      setRecording(true);

      // Start timer
      const startTime = Date.now();
      timerRef.current = setInterval(() => {
        setRecordingTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  // Stop recording audio
  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  // Handle file upload
  const handleUpload = async (file: File, type: 'image' | 'voice') => {
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(
        `http://localhost:5000/user/upload/${type === 'image' ? 'image' : 'audio'}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: formData,
        }
      );

      if (!response.ok) throw new Error(`Upload failed with status: ${response.status}`);
      const data = await response.json();
      if (data.success) {
        sendMessage(data.data.url, type);
        if (type === 'voice') setAudioBlob(null);
        if (type === 'image') setPreviewUrl(null);
      } else {
        console.error('Upload failed:', data.error);
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (audioBlob) {
      const audioFile = new File([audioBlob], 'voice-message.webm', { type: 'audio/webm' });
      handleUpload(audioFile, 'voice');
    } else if (file) {
      handleUpload(file, 'image');
    } else if (text.trim()) {
      sendMessage(text, 'text');
      setText('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-white border-t flex flex-col gap-3">
      {previewUrl && (
        <div className="relative max-w-xs">
          <img src={previewUrl} alt="Preview" className="max-w-full rounded-lg shadow-sm" />
          <button
            type="button"
            onClick={() => {
              setFile(null);
              setPreviewUrl(null);
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
            className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
          >
            ×
          </button>
        </div>
      )}
      {audioBlob && !uploading && (
        <div className="max-w-xs">
          <audio controls src={URL.createObjectURL(audioBlob)} className="w-full" />
          <button type="button" onClick={() => setAudioBlob(null)} className="mt-2 text-red-500">
            Remove
          </button>
        </div>
      )}
      {recording && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="inline-flex items-center px-2 py-1 bg-red-100 text-red-600 rounded-full">
            <span className="w-2 h-2 bg-red-600 rounded-full mr-1 animate-pulse"></span>
            Recording
          </span>
          <span>{recordingTime}s</span>
        </div>
      )}
      <div className="flex gap-3">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 p-2 border rounded-md text-text"
          disabled={uploading || recording}
        />
        <input
          type="file"
          accept="image/*,audio/*"
          onChange={(e) => {
            const selectedFile = e.target.files?.[0] || null;
            setFile(selectedFile);
            setPreviewUrl(selectedFile && selectedFile.type.startsWith('image/') ? URL.createObjectURL(selectedFile) : null);
          }}
          className="hidden"
          id="image-upload"
          ref={fileInputRef}
          disabled={uploading || recording}
        />
        <label htmlFor="image-upload" className="cursor-pointer p-2 text-secondary hover:text-primary">
          <FaImage size={20} />
        </label>
        <button
          type="button"
          onClick={recording ? stopRecording : startRecording}
          className="p-2 text-secondary hover:text-primary"
          disabled={uploading}
        >
          {recording ? <FaStop size={20} /> : <FaMicrophone size={20} />}
        </button>
        <Button
          type="submit"
          className="bg-primary text-white px-4 py-2 rounded-md"
          disabled={uploading || recording}
        >
          {uploading ? 'Uploading...' : 'Send'}
        </Button>
      </div>
    </form>
  );
};

export default MessageInput;