// LandingPage.jsx
import Hero from '../landing/Hero';
 import BottomNav from '../landing/Bottom';
const LandingPage = () => {
  return (
    <div className="h-screen overflow-hidden relative bg-black">
      <div className="h-full">
        <Hero />
      </div>
      <BottomNav />
    </div>
  );
};

export default LandingPage;