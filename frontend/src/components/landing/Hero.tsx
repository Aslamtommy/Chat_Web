import { useNavigate } from 'react-router-dom';

const Hero = () => {
  const navigate = useNavigate();

  return (
    <div
      className="relative h-[70vh] bg-cover bg-center"
      style={{
        backgroundImage: `url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80')`, // Replace with your image URL
      }}
    >
      <div className="absolute inset-0 bg-black bg-opacity-30 flex flex-col justify-center items-center text-center text-white">
        <h1 className="text-4xl md:text-5xl font-bold mb-2">
          Unlock Your Destiny
        </h1>
        <p className="text-lg md:text-xl mb-6">
          with Arabi Jyothisham
        </p>
        <button
          onClick={() => navigate('/register')}
          className="bg-purple-600 text-white px-6 py-3 rounded-lg mb-4 w-64"
        >
          Get Started Now
        </button>
        <button
          onClick={() => navigate('/login')}
          className="bg-white text-purple-600 px-6 py-3 rounded-lg w-64"
        >
          Sign In
        </button>
      </div>
    </div>
  );
};

export default Hero;