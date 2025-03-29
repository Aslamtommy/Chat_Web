import React, { useState, useRef } from 'react';
import { Play, Pause, X } from 'lucide-react'; 

interface MessageProps {
  content: string;
  isAdmin: boolean;
  messageType?: 'text' | 'image' | 'voice';
  status: 'sending' | 'sent' | 'delivered' | 'failed';
  duration?: number;
  timestamp?: string;
}

const ChatMessage: React.FC<MessageProps> = ({
  content,
  isAdmin,
  messageType = 'text',
  status,
  duration,
  timestamp,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const getStatusColor = () => {
    switch (status) {
      case 'sending': return 'text-gray-500';
      case 'sent': return 'text-blue-500';
      case 'delivered': return 'text-green-500';
      case 'failed': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  // ✅ Format Duration for Voice
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // ✅ Handle Play and Pause
  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // ✅ Toggle Image Modal
  const toggleModal = () => {
    setIsModalOpen((prev) => !prev);
  };

  return (
    <div className={`flex ${isAdmin ? 'justify-start' : 'justify-end'} mb-3`}>
      <div
        className={`
          p-3 rounded-lg shadow-md
          ${isAdmin ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-black'}
          max-w-[75%] sm:max-w-[65%]
        `}
      >
        {/* ✅ Rendering the Correct Content Based on Message Type */}
        {messageType === 'text' && (
          <p className="break-words">{content}</p>
        )}

        {/* ✅ Image with Modal */}
        {messageType === 'image' && (
          <>
            <div
              className="cursor-pointer"
              onClick={toggleModal}
            >
              <img
                src={typeof content === 'string' ? content : URL.createObjectURL(content as unknown as File)}
                alt="chat"
                className="rounded-lg object-cover w-[150px] h-auto max-h-[180px] sm:w-[120px] sm:max-h-[150px]"
              />
            </div>

            {/* Image Modal */}
            {isModalOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
                <div className="relative max-w-[90%] max-h-[90%]">
                  <button
                    onClick={toggleModal}
                    className="absolute top-4 right-4 text-white text-2xl"
                  >
                    <X />
                  </button>
                  <img
                    src={typeof content === 'string' ? content : URL.createObjectURL(content as unknown as File)}
                    alt="chat"
                    className="rounded-lg max-w-full max-h-full"
                  />
                </div>
              </div>
            )}
          </>
        )}

        {/* ✅ WhatsApp-Like Voice Message */}
        {messageType === 'voice' && (
          <div className="flex items-center space-x-3 bg-white p-2 rounded-lg w-[180px] h-[40px] sm:w-[220px] shadow-sm">
            
            {/* Play/Pause Button */}
            <button
              onClick={togglePlay}
              className="flex items-center justify-center bg-green-500 text-white rounded-full w-8 h-8 hover:bg-green-600"
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>

            {/* Audio Element */}
            <audio
              ref={audioRef}
              src={content}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />

            {/* Duration */}
            <span className="text-sm font-medium text-gray-700">
              {formatDuration(duration || 0)}
            </span>
          </div>
        )}

        {/* ✅ Timestamp and Status */}
        <div className="flex justify-between items-center mt-1 text-xs text-gray-500">
          {timestamp && (
            <span>
              {new Date(timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          )}
          <span className={`ml-2 ${getStatusColor()}`}>
            {status === 'failed' ? 'Failed' : ''}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
