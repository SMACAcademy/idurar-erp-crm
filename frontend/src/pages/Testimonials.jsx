
import React from "react";
import { assets } from "../assets/assets";

export const Testimonials = () => {
  const testimonials = [
    {
      img: "https://randomuser.me/api/portraits/women/44.jpg",
      text: "The cleanliness of the rooms and common areas is top-notch. I always feel comfortable and at home here.",
      author: "Sarah, Student",
    },
    {
      img: "https://randomuser.me/api/portraits/men/46.jpg",
      text: "The food provided is not only delicious but also nutritious. It’s a great relief for someone with a busy schedule.",
      author: "David, Working Professional",
    },
    {
      img: "https://randomuser.me/api/portraits/women/65.jpg",
      text: "I feel very safe and secure here. The security measures in place are reassuring.",
      author: "Jessica, Student",
    },
    {
      img: "https://randomuser.me/api/portraits/men/60.jpg",
      text: "The community here is fantastic. I’ve made some great friends and always feel supported.",
      author: "Ryan, Working Professional",
    },
  ];


  return (
    <section className="px-6 py-10 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-6">
        
        {/* Left side - Testimonials */}
        <div className="relative bg-white rounded-3xl shadow-lg p-6 border border-gray-200">
          {/* Floating Heading */}
          <h2 className="absolute -top-6 right-6 bg-white px-5 py-2 text-lg font-bold text-gray-900 rounded-lg shadow-md border border-gray-200">
            Testimonials
          </h2>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
            {testimonials.map((t, index) => (
              <div key={index} className="flex flex-col items-start gap-3">
                <img
                  src={t.img}
                  alt={t.author}
                  className="w-full h-40 object-cover rounded-xl shadow-md"
                />
                <p className="text-gray-700 text-sm italic">"{t.text}"</p>
                <span className="text-primary text-sm font-semibold">
                  – {t.author}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right side - Large image */}
        <div>
          <img
            src={assets.img4}
            alt="Room view"
            className="w-full h-full object-cover rounded-3xl shadow-lg"
          />
        </div>
      </div>
    </section>
  );
};


