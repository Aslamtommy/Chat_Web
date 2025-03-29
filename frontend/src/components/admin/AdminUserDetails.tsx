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
          {/* Profile Header */}
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-primary-light rounded-full flex items-center justify-center text-secondary font-bold text-xl">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <h4 className="text-lg font-semibold text-primary-dark">{user.username}</h4>
              <p className="text-sm text-muted">{user.email}</p>
            </div>
          </div>

          {/* Details Card */}
          <div className="bg-white rounded-lg shadow-deep p-6">
            <h5 className="text-md font-semibold text-primary-dark mb-4">Personal Information</h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-muted text-xs font-medium uppercase tracking-wide">Age</label>
                <p className="text-primary-dark">{user.age || 'N/A'}</p>
              </div>
              <div>
                <label className="text-muted text-xs font-medium uppercase tracking-wide">Phone</label>
                <p className="text-primary-dark">{user.phoneNo || 'N/A'}</p>
              </div>
              <div>
                <label className="text-muted text-xs font-medium uppercase tracking-wide">Father's Name</label>
                <p className="text-primary-dark">{user.fathersName || 'N/A'}</p>
              </div>
              <div>
                <label className="text-muted text-xs font-medium uppercase tracking-wide">Mother's Name</label>
                <p className="text-primary-dark">{user.mothersName || 'N/A'}</p>
              </div>
              <div>
                <label className="text-muted text-xs font-medium uppercase tracking-wide">Place</label>
                <p className="text-primary-dark">{user.place || 'N/A'}</p>
              </div>
              <div>
                <label className="text-muted text-xs font-medium uppercase tracking-wide">District</label>
                <p className="text-primary-dark">{user.district || 'N/A'}</p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-32">
          <p className="text-muted text-lg">Loading user details...</p>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Toggle Button for Mobile */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="md:hidden fixed top-16 right-4 z-50 p-2 rounded-full bg-primary-dark text-secondary hover:bg-primary-light transition-colors"
        title="View User Details"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </button>

      {/* Desktop Sidebar */}
      <div className="hidden md:block w-80 bg-gray-50 shadow-deep h-full p-6 overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-primary-dark">User Details</h3>
          <button
            className="p-1 rounded-full text-gray-500 hover:bg-gray-200 transition-colors"
            onClick={() => setUser(null)} // Optional: Reset or close
            title="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <UserDetailsContent />
      </div>

      {/* Mobile Modal */}
      {isModalOpen && (
        <div className="md:hidden fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
          <div className="bg-gray-50 rounded-xl p-6 w-11/12 max-w-md max-h-[85vh] overflow-y-auto shadow-deep">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-primary-dark">User Details</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full text-gray-500 hover:bg-gray-200 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <UserDetailsContent />
          </div>
        </div>
      )}
    </>
  );
};

export default AdminUserDetails;