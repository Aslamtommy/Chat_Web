import { useNavigate } from 'react-router-dom';

interface AdminHeaderProps {
  onLogout: () => void;
  adminName?: string;
}

const AdminHeader = ({ onLogout, adminName = "Admin" }: AdminHeaderProps) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    onLogout();
    navigate('/');
  };

  return (
    <header className="flex items-center justify-between px-4 sm:px-6 py-3 bg-black/40 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
      {/* Logo & Dashboard Title */}
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center border border-amber-500/30 shadow-lg">
          <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-serif font-semibold text-white tracking-wide">Admin Dashboard</h2>
          <p className="text-amber-500/60 text-sm font-medium">Welcome back, {adminName}</p>
        </div>
      </div>

      {/* Admin Profile & Logout */}
      <div className="flex items-center space-x-4">
        {/* Profile - Hidden on mobile */}
        <div className="hidden md:flex items-center space-x-3">
          <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center border border-amber-500/30 shadow-md">
            <span className="text-lg font-medium text-amber-500">
              {adminName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-white">{adminName}</span>
            <span className="text-xs text-amber-500/60">Administrator</span>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-red-500/20 text-red-400 font-medium border border-red-500/30 hover:bg-red-500/30 transition-all duration-200"
          title="Logout"
        >
          <span className="hidden sm:inline">Logout</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </header>
  );
};

export default AdminHeader;