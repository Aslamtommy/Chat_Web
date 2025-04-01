// AdminUserDetails.tsx
import { useState, useEffect } from 'react';
import adminService from '../Services/adminService';
import { User, Mail, Phone, MapPin, Calendar, Users } from 'lucide-react';

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
    <div className="space-y-8">
      {user ? (
        <>
          {/* Profile Header */}
          <div className="flex items-center space-x-6 p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
            <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center border-2 border-amber-500/30">
              <span className="text-3xl font-medium text-amber-500">
                {user.username.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h4 className="text-2xl font-semibold text-white">{user.username}</h4>
              <p className="text-amber-500/60 text-sm mt-1">{user.email}</p>
            </div>
          </div>

          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h5 className="text-lg font-medium text-white/90 mb-4">Personal Information</h5>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg border border-white/10">
                  <Calendar className="w-5 h-5 text-amber-500" />
                  <div>
                    <p className="text-sm text-white/60">Age</p>
                    <p className="text-white">{user.age} years</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg border border-white/10">
                  <Mail className="w-5 h-5 text-amber-500" />
                  <div>
                    <p className="text-sm text-white/60">Email</p>
                    <p className="text-white">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg border border-white/10">
                  <Phone className="w-5 h-5 text-amber-500" />
                  <div>
                    <p className="text-sm text-white/60">Phone</p>
                    <p className="text-white">{user.phoneNo}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Location Information */}
            <div className="space-y-4">
              <h5 className="text-lg font-medium text-white/90 mb-4">Location Information</h5>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg border border-white/10">
                  <MapPin className="w-5 h-5 text-amber-500" />
                  <div>
                    <p className="text-sm text-white/60">Place</p>
                    <p className="text-white">{user.place}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg border border-white/10">
                  <MapPin className="w-5 h-5 text-amber-500" />
                  <div>
                    <p className="text-sm text-white/60">District</p>
                    <p className="text-white">{user.district}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Family Information */}
            <div className="md:col-span-2 space-y-4">
              <h5 className="text-lg font-medium text-white/90 mb-4">Family Information</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg border border-white/10">
                  <Users className="w-5 h-5 text-amber-500" />
                  <div>
                    <p className="text-sm text-white/60">Father's Name</p>
                    <p className="text-white">{user.fathersName}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg border border-white/10">
                  <Users className="w-5 h-5 text-amber-500" />
                  <div>
                    <p className="text-sm text-white/60">Mother's Name</p>
                    <p className="text-white">{user.mothersName}</p>
                  </div>
                </div>
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
    <div className="w-full">
      <UserDetailsContent />
    </div>
  );
};

export default AdminUserDetails;