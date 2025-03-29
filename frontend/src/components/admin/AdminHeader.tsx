interface AdminHeaderProps {
  onLogout: () => void;
  adminName?: string;
}

const AdminHeader = ({ onLogout, adminName = "Admin" }: AdminHeaderProps) => {
  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white shadow-md border-b border-gray-200 sticky top-0 z-50">
      {/* Logo & Dashboard Title */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 flex items-center justify-center bg-blue-100 text-blue-600 rounded-lg shadow-sm">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-700">Admin Dashboard</h2>
      </div>

      {/* Admin Profile & Logout */}
      <div className="flex items-center space-x-5">
        {/* Profile */}
        <div className="hidden md:flex items-center space-x-2">
          <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 shadow-sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <span className="text-sm font-medium text-gray-700">{adminName}</span>
        </div>

        {/* Logout Button */}
        <button
          onClick={onLogout}
          className="flex items-center space-x-2 px-4 py-2 rounded-md bg-red-500 text-white font-medium shadow-md hover:bg-red-600 transition-all"
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