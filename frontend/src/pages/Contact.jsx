import { useState, useEffect } from 'react';
import { Mail, Phone, MapPin } from "lucide-react";
import { assets } from '../assets/assets';
import { backendUrl } from '../App';

const ToastNotification = ({ message, type, onClose }) => {
  const bgColor = type === "success" ? "bg-green-500" : "bg-red-500";
  const icon = type === "success" ? (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-8.63"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="15" y1="9" x2="9" y2="15"></line>
      <line x1="9" y1="9" x2="15" y2="15"></line>
    </svg>
  );

  return (
    <div className={`fixed top-6 right-6 p-4 rounded-xl shadow-lg text-white font-semibold transition-transform duration-300 ease-out z-50 transform scale-100 ${bgColor} flex items-center gap-3`}>
      {icon}
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 focus:outline-none">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
  );
};

export const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentMapIndex, setCurrentMapIndex] = useState(0);
  const [toast, setToast] = useState({ message: "", type: "", visible: false });

  // Array of map URLs
  const maps = [
    {
      name: "Tirupur",
      src: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d125321.8496468752!2d77.2934250280829!3d11.100908868625292!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ba9005089f8121f%3A0xc074744855cf8ef4!2sTiruppur%2C%20Tamil%20Nadu!5e0!3m2!1sen!2sin!4v1715563275254!5m2!1sen!2sin"
    },
    {
      name: "Kallakurichi",
      src: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d31251.3458297357!2d78.94997984477499!3d11.735558512549073!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bab66e5dfc2508d%3A0xb773491d8d92cdff!2sKallakurichi%2C%20Tamil%20Nadu!5e0!3m2!1sen!2sin!4v1755363275254!5m2!1sen!2sin"
    },
    {
      name: "Porur, Chennai",
      src: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d124393.75846665799!2d80.09633903173792!3d13.045059695426176!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a5266850c95a285%3A0xd64c520c8a4197e4!2sPorur%2C%20Chennai%2C%20Tamil%20Nadu!5e0!3m2!1sen!2sin!4v1715563363066!5m2!1sen!2sin"
    },
    {
      name: "Avadi, Chennai",
      src: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d124391.13455248962!2d80.09627702582861!3d13.082539097950993!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a5264b387e6740b%3A0xb2c2f627c2f0f000!2sAvadi%2C%20Chennai%2C%20Tamil%20Nadu!5e0!3m2!1sen!2sin!4v1715563399688!5m2!1sen!2sin"
    },
    {
      name: "Coimbatore",
      src: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d250889.37929497577!2d76.80800816942004!3d11.014283995805565!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ba859af2f971cb5%3A0x2fc2399949673993!2sCoimbatore%2C%20Tamil%20Nadu!5e0!3m2!1sen!2sin!4v1715563469145!5m2!1sen!2sin"
    },
    {
      name: "Madurai",
      src: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d251410.2333658535!2d78.07067897287957!3d9.92131908028713!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3b00c582b1189633%3A0xdc955b27136744ae!2sMadurai%2C%20Tamil%20Nadu!5e0!3m2!1sen!2sin!4v1715563499407!5m2!1sen!2sin"
    }
  ];

  // Effect to handle the map carousel rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMapIndex(prevIndex => (prevIndex + 1) % maps.length);
    }, 5000); // 5 seconds

    return () => clearInterval(interval);
  }, [maps.length]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({ ...prevData, [name]: value }));
  };

  const showToast = (message, type) => {
    setToast({ message, type, visible: true });
    setTimeout(() => {
      setToast({ message: "", type: "", visible: false });
    }, 3000); // Hide after 4 seconds
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      showToast("Name is required.", "error");
      return false;
    }
    const phonePattern = /^[0-9]{10}$/;
    if (!phonePattern.test(formData.phone)) {
      showToast("Phone number must be a valid 10-digit number.", "error");
      return false;
    }
    if (formData.message.trim().length < 10) {
      showToast("Message must be at least 10 characters long.", "error");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const response = await fetch(backendUrl+'/enquiry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        showToast(result.message, "success");
        setFormData({ name: "", phone: "", message: "" }); // Reset the form
            setTimeout(() => {
          window.location.href = "/"; // ✅ redirect on success
        }, 2000);
      } else {
        showToast(result.message || "Failed to submit enquiry. Please try again.", "error");
      }
    } catch (err) {
      console.error("Error submitting form:", err);
      showToast("An error occurred. Please check your network and try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="px-4 py-8 md:px-6 lg:py-12 max-w-7xl mx-auto font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Left Section - Form & Contact Info */}
        <div className="space-y-8">
          {/* Map Carousel */}
          <div className="rounded-3xl overflow-hidden shadow-lg border border-gray-200 aspect-video relative">
            <h3 className="absolute top-4 left-4 z-10 bg-white bg-opacity-80 backdrop-blur-sm px-4 py-2 rounded-lg font-semibold text-sm text-gray-800">
              {maps[currentMapIndex].name}
            </h3>
            <iframe
              key={maps[currentMapIndex].name} // Key forces re-render to trigger transition
              src={maps[currentMapIndex].src}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              className="absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out opacity-100"
            ></iframe>
          </div>

          {/* Enquiry Form */}
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-lg border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Enquiry Form</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                name="name"
                placeholder="Enter your name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-pink-400 to-red-400 text-white placeholder-white focus:outline-none transition-all"
                required
              />
              <input
                type="tel"
                name="phone"
                placeholder="Enter your mobile no"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-pink-400 to-red-400 text-white placeholder-white focus:outline-none transition-all"
                required
              />
              <textarea
                name="message"
                placeholder="Enter your message..."
                value={formData.message}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-pink-400 to-red-400 text-white placeholder-white focus:outline-none transition-all"
                required
              ></textarea>
              <button
                type="submit"
                className="w-full md:w-auto px-8 py-3 rounded-xl bg-green-500 text-white font-semibold hover:bg-green-600 transition-all duration-200"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit"}
              </button>
            </form>
          </div>

          {/* Contact Info */}
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-lg border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Get In Touch</h2>
            <ul className="space-y-4 text-gray-700">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 mt-1 text-pink-500 flex-shrink-0" />
                <p>Anna Nagar, Tirupur <br /> Dhruvam, Kallakurichi <br /> Porur, Chennai <br /> Avadi, Chennai</p>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="w-5 h-5 mt-1 text-pink-500 flex-shrink-0" />
                <p>+01234567890, +09876543210</p>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="w-5 h-5 mt-1 text-pink-500 flex-shrink-0" />
                <p>mailinfo00@rotal.com <br /> support24@rotal.com</p>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Section - Image */}
        <div className="hidden lg:flex items-center justify-center">
          <img
            src={assets.img13}
            alt="Contact illustration"
            className="w-full h-full object-cover rounded-3xl shadow-lg"
          />
        </div>
      </div>

      {toast.visible && (
        <ToastNotification
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, visible: false })}
        />
      )}
    </section>
  );
};
