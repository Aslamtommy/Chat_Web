import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Check, CheckCheck } from 'lucide-react';

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
  duration = 0,
  timestamp,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  const getStatusColor = () => {
    switch (status) {
      case 'sending': return 'text-white/50';
      case 'sent': return 'text-amber-300';
      case 'delivered': return 'text-amber-500';
      case 'failed': return 'text-red-400';
      default: return 'text-white/50';
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
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    } else {
      audioRef.current.play();
      startProgressTracker();
    }
    setIsPlaying(!isPlaying);
  };

  const startProgressTracker = () => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }

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
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  return (
    <div className={`flex ${isAdmin ? 'justify-start' : 'justify-end'} mb-3`}>
      <div
        className={`p-3 rounded-2xl backdrop-blur-sm shadow-lg max-w-[85%] sm:max-w-[70%] ${
          isAdmin 
            ? 'bg-white/10 text-white/90' 
            : 'bg-amber-500/20 text-white border border-amber-500/30'
        }`}
      >
        {messageType === 'text' && (
          <p className="break-words text-sm leading-relaxed">{content}</p>
        )}

        {messageType === 'image' && (
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
                isAdmin ? 'bg-white/20' : 'bg-amber-500/30'
              }`}
            >
              {isPlaying ? (
                <Pause className={`w-4 h-4 ${isAdmin ? 'text-white' : 'text-amber-500'}`} />
              ) : (
                <Play className={`w-4 h-4 ${isAdmin ? 'text-white' : 'text-amber-500'}`} />
              )}
            </button>

            <div className="flex-1">
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    isAdmin ? 'bg-white/60' : 'bg-amber-500/60'
                  } rounded-full transition-all duration-300`}
                  style={{ width: `${isPlaying ? progress : 0}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-white/60">
                  {formatDuration(isPlaying ? currentTime : duration)}
                </span>
                {!isAdmin && (
                  <span className="flex items-center">
                    {status === 'delivered' && <CheckCheck className="w-3 h-3 text-amber-500" />}
                    {status === 'sent' && <Check className="w-3 h-3 text-amber-300" />}
                  </span>
                )}
              </div>
            </div>
            <audio
              ref={audioRef}
              src={content}
              onEnded={() => {
                setIsPlaying(false);
                setProgress(0);
                setCurrentTime(0);
              }}
              className="hidden"
            />
          </div>
        )}

        <div className="flex items-center justify-end mt-1.5 space-x-1">
          <span className="text-[10px] text-white/40">
            {timestamp ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
          </span>
          {!isAdmin && (
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