import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiLogOut } from 'react-icons/fi';

interface AdminHeaderProps {
  onLogout: () => void;
  adminName?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  hideOnMobile?: boolean;
}

const AdminHeader = ({ 
  onLogout, 
  adminName = "Admin",
  showBackButton = false,
  onBack = () => {},
  hideOnMobile = false
}: AdminHeaderProps) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    onLogout();
    navigate('/');
  };

  return (
    <header className={`flex items-center justify-between px-4 sm:px-6 py-4 bg-gradient-to-r from-black/95 via-black/90 to-black/95 backdrop-blur-xl border-b border-amber-500/10 sticky top-0 z-50 ${hideOnMobile ? 'hidden md:flex' : ''}`}>
      {/* Left Section - Back Button & Logo */}
      <div className="flex items-center space-x-4">
        {/* Back Button (Mobile Only) */}
        {showBackButton && (
          <button
            onClick={onBack}
            className="md:hidden p-2.5 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-600/5 text-amber-400 hover:text-amber-300 border border-amber-500/20 transition-all duration-300 hover:border-amber-500/30"
          >
            <FiArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}

        {/* Logo & Dashboard Title */}
        <div className="flex items-center space-x-4">
          <div className="relative group">
            <div className="w-11 h-11 sm:w-12 sm:h-12 bg-gradient-to-br from-amber-500/10 to-amber-600/5 rounded-xl flex items-center justify-center border border-amber-500/20 transition-all duration-300 group-hover:border-amber-500/30">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            </div>
            <div className="absolute -inset-0.5 bg-amber-500/10 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
          <div className={`${showBackButton ? 'hidden md:block' : ''}`}>
            <h2 className="text-lg sm:text-xl font-serif font-medium text-amber-50/90 tracking-wide">
              Admin Dashboard
              <div className="h-px w-3/4 bg-gradient-to-r from-amber-500/30 to-transparent mt-1" />
            </h2>
            <p className="text-amber-400/60 text-xs sm:text-sm font-medium mt-1">Welcome back, {adminName}</p>
          </div>
        </div>
      </div>

      {/* Right Section - Admin Profile & Logout */}
      <div className="flex items-center space-x-4">
        {/* Profile - Hidden on mobile */}
        <div className="hidden md:flex items-center space-x-3">
          <div className="relative group">
            <div className="w-10 h-10 sm:w-11 sm:h-11 bg-gradient-to-br from-amber-500/10 to-amber-600/5 rounded-xl flex items-center justify-center border border-amber-500/20 transition-all duration-300 group-hover:border-amber-500/30">
              <span className="text-base sm:text-lg font-medium text-amber-400 group-hover:text-amber-300 transition-colors">
                {adminName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="absolute -inset-0.5 bg-amber-500/10 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm sm:text-base font-medium text-amber-50/90">{adminName}</span>
            <span className="text-[10px] sm:text-xs text-amber-400/60">Administrator</span>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="group flex items-center space-x-2 px-3.5 sm:px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-500/10 to-red-600/5 text-red-300 text-xs sm:text-sm font-medium border border-red-500/20 hover:border-red-500/30 transition-all duration-300"
          title="Logout"
        >
          <span className="hidden sm:inline">Logout</span>
          <FiLogOut className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 group-hover:translate-x-0.5" />
        </button>
      </div>
    </header>
  );
};

export default AdminHeader;