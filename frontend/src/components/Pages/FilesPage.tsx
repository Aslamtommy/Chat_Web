// src/components/Pages/FilesPage.tsx
 
import { useNavigate } from 'react-router-dom';

const FilesPage = () => {
  const navigate = useNavigate();

  const handleTabChange = (tab: 'chats' | 'files' | 'profile') => {
    if (tab === 'chats') {
      navigate('/home');
    } else if (tab === 'profile') {
      navigate('/profile');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      <div className="p-4 bg-header-bg shadow-soft border-b border-gray-200">
        <h3 className="text-lg font-semibold text-text-primary">Files</h3>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-600 text-lg">No files available yet.</p>
      </div>
      <div className="flex justify-around p-4 bg-header-bg border-t border-gray-200">
        <button
          onClick={() => handleTabChange('chats')}
          className="flex flex-col items-center text-gray-500"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <span className="text-xs mt-1">Chats</span>
        </button>
        <button
          onClick={() => handleTabChange('files')}
          className="flex flex-col items-center text-primary-dark"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-xs mt-1">Files</span>
        </button>
        <button
          onClick={() => handleTabChange('profile')}
          className="flex flex-col items-center text-gray-500"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-xs mt-1">Profile</span>
        </button>
      </div>
    </div>
  );
};

export default FilesPage;