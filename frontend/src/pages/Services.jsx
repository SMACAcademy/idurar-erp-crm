import React from "react";
import {
  BedDouble,
  ShieldCheck,
  Wifi,
  Utensils,
  Shirt,
  Home,
  Droplet,
} from "lucide-react";
import { assets } from "../assets/assets";

export const Services = () => {
  const services = [
    {
      icon: <BedDouble className="w-6 h-6 text-white" />,
      title: "Furnished Rooms",
      desc: "Choose from single or shared rooms, fully furnished with essential amenities.",
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-white" />,
      title: "24/7 Security",
      desc: "Enjoy peace of mind with round-the-clock security and surveillance.",
    },
    {
      icon: <Wifi className="w-6 h-6 text-white" />,
      title: "High-Speed Wi-Fi",
      desc: "Stay connected with high-speed internet access throughout the property.",
    },
    {
      icon: <Utensils className="w-6 h-6 text-white" />,
      title: "Home-Cooked Meals",
      desc: "Savor delicious, home-cooked meals with a variety of options to suit your taste.",
    },
    {
      icon: <Shirt className="w-6 h-6 text-white" />,
      title: "Cleaning & Laundry",
      desc: "Keep your living space clean and your clothes fresh with our regular cleaning and laundry services.",
    },
    {
      icon: <Home className="w-6 h-6 text-white" />,
      title: "Comfortable",
      desc: "Clean, airy, and well-ventilated for a fresh living experience.",
    },
    {
      icon: <Droplet className="w-6 h-6 text-white" />,
      title: "RO Water",
      desc: "Access clean and safe drinking water with our RO water purification system.",
    },
  ];
  return (
    <section className="px-6 py-12 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-6">
        
        {/* Left Side - Services */}
        <div className="relative bg-white rounded-3xl shadow-lg border border-gray-200 p-8">
          {/* Floating Heading */}
          <h2 className="absolute w-52 bg-white -top-5 md:w-80  right-35 sm:right-45 translate-x-1/2  px-1 sm:px-6 py-2 text-sm sm:text-lg font-bold text-gray-900 rounded-lg shadow-md border border-gray-200">
            What our residents Services
          </h2>

          {/* Service List */}
          <div className="mt-10 space-y-6">
            {services.map((s, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="flex items-center justify-center px-2 sm:px-0 w-12 h-12 bg-primary rounded-full shadow-md">
                  {s.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{s.title}</h3>
                  <p className="text-gray-600 text-sm">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side - Image */}
        <div>
          <img
            src={assets.img5}
            alt="Room view"
            className="w-full h-full object-cover rounded-3xl shadow-lg"
          />
        </div>
      </div>
    </section>
  );
};
