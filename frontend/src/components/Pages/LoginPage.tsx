import Login from "../auth/Login";
import { motion } from 'framer-motion';

const LoginPage = () => (
  <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-b from-stone-50 to-white">
    {/* Background Image */}
    <div className="absolute inset-0">
      <img 
        src="https://images.unsplash.com/photo-1531297484001-80022131f5a1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fA%3D%3D&auto=format&fit=crop&w=3840&q=80" 
        alt="Cosmic Background" 
        className="h-full w-full object-cover object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-stone-900/80 via-stone-900/70 to-stone-900/90" />
    </div>

    {/* Login Form Container */}
    <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-8"> 
      {/* Centering the form */}
      <motion.div 
        className="w-full max-w-lg transform rounded-3xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="overflow-hidden rounded-3xl bg-white/10 shadow-glass backdrop-blur-2xl">
          <div className="px-6 py-8 sm:px-8 sm:py-10">
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <motion.div 
                className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white/10 shadow-glass-sm backdrop-blur-xl sm:h-24 sm:w-24"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <span className="animate-float text-4xl sm:text-5xl">✨</span>
              </motion.div>
              <h2 className="mb-2 font-serif text-3xl font-medium tracking-tight text-white sm:text-4xl md:text-5xl">
                Welcome Back
              </h2>
              <p className="text-base text-stone-200 sm:text-lg">
                Sign in to continue your spiritual journey
              </p>
            </motion.div>

            <div className="mt-8 sm:mt-10">
              <Login />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  </div>
);

export default LoginPage;
