// BottomNav.jsx
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/' },
    { path: '/consultation' },
    { path: '/horoscope' },
    { path: '/explore' }
  ];

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="fixed bottom-0 left-0 right-0 z-50"
    >
      <div className="max-w-lg mx-auto">
        <div className="flex justify-between items-center">
          {navItems.map((item, index) => (
            <motion.button
              key={index}
              onClick={() => navigate(item.path)}
              className="relative flex-1 h-1 bg-transparent"
            >
              {location.pathname === item.path && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500"
                  transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
                />
              )}
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default BottomNav;