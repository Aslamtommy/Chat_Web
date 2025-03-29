import { FaStar,   FaInfoCircle } from 'react-icons/fa';
import { GiCrystalBall } from 'react-icons/gi';

const BottomNav = () => (
  <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg flex justify-around py-3">
    <button className="flex flex-col items-center text-gray-600">
      <GiCrystalBall className="text-xl" />
      <span className="text-sm">Consultation</span>
    </button>
    <button className="flex flex-col items-center text-gray-600">
      <FaStar className="text-xl" />
      <span className="text-sm">Horoscope</span>
    </button>
    <button className="flex flex-col items-center text-gray-600">
      <GiCrystalBall className="text-xl" />
      <span className="text-sm">Astrology</span>
    </button>
    <button className="flex flex-col items-center text-gray-600">
      <FaInfoCircle className="text-xl" />
      <span className="text-sm">Guidance</span>
    </button>
  </div>
);
export default BottomNav;