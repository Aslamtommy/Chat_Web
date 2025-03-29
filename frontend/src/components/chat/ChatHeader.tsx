import { useNavigate } from 'react-router-dom';
import { LogOut, MessageSquareText } from 'lucide-react'; 

const ChatHeader = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <header className="p-5 bg-white shadow-deep border-b border-gray-300 flex items-center justify-between">
      {/* Chat Title with Icon */}
      <div className="flex items-center gap-3">
        <MessageSquareText className="w-7 h-7 text-blue-500" />
        <h2 className="text-2xl font-serif text-gray-800 tracking-wide">Chat Room</h2>
      </div>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-2 text-gray-600 hover:text-red-500 transition-colors font-sans px-4 py-2 border rounded-lg hover:bg-red-100"
      >
        <LogOut className="w-5 h-5" />
        <span className="text-sm font-medium">Logout</span>
      </button>
    </header>
  );
};

export default ChatHeader;
