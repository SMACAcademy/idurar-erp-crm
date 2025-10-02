import React, { useState } from "react";
import { Play } from "lucide-react";
import { assets } from "../assets/assets";

export const Video = () => {
  const videos = [
    {
      title: "Modern Living Space",
      thumbnail:
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
      video:
        "https://www.w3schools.com/html/mov_bbb.mp4", // replace with your video
    },
    {
      title: "Cozy Interior",
      thumbnail:
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80",
      video:
        "https://www.w3schools.com/html/movie.mp4", // replace with your video
    },
  ];
  const [playingIndex, setPlayingIndex] = useState(null);

  return (
    <section className="px-6 py-12 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-6">
        {/* Left Section - Videos */}
        <div className="relative bg-white rounded-3xl shadow-lg border border-gray-200 p-8">
          <h2 className="absolute -top-6 left-6 bg-white px-6 py-2 text-lg font-bold text-gray-900 rounded-lg shadow-md border border-gray-200">
            Explore Our Branches
          </h2>

          <div className="mt-10 grid grid-cols-1 gap-6">
            {videos.map((v, index) => (
              <div
                key={index}
                className="relative bg-black rounded-xl overflow-hidden shadow-md"
              >
                {playingIndex === index ? (
                  <video
                    src={v.video}
                    controls
                    autoPlay muted
                    className="w-full h-60 object-cover"
                  />
                ) : (
                  <>
                    <img
                      src={v.thumbnail}
                      alt={v.title}
                      className="w-full h-60 object-cover"
                    />
                    <button
                      onClick={() => setPlayingIndex(index)}
                      className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/50 transition"
                    >
                      <Play className="w-12 h-12 text-white" />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Section - Side Image */}
        <div>
          <img
            src={assets.img8}
            alt="Branch interior"
            className="w-full h-full object-cover rounded-3xl shadow-lg"
          />
        </div>
      </div>
    </section>
  );
};
