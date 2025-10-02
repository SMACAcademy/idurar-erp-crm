import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { assets } from "../assets/assets.js";
import { motion, AnimatePresence } from "framer-motion";

const slides = [
  {
    id: 1,
    title: "Your Home Away From Home",
    subtitle: "Experience comfort and affordability with our PG accommodations.",
    image: assets.img11,
    buttonText: "Explore More",
    buttonLink: "/about",
  },
  {
    id: 2,
    title: "Multiple PG Branches Across the City",
    subtitle:
      "Find the perfect stay near your workplace or college. Spacious rooms, secure facilities, and all modern amenities at every branch.",
    image: assets.img3,
    buttonText: "Explore Branches",
    buttonLink: "/branches",
  },
  {
    id: 3,
    title: "Safe & Secure Living",
    subtitle:
      "24/7 security and a peaceful environment tailored for students and professionals.",
    image: assets.img13,
    buttonText: "Learn More",
    buttonLink: "/security",
  },
  {
    id: 4,
    title: "Our Branch Videos",
    subtitle:
      "Take a quick tour of our branches and explore the comfort, facilities, and vibrant community we offer.",
    image: assets.img4,
    buttonText: "Learn More",
    buttonLink: "/branch-video",
  }
];

export const Home = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-slide every 4s
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative w-full h-[600px] overflow-hidden rounded-2xl my-10 mx-5">
      <AnimatePresence mode="wait">
        <motion.div
          key={slides[currentIndex].id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 w-full h-full"
        >
          {/* Background Image with smooth full cover */}
          <img
            src={slides[currentIndex].image}
            alt={slides[currentIndex].title}
            className="w-full h-full object-cover rounded-2xl"
          />

          {/* Overlay */}
          <div className="absolute inset-0 bg-black/50  rounded-2xl"></div>

          {/* Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 md:px-12 text-white z-10">
            <motion.h1
              key={slides[currentIndex].title}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-2xl sm:text-3xl md:text-5xl font-bold mb-4"
            >
              {slides[currentIndex].title}
            </motion.h1>
            <motion.p
              key={slides[currentIndex].subtitle}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-lg sm:text-xl mb-6 leading-relaxed max-w-2xl"
            >
              {slides[currentIndex].subtitle}
            </motion.p>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <Link
                to={slides[currentIndex].buttonLink}
                className="inline-block bg-primary hover:bg-secondary transition px-6 py-3 rounded-full font-semibold"
              >
                {slides[currentIndex].buttonText}
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Dots Navigation */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-3 z-20">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`w-3 h-3 rounded-full transition-all ${
              currentIndex === idx ? "bg-primary w-6" : "bg-white/70"
            }`}
          />
        ))}
      </div>
    </section>
  );
};
