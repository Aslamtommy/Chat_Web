// AdminHeader.tsx
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiLogOut, FiLink, FiX, FiTrash2, FiEdit2, FiCheck, FiPlus } from 'react-icons/fi';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

interface AdminHeaderProps {
  onLogout: () => void;
  adminName?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  hideOnMobile?: boolean;
  isModalOpen?: boolean;
}

interface Link {
  _id: string;
  title: string;
  url: string;
}

const AdminHeader = ({
  onLogout,
  adminName = 'Admin',
  showBackButton = false,
  onBack = () => {},
  hideOnMobile = false,
  isModalOpen = false,
}: AdminHeaderProps) => {
  const navigate = useNavigate();
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [links, setLinks] = useState<Link[]>([]);
  const [newLink, setNewLink] = useState({ title: '', url: '' });
  const [editingLink, setEditingLink] = useState<Link | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [linkToDelete, setLinkToDelete] = useState<string | null>(null);

  const fetchLinks = async () => {
    try {
      const response:any = await axios.get(`${import.meta.env.VITE_API_URL}/admin/links`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
      });
      setLinks(response.data.data);
    } catch (err) {
      setError('Failed to fetch links');
    }
  };

  const handleAddLink = async () => {
    try {
      const response:any = await axios.post(
        `${import.meta.env.VITE_API_URL}/admin/links`,
        newLink,
        { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } }
      );
      setLinks([...links, response.data.data]);
      setNewLink({ title: '', url: '' });
      setError(null);
    } catch (err) {
      setError('Failed to add link');
    }
  };

  const handleUpdateLink = async () => {
    if (!editingLink) return;
    try {
      const response :any= await axios.put(
        `${import.meta.env.VITE_API_URL}/admin/links/${editingLink._id}`,
        { title: newLink.title, url: newLink.url },
        { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } }
      );
      setLinks(links.map((link) => (link._id === editingLink._id ? response.data.data : link)));
      setEditingLink(null);
      setNewLink({ title: '', url: '' });
      setError(null);
    } catch (err) {
      setError('Failed to update link');
    }
  };

  const handleDeleteLink = async (id: string) => {
    setLinkToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!linkToDelete) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/admin/links/${linkToDelete}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
      });
      setLinks(links.filter((link) => link._id !== linkToDelete));
      setError(null);
    } catch (err) {
      setError('Failed to delete link');
    } finally {
      setShowDeleteConfirm(false);
      setLinkToDelete(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    onLogout();
    navigate('/');
  };

  return (
    <>
      {!isModalOpen && (
        <header
          className={`flex items-center justify-between px-4 sm:px-6 py-4 bg-gradient-to-r from-black/95 via-black/90 to-black/95 backdrop-blur-xl border-b border-amber-500/10 sticky top-0 z-50 ${
            hideOnMobile ? 'hidden md:flex' : ''
          }`}
        >
          {/* Left Section */}
          <div className="flex items-center space-x-4">
            {showBackButton && (
              <button
                onClick={onBack}
                className="md:hidden p-2.5 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-600/5 text-amber-400 hover:text-amber-300 border border-amber-500/20 transition-all duration-300 hover:border-amber-500/30"
              >
                <FiArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
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

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                setIsLinkModalOpen(true);
                fetchLinks();
              }}
              className="group flex items-center space-x-2 px-3.5 sm:px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/10 to-amber-600/5 text-amber-300 text-xs sm:text-sm font-medium border border-amber-500/20 hover:border-amber-500/30 transition-all duration-300"
              title="Manage Links"
            >
              <span className="hidden sm:inline">Manage Links</span>
              <FiLink className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 group-hover:scale-110" />
            </button>
            <div className="hidden md:flex items-center space-x-3">
              <div className="relative group">
                
           
              </div>
             
            </div>
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
      )}

      {/* Link Management Modal */}
      <AnimatePresence>
        {isLinkModalOpen && (
          <motion.div
            className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gradient-to-br from-black via-black/95 to-black/90 p-8 rounded-2xl shadow-2xl border border-amber-500/20 w-full max-w-2xl mx-4"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <FiLink className="w-6 h-6 text-amber-400/80" />
                  </div>
                  <h2 className="text-2xl font-medium text-amber-50/90 tracking-wide">Manage Useful Links</h2>
                </div>
                <button
                  onClick={() => setIsLinkModalOpen(false)}
                  className="p-2 rounded-xl hover:bg-amber-500/10 transition-colors border border-amber-500/20"
                >
                  <FiX className="w-5 h-5 text-amber-400/60" />
                </button>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm"
                >
                  {error}
                </motion.div>
              )}

              <div className="mb-8 space-y-6">
                <div className="space-y-4">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Link Title"
                      value={newLink.title}
                      onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
                      className="w-full p-4 rounded-xl bg-black/50 border border-amber-500/20 text-amber-50 placeholder-amber-500/40 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/30 transition-all"
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-amber-500/5 to-transparent pointer-events-none" />
                  </div>
                  <div className="relative">
                    <input
                      type="url"
                      placeholder="Link URL"
                      value={newLink.url}
                      onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                      className="w-full p-4 rounded-xl bg-black/50 border border-amber-500/20 text-amber-50 placeholder-amber-500/40 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/30 transition-all"
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-amber-500/5 to-transparent pointer-events-none" />
                  </div>
                </div>
                <div className="flex justify-end space-x-3">
                  {editingLink ? (
                    <>
                      <button
                        onClick={handleUpdateLink}
                        className="px-6 py-3 bg-gradient-to-r from-amber-500/90 to-amber-600/80 hover:from-amber-500 hover:to-amber-600 text-amber-50 rounded-xl transition-all duration-300 flex items-center space-x-2 group"
                      >
                        <FiCheck className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span>Update Link</span>
                      </button>
                      <button
                        onClick={() => {
                          setEditingLink(null);
                          setNewLink({ title: '', url: '' });
                        }}
                        className="px-6 py-3 bg-black/50 hover:bg-black/70 text-amber-400/80 rounded-xl transition-all duration-300 border border-amber-500/20"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleAddLink}
                      className="px-6 py-3 bg-gradient-to-r from-amber-500/90 to-amber-600/80 hover:from-amber-500 hover:to-amber-600 text-amber-50 rounded-xl transition-all duration-300 flex items-center space-x-2 group"
                    >
                      <FiPlus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      <span>Add Link</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                {links.map((link) => (
                  <motion.div
                    key={link._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group flex items-center justify-between p-4 bg-black/50 rounded-xl border border-amber-500/10 hover:border-amber-500/20 transition-all duration-300"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-amber-50/90 font-medium truncate">{link.title}</p>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-amber-400/60 text-sm hover:text-amber-400 transition-colors truncate block"
                      >
                        {link.url}
                      </a>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => {
                          setEditingLink(link);
                          setNewLink({ title: link.title, url: link.url });
                        }}
                        className="p-2 rounded-lg hover:bg-amber-500/10 transition-colors border border-amber-500/20"
                        title="Edit"
                      >
                        <FiEdit2 className="w-4 h-4 text-amber-400/60" />
                      </button>
                      <button
                        onClick={() => handleDeleteLink(link._id)}
                        className="p-2 rounded-lg hover:bg-red-500/10 transition-colors border border-red-500/20"
                        title="Delete"
                      >
                        <FiTrash2 className="w-4 h-4 text-red-400/60" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gradient-to-br from-black via-black/95 to-black/90 p-8 rounded-2xl shadow-2xl border border-amber-500/20 w-full max-w-md mx-4"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20">
                  <FiTrash2 className="w-6 h-6 text-red-400/80" />
                </div>
                <h3 className="text-xl font-medium text-amber-50/90">Confirm Delete</h3>
              </div>
              <p className="text-amber-400/60 mb-8">Are you sure you want to delete this link? This action cannot be undone.</p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setLinkToDelete(null);
                  }}
                  className="px-6 py-3 bg-black/50 hover:bg-black/70 text-amber-400/80 rounded-xl transition-all duration-300 border border-amber-500/20"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-6 py-3 bg-gradient-to-r from-red-500/90 to-red-600/80 hover:from-red-500 hover:to-red-600 text-amber-50 rounded-xl transition-all duration-300 flex items-center space-x-2 group"
                >
                  <FiTrash2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span>Delete</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AdminHeader;