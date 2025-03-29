import { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import profileService from '../Services/profileService';

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
  } = useForm<ProfileForm>({
    defaultValues: {
      age: 0,
      fathersName: '',
      mothersName: '',
      phoneNo: '',
      place: '',
      district: '',
    },
  });

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

  // Common field configuration for both view and edit modes
  const fields = [
    { name: 'age', label: 'Age', icon: '👤', type: 'number', rules: { required: 'Age is required', min: { value: 1, message: 'Age must be positive' } } },
    { name: 'fathersName', label: "Father's Name", icon: '👨', rules: { required: "Father's name is required" } },
    { name: 'mothersName', label: "Mother's Name", icon: '👩', rules: { required: "Mother's name is required" } },
    { name: 'phoneNo', label: 'Phone', icon: '📱', rules: { required: 'Phone number is required', pattern: { value: /^\d{10}$/, message: 'Must be 10 digits' } } },
    { name: 'place', label: 'Place', icon: '🏠', rules: { required: 'Place is required' } },
    { name: 'district', label: 'District', icon: '📍', rules: { required: 'District is required' } },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md m-4 overflow-hidden transform transition-all duration-300 border border-gray-100">
        <div className="bg-gradient-to-r from-blue-500 to-blue-400 p-5 flex justify-between items-center">
          <h2 className="text-xl font-medium text-white tracking-wide">
            {isEditing ? 'Edit Profile' : 'My Profile'}
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-blue-100 transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 max-h-[70vh] overflow-y-auto bg-gray-50">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm text-center">{error}</p>
            </div>
          )}

          {isLoading || !profile ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : isEditing ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                {fields.map((field, index) => (
                  <div
                    key={field.name}
                    className={`flex flex-col p-3 ${index !== fields.length - 1 ? 'border-b border-gray-100' : ''}`}
                  >
                    <div className="flex items-center mb-2">
                      <span className="text-gray-400 mr-2">{field.icon}</span>
                      <span className="text-gray-500 text-sm">{field.label}</span>
                    </div>
                    <input
                      {...register(field.name as keyof ProfileForm, field.rules)}
                      type={field.type || 'text'}
                      disabled={isSubmitting}
                      className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all text-gray-700 bg-white shadow-sm disabled:bg-gray-100"
                    />
                    {errors[field.name as keyof ProfileForm] && (
                      <span className="text-red-500 text-xs mt-1">
                        {errors[field.name as keyof ProfileForm]?.message}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-5">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-500 text-white py-2.5 rounded-lg hover:bg-blue-600 transition-colors font-medium shadow-sm disabled:bg-blue-300"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={isSubmitting}
                  className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg hover:bg-gray-200 transition-colors border border-gray-200 disabled:text-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-col items-center py-3">
                <div className="w-20 h-20 bg-blue-100 rounded-full mb-3 flex items-center justify-center shadow-sm">
                  <span className="text-2xl font-medium text-blue-600">
                    {profile.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <h3 className="text-lg font-medium text-gray-800">{profile.username}</h3>
                <p className="text-blue-600 text-sm">{profile.email}</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                {fields.map((field, index) => (
                  <div
                    key={field.label}
                    className={`flex items-center p-3 ${index !== fields.length - 1 ? 'border-b border-gray-100' : ''}`}
                  >
                    <span className="text-gray-400 mr-2">{field.icon}</span>
                    <span className="text-gray-500 text-sm">{field.label}</span>
                    <span className="ml-auto text-gray-800 font-medium">
                      {profile[field.name as keyof UserProfile]}
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setIsEditing(true)}
                className="w-full bg-blue-500 text-white py-2.5 rounded-lg hover:bg-blue-600 transition-colors shadow-sm flex items-center justify-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
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