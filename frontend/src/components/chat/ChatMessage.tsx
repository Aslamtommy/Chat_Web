import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Check, CheckCheck, Edit2, Trash2, CheckCircle, XCircle, MoreVertical, X } from 'lucide-react';
import DeleteModal from '../Modal/DeleteModal';

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
  onEdit?: () => void;
  onDelete?: () => void;
  isEditing?: boolean;
  editedContent?: string;
  onEditChange?: (content: string) => void;
  onEditSave?: () => void;
  onEditCancel?: () => void;
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

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

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('Menu toggled for message:', _id, 'isOpen:', !isMenuOpen);
    setIsMenuOpen((prev) => !prev);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
 
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
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
    <>
      <div className={`flex ${isSelf ? 'justify-end' : 'justify-start'} mb-3`} ref={menuRef}>
        <div
          className={`p-3 rounded-2xl backdrop-blur-sm shadow-lg max-w-[85%] sm:max-w-[70%] ${
            isSelf ? 'bg-amber-500/20 text-white border border-amber-500/30' : 'bg-white/10 text-white/90'
          } relative`}
        >
          {messageType === 'text' && !isEditing && (
            <div className="flex items-start">
              <p className="break-words text-sm leading-relaxed flex-1">{content}</p>
              {isSelf && (
                <button
                  onClick={toggleMenu}
                  className="ml-2 text-white/60 hover:text-white focus:outline-none"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              )}
            </div>
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
              onClick={() => setShowFullImage(true)}
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
          {isMenuOpen && messageType === 'text' && !isEditing && isSelf && (
            <div className="absolute top-6 right-6 bg-gray-800 text-white rounded-lg shadow-lg z-10 py-2 w-32">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('Edit clicked for message:', _id);
                  onEdit?.();
                  setIsMenuOpen(false);
                }}
                className="w-full text-left px-4 py-1 hover:bg-gray-700 flex items-center text-sm"
              >
                <Edit2 className="w-4 h-4 mr-2" /> Edit
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('Delete clicked for message:', _id);
                  setIsDeleteModalOpen(true);
                  setIsMenuOpen(false);
                }}
                className="w-full text-left px-4 py-1 hover:bg-gray-700 flex items-center text-sm"
              >
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>
      
      {showFullImage && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setShowFullImage(false)}
        >
          <button
            onClick={() => setShowFullImage(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
          >
            <X className="w-8 h-8" />
          </button>
          <img
            src={content}
            alt="Full screen"
            className="max-h-[90vh] max-w-[90vw] object-contain"
          />
        </div>
      )}
      
      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => {
          console.log('Delete confirmed for message:', _id); // Add this
          onDelete?.();
        }}
        messageId={_id}
      />
    </>
  );
};

export default ChatMessage;