import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Lenis from '@studio-freight/lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import Navbar from './components/Navbar';
import Home from './components/Home';
import Shutterbugs from './components/Shutterbugs';
import Perception from './components/Perception';
import LearningFest from './components/LearningFest';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';

gsap.registerPlugin(ScrollTrigger);

function App() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    (window as any).__lenis = lenis;

    lenis.on('scroll', ScrollTrigger.update);

    const ticker = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(ticker);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(ticker);
      lenis.destroy();
      delete (window as any).__lenis;
    };
  }, []);

  return (
    <Router>
      <ScrollToTop />
      <div className="bg-background text-primary min-h-screen font-sans">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/learning-fest" element={<><LearningFest /><Footer /></>} />
          <Route path="/shutterbugs" element={<><Shutterbugs /><Footer /></>} />
          <Route path="/perception" element={<><Perception /><Footer /></>} />
          <Route path="/team" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
