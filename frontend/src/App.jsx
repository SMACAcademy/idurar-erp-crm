import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";

import { Home } from "./pages/Home";
import { About } from "./pages/About";
import { Testimonials } from "./pages/Testimonials";
import { Services } from "./pages/Services";
import { Branches } from "./pages/Branches";
import { Video } from "./pages/Video";
import { Registration } from "./pages/Registration";
import { Contact } from "./pages/Contact";
import { Thankyou } from "./pages/Thankyou";
// import { Payment } from "./pages/Payment";
export const backendUrl=import.meta.env.VITE_BACKEND_URL;
export const App = () => {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/testimonials" element={<Testimonials />} />
        <Route path="/services" element={<Services />} />
        <Route path="/branches" element={<Branches />} />
        <Route path="/thank-you" element={<Thankyou />} />
        <Route path="/branch-video" element={<Video />} />
        <Route path="/register" element={<Registration />} />
        <Route path="/contact" element={<Contact />} />
        {/* <Route path="/payment" element={<Payment/>}/> */}
      </Routes>
    </>
  );
};


