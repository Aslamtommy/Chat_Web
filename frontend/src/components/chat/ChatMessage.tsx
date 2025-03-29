import { useState, useRef } from 'react';
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
      case 'sending': return 'text-gray-400';
      case 'sent': return 'text-blue-400';
      case 'delivered': return 'text-green-400';
      case 'failed': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

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

  const toggleModal = () => setIsModalOpen((prev) => !prev);

  return (
    <div className={`flex ${isAdmin ? 'justify-start' : 'justify-end'} mb-4`}>
      <div
        className={`p-3 rounded-lg shadow-md max-w-[70%] ${
          isAdmin ? 'bg-gray-200 text-gray-800' : 'bg-green-500 text-white'
        }`}
      >
        {messageType === 'text' && <p className="break-words">{content}</p>}

        {messageType === 'image' && (
          <>
            <img
              src={content}
              alt="chat"
              className="rounded-lg max-w-[200px] cursor-pointer"
              onClick={toggleModal}
            />
            {isModalOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                <div className="relative">
                  <button className="absolute top-2 right-2 text-white" onClick={toggleModal}>
                    <X size={24} />
                  </button>
                  <img src={content} alt="chat" className="max-w-[90%] max-h-[90vh]" />
                </div>
              </div>
            )}
          </>
        )}

        {messageType === 'voice' && (
          <div className="flex items-center space-x-2 bg-white p-2 rounded-lg w-[200px]">
            <button
              onClick={togglePlay}
              className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center"
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <audio ref={audioRef} src={content} onEnded={() => setIsPlaying(false)} className="hidden" />
            <span className="text-sm text-gray-700">{formatDuration(duration)}</span>
          </div>
        )}

        <div className="flex justify-between items-center mt-1 text-xs">
          {timestamp && (
            <span className={isAdmin ? 'text-gray-600' : 'text-white'}>
              {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <span className={getStatusColor()}>{status === 'failed' ? 'Failed' : ''}</span>
        </div>
      </div >
    </div>
  );
};

export default ChatMessage;