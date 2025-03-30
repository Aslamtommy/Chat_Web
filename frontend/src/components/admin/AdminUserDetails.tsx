// AdminUserDetails.tsx
import { useState, useEffect } from 'react';
import adminService from '../Services/adminService';

interface User {
  username: string;
  email: string;
  age: number;
  fathersName: string;
  mothersName: string;
  phoneNo: string;
  place: string;
  district: string;
}

interface AdminUserDetailsProps {
  userId: string | null;
}

const AdminUserDetails = ({ userId }: AdminUserDetailsProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!userId) return;
      try {
        const userData = await adminService.getUserById(userId);
        setUser(userData);
      } catch (error) {
        console.error('Failed to fetch user details:', error);
        setUser(null);
      }
    };
    fetchUserDetails();
  }, [userId]);

  if (!userId) return null;

  const UserDetailsContent = () => (
    <div className="space-y-6">
      {user ? (
        <>
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center border border-amber-500/30">
              <span className="text-2xl font-medium text-amber-500">
                {user.username.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h4 className="text-lg font-medium text-white">{user.username}</h4>
              <p className="text-amber-500/60 text-sm">{user.email}</p>
            </div>
          </div>

          <div className="bg-white/5 rounded-lg border border-white/10 p-4 backdrop-blur-sm">
            <h5 className="text-sm font-medium text-white/70 mb-4">Personal Information</h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-amber-500/60 uppercase tracking-wide">Age</label>
                <p className="text-white/90">{user.age || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-amber-500/60 uppercase tracking-wide">Phone</label>
                <p className="text-white/90">{user.phoneNo || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-amber-500/60 uppercase tracking-wide">Father's Name</label>
                <p className="text-white/90">{user.fathersName || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-amber-500/60 uppercase tracking-wide">Mother's Name</label>
                <p className="text-white/90">{user.mothersName || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-amber-500/60 uppercase tracking-wide">Place</label>
                <p className="text-white/90">{user.place || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-amber-500/60 uppercase tracking-wide">District</label>
                <p className="text-white/90">{user.district || 'N/A'}</p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-amber-500 border-t-transparent" />
        </div>
      )}
    </div>
  );

  return (
    <>
      <div className="hidden lg:block w-full h-full p-6 overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-white">User Details</h3>
          <button
            className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors"
            onClick={() => setUser(null)}
            title="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <UserDetailsContent />
      </div>

      <div className="lg:hidden">
        <button
          onClick={() => setIsModalOpen(true)}
          className="p-2 rounded-lg bg-amber-500/20 text-white hover:bg-amber-500/30 border border-amber-500/30 transition-colors"
          title="View User Details"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </button>

        {isModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-black/40 backdrop-blur-md rounded-xl border border-white/10 w-full max-w-md max-h-[85vh] overflow-y-auto">
              <div className="p-4 border-b border-white/10">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-white">User Details</h3>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="p-4">
                <UserDetailsContent />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AdminUserDetails;