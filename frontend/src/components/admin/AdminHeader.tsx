import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiLogOut } from 'react-icons/fi';

interface AdminHeaderProps {
  onLogout: () => void;
  adminName?: string;
  showBackButton?: boolean;
  onBack?: () => void;
}

const AdminHeader = ({ 
  onLogout, 
  adminName = "Admin",
  showBackButton = false,
  onBack = () => {}
}: AdminHeaderProps) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    onLogout();
    navigate('/');
  };

  return (
    <header className="flex items-center justify-between px-3 sm:px-6 py-2 sm:py-3 bg-black/40 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
      {/* Left Section - Back Button & Logo */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Back Button (Mobile Only) */}
        {showBackButton && (
          <button
            onClick={onBack}
            className="md:hidden p-1.5 sm:p-2 mr-1 sm:mr-2 rounded-lg bg-amber-500/20 text-white hover:bg-amber-500/30 border border-amber-500/30"
          >
            <FiArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}

        {/* Logo & Dashboard Title */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="w-8 h-8 sm:w-12 sm:h-12 bg-amber-500/20 rounded-xl flex items-center justify-center border border-amber-500/30 shadow-lg">
            <svg className="w-4 h-4 sm:w-6 sm:h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          </div>
          <div className={showBackButton ? 'hidden md:block' : ''}>
            <h2 className="text-lg sm:text-2xl font-serif font-semibold text-white tracking-wide">Admin Dashboard</h2>
            <p className="text-amber-500/60 text-xs sm:text-sm font-medium">Welcome back, {adminName}</p>
          </div>
        </div>
      </div>

      {/* Right Section - Admin Profile & Logout */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Profile - Hidden on mobile */}
        <div className="hidden md:flex items-center space-x-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-amber-500/20 rounded-full flex items-center justify-center border border-amber-500/30 shadow-md">
            <span className="text-base sm:text-lg font-medium text-amber-500">
              {adminName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs sm:text-sm font-semibold text-white">{adminName}</span>
            <span className="text-[10px] sm:text-xs text-amber-500/60">Administrator</span>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center space-x-1.5 sm:space-x-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-red-500/20 text-red-400 text-xs sm:text-sm font-medium border border-red-500/30 hover:bg-red-500/30 transition-all duration-200"
          title="Logout"
        >
          <span className="hidden sm:inline">Logout</span>
          <FiLogOut className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    </header>
  );
};

export default AdminHeader;