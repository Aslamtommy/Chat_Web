import { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import profileService from '../Services/profileService';
import { X, Edit, User, Phone, MapPin, Users } from 'lucide-react';

interface UserProfile {
  username: string;
  email: string;
  age: number;
  fathersName: string;
  mothersName: string;
  phoneNo: string;
  place: string;
  district: string;
}

interface ProfileForm extends Omit<UserProfile, 'username' | 'email'> {}

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProfileModal = ({ isOpen, onClose }: ProfileModalProps) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileForm>();

  useEffect(() => {
    if (isOpen) {
      fetchProfile();
    } else {
      setProfile(null);
      setIsEditing(false);
      setError(null);
      reset();
    }
  }, [isOpen, reset]);

  const fetchProfile = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const userData = await profileService.getProfile();
      setProfile(userData);
      Object.entries(userData).forEach(([key, value]) => {
        if (key in userData) {
          setValue(key as keyof ProfileForm, value as any);
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit: SubmitHandler<ProfileForm> = async (data) => {
    setError(null);
    try {
      await profileService.updateProfile(data);
      setIsEditing(false);
      await fetchProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    }
  };

  if (!isOpen) return null;

  const fields = [
    { name: 'age', label: 'Age', icon: <User className="w-4 h-4" />, type: 'number', 
      rules: { required: 'Age is required', min: { value: 1, message: 'Age must be positive' } } },
    { name: 'fathersName', label: "Father's Name", icon: <Users className="w-4 h-4" />, 
      rules: { required: "Father's name is required" } },
    { name: 'mothersName', label: "Mother's Name", icon: <Users className="w-4 h-4" />, 
      rules: { required: "Mother's name is required" } },
    { name: 'phoneNo', label: 'Phone', icon: <Phone className="w-4 h-4" />, 
      rules: { required: 'Phone number is required', pattern: { value: /^\d{10}$/, message: 'Must be 10 digits' } } },
    { name: 'place', label: 'Place', icon: <MapPin className="w-4 h-4" />, 
      rules: { required: 'Place is required' } },
    { name: 'district', label: 'District', icon: <MapPin className="w-4 h-4" />, 
      rules: { required: 'District is required' } },
  ];

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-3">
      <div className="w-full max-w-md bg-black/40 rounded-xl border border-white/10 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500/20 to-amber-600/10 p-4 flex justify-between items-center border-b border-white/10">
          <h2 className="text-xl font-serif text-white">
            {isEditing ? 'Edit Profile' : 'My Profile'}
          </h2>
          <button onClick={onClose} className="text-white/70 hover:text-amber-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 max-h-[65vh] overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm text-center">{error}</p>
            </div>
          )}

          {isLoading || !profile ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-amber-500 border-t-transparent" />
            </div>
          ) : isEditing ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {fields.map((field) => (
                <div key={field.name} className="bg-white/5 rounded-lg border border-white/10 p-3">
                  <div className="flex items-center mb-1.5 text-amber-500/80">
                    {field.icon}
                    <span className="ml-2 text-sm text-white/70">{field.label}</span>
                  </div>
                  <input
                    {...register(field.name as keyof ProfileForm, field.rules)}
                    type={field.type || 'text'}
                    disabled={isSubmitting}
                    className="w-full p-2 rounded-lg bg-black/20 border border-white/10 focus:border-amber-500/50 text-white text-sm focus:outline-none"
                  />
                  {errors[field.name as keyof ProfileForm] && (
                    <p className="mt-1 text-red-400 text-xs">
                      {errors[field.name as keyof ProfileForm]?.message}
                    </p>
                  )}
                </div>
              ))}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={isSubmitting}
                  className="flex-1 bg-white/5 text-white/70 hover:text-white py-2 rounded-lg text-sm border border-white/10 hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col items-center py-4">
                <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center border border-amber-500/30">
                  <span className="text-2xl text-amber-500">
                    {profile.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <h3 className="mt-2 text-lg text-white">{profile.username}</h3>
                <p className="text-amber-500/80 text-sm">{profile.email}</p>
              </div>

              <div className="space-y-2">
                {fields.map((field) => (
                  <div
                    key={field.label}
                    className="bg-white/5 rounded-lg border border-white/10 p-3 flex items-center justify-between"
                  >
                    <div className="flex items-center text-amber-500/80">
                      {field.icon}
                      <span className="ml-2 text-sm text-white/70">{field.label}</span>
                    </div>
                    <span className="text-white text-sm">
                      {profile[field.name as keyof UserProfile]}
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setIsEditing(true)}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <Edit className="w-4 h-4" />
                Edit Profile
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;