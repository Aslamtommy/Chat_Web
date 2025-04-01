import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Check, CheckCheck, Edit2, Trash2, CheckCircle, XCircle } from 'lucide-react';

interface MessageProps {
  _id: string;
  content: string;
  isSelf: boolean;
  messageType?: 'text' | 'image' | 'voice' | 'screenshot';
  status: 'sending' | 'sent' | 'delivered' | 'failed';
  duration?: number;
  timestamp?: string;
  isEdited?: boolean;
  isDeleted?: boolean;
  senderId?: any;
  onEdit?: () => void; // Updated to match ChatList's signature
  onDelete?: () => void;
  isEditing?: boolean; // New prop to indicate if this message is being edited
  editedContent?: string; // New prop for the edited content
  onEditChange?: (content: string) => void; // New prop to update edited content
  onEditSave?: () => void; // New prop to save the edit
  onEditCancel?: () => void; // New prop to cancel the edit
}

const ChatMessage: React.FC<MessageProps> = ({
  _id,
  content,
  isSelf,
  messageType = 'text',
  status,
  duration = 0,
  timestamp,
  isEdited = false,
  isDeleted = false,
  onEdit,
  onDelete,
  isEditing = false,
  editedContent = '',
  onEditChange,
  onEditSave,
  onEditCancel,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  const getStatusColor = () => {
    switch (status) {
      case 'sending':
        return 'text-white/50';
      case 'sent':
        return 'text-amber-300';
      case 'delivered':
        return 'text-amber-500';
      case 'failed':
        return 'text-red-400';
      default:
        return 'text-white/50';
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      if (progressInterval.current) clearInterval(progressInterval.current);
    } else {
      audioRef.current.play();
      startProgressTracker();
    }
    setIsPlaying(!isPlaying);
  };

  const startProgressTracker = () => {
    if (progressInterval.current) clearInterval(progressInterval.current);
    progressInterval.current = setInterval(() => {
      if (audioRef.current) {
        const currentProgress = (audioRef.current.currentTime / duration) * 100;
        setProgress(Math.min(currentProgress, 100));
        setCurrentTime(audioRef.current.currentTime);
      }
    }, 100);
  };

  useEffect(() => {
    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
      if (audioRef.current) audioRef.current.pause();
    };
  }, []);

  if (isDeleted) {
    return (
      <div className={`flex ${isSelf ? 'justify-end' : 'justify-start'} mb-3`}>
        <div className="p-3 rounded-2xl backdrop-blur-sm shadow-lg max-w-[85%] sm:max-w-[70%] bg-gray-500/20 text-white/50 italic">
          This message was deleted
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isSelf ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`p-3 rounded-2xl backdrop-blur-sm shadow-lg max-w-[85%] sm:max-w-[70%] ${
          isSelf ? 'bg-amber-500/20 text-white border border-amber-500/30' : 'bg-white/10 text-white/90'
        }`}
      >
        {messageType === 'text' && !isEditing && (
          <p className="break-words text-sm leading-relaxed">{content}</p>
        )}
        {messageType === 'text' && isEditing && (
          <div className="flex flex-col space-y-2">
            <input
              type="text"
              value={editedContent}
              onChange={(e) => onEditChange?.(e.target.value)}
              className="w-full p-2 rounded-lg bg-gray-800 text-white border border-amber-500/30 focus:outline-none focus:border-amber-500"
              autoFocus
            />
            <div className="flex space-x-2">
              <button
                onClick={onEditSave}
                className="text-xs text-green-400 hover:text-green-300 flex items-center"
              >
                <CheckCircle className="w-4 h-4 mr-1" /> Save
              </button>
              <button
                onClick={onEditCancel}
                className="text-xs text-red-400 hover:text-red-300 flex items-center"
              >
                <XCircle className="w-4 h-4 mr-1" /> Cancel
              </button>
            </div>
          </div>
        )}
        {(messageType === 'image' || messageType === 'screenshot') && (
          <img
            src={content}
            alt="chat"
            className="rounded-xl max-w-[180px] sm:max-w-[200px] cursor-pointer hover:opacity-90 transition-opacity duration-300"
          />
        )}
        {messageType === 'voice' && (
          <div className="flex items-center gap-3 min-w-[200px] sm:min-w-[250px]">
            <button
              onClick={togglePlay}
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isSelf ? 'bg-amber-500/30' : 'bg-white/20'
              }`}
            >
              {isPlaying ? (
                <Pause className={`w-4 h-4 ${isSelf ? 'text-amber-500' : 'text-white'}`} />
              ) : (
                <Play className={`w-4 h-4 ${isSelf ? 'text-amber-500' : 'text-white'}`} />
              )}
            </button>
            <div className="flex-1">
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full ${isSelf ? 'bg-amber-500/60' : 'bg-white/60'} rounded-full transition-all duration-300`}
                  style={{ width: `${isPlaying ? progress : 0}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-white/60">
                  {formatDuration(isPlaying ? currentTime : duration)}
                </span>
                {isSelf && (
                  <span className="flex items-center">
                    {status === 'delivered' && <CheckCheck className="w-3 h-3 text-amber-500" />}
                    {status === 'sent' && <Check className="w-3 h-3 text-amber-300" />}
                  </span>
                )}
              </div>
            </div>
            <audio ref={audioRef} src={content} onEnded={() => setIsPlaying(false)} className="hidden" />
          </div>
        )}
        {isSelf && messageType === 'text' && !isEditing && (
          <div className="flex space-x-2 mt-2">
            <button
              onClick={() => {
                console.log('Edit button clicked for message:', _id); // Debugging
                onEdit?.();
              }}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center"
            >
              <Edit2 className="w-3 h-3 mr-1" /> Edit
            </button>
            <button
              onClick={() => {
                console.log('Delete button clicked for message:', _id); // Debugging
                onDelete?.();
              }}
              className="text-xs text-red-400 hover:text-red-300 flex items-center"
            >
              <Trash2 className="w-3 h-3 mr-1" /> Delete
            </button>
          </div>
        )}
        <div className="flex items-center justify-end mt-1.5 space-x-1">
          <span className="text-[10px] text-white/40">
            {timestamp ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
          </span>
          {isEdited && <span className="text-[10px] text-white/50">Edited</span>}
          {isSelf && (
            <span className={`text-[10px] ${getStatusColor()}`}>
              {status === 'sending' && 'Sending...'}
              {status === 'sent' && 'Sent'}
              {status === 'delivered' && 'Delivered'}
              {status === 'failed' && 'Failed'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;