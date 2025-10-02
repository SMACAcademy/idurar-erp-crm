import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { assets } from "../assets/assets";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { path: "/", name: "Home" },
    { path: "/about", name: "About" },
    { path: "/testimonials", name: "Testimonials" },
    { path: "/services", name: "Services" },
    { path: "/branches", name: "Branches" },
    { path: "/branch-video", name: "Our Branch Videos" },
    { path: "/register", name: "Registration" },
    // {path:"/payment",name:"Payment"},
    { path: "/contact", name: "Contact" }
    
  ];
const filter=navItems.filter(item=>item.name!=='Registration' && item.name!=='Payment');
  return (
    <header className="bg-white shadow-md relative z-50">
      <div className="flex justify-between items-center px-6 py-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="MRM PG" className="h-10 w-10" />
          <span className="font-bold text-lg">MRM PG</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-4">
          {filter.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className="text-gray-700 hover:text-primary font-medium transition"
            >
              {item.name}
            </NavLink>
          ))}

          {/* Social Icons */}
          {/* <div className="flex gap-3 text-primary text-xl">
            <img src={assets.whatsapp} alt="whatsapp" className="h-8 w-8" />
            <img src={assets.facebook} alt="facebook" className="h-8 w-8" />
            <img src={assets.linkedin} alt="linkedin" className="h-8 w-8" />
          </div> */}

          {/* Register Button */}
          <Link
            to="/register"
            className="bg-primary text-white px-4 py-2 rounded-full hover:bg-secondary/90 transition"
          >
            Register
          </Link>

          {/* Payment button */}
           {/* <Link
            to="/payment"
            className="bg-primary text-white px-4 py-2 rounded-full hover:bg-secondary/90 transition"
          >
            Payment
          </Link> */}
        </nav>

        {/* Mobile Menu Button */}
        <img
          src={assets.menu}
          onClick={() => setMenuOpen(true)}
          className="w-8 h-8 cursor-pointer lg:hidden"
          alt="Menu"
        />
      </div>

      {/* Mobile Slide Menu (Only Small Screens) */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end lg:hidden">

          {/* Slide-in Menu */}
          <div className="relative bg-white w-3/4 md:w-1/2 h-full shadow-lg rounded-l-xl overflow-y-auto transition-transform duration-300">
            {/* Back Button */}
            <div
              className="flex items-center gap-4 mt-4 ml-3 cursor-pointer"
              onClick={() => setMenuOpen(false)}
            >
              <img src={assets.back} className="rotate-180 active:rotate-0 w-10 h-10 transition-all delay-75" alt="Back" />
            </div>

            {/* Menu Items */}
            <ul className="flex flex-col items-center gap-5 py-5 mt-6">
              {navItems.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    onClick={() => setMenuOpen(false)}
                    className="block w-48 bg-gradient-to-r from-primary to-primary/80 text-white font-semibold px-6 py-2 rounded-full text-center hover:scale-105 transition-transform"
                  >
                    {item.name}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
