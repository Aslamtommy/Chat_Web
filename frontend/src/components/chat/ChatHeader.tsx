import { useNavigate } from 'react-router-dom';
import { LogOut, MessageSquareText } from 'lucide-react'; 

const ChatHeader = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <header className="px-6 py-4 bg-black/20 backdrop-blur-sm border-b border-white/10">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Chat Title with Icon */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <MessageSquareText className="w-7 h-7 text-amber-500" />
            <div className="absolute -inset-1 bg-amber-500/20 rounded-lg blur-sm -z-10" />
          </div>
          <h2 className="text-2xl font-serif text-white tracking-wide">
            Arabic Jyothisham
            <span className="block text-sm text-white/60 font-sans tracking-normal mt-0.5">
              Chat Consultation
            </span>
          </h2>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-white/70 hover:text-white transition-all duration-300 font-sans px-4 py-2 rounded-xl border border-white/10 hover:border-amber-500/50 hover:bg-amber-500/10 group"
        >
          <LogOut className="w-5 h-5 group-hover:stroke-amber-500" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default ChatHeader;
