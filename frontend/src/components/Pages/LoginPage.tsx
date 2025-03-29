import Login from "../auth/Login";

const LoginPage = () => (
  <div className="flex items-center justify-center min-h-screen bg-chat-bg p-4">
    <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow-deep w-full max-w-md">
      <h2 className="text-2xl sm:text-3xl font-bold text-blue-500 mb-4 sm:mb-6 text-center font-cinzel">
        Login
      </h2>
      <Login />
    </div>
  </div>
);

export default LoginPage;