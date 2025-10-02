import React, { useContext } from 'react'
import { useNavigate } from "react-router-dom";
export const Thankyou = () => {
    const navigate = useNavigate();
    
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
      <div className="bg-white p-10 rounded-2xl shadow-xl text-center max-w-md">
        <h1 className="text-3xl font-bold text-pribg-primary mb-4">Thank You!</h1>
        <p className="text-gray-600 mb-6">
          Your progress was successful.
        </p>
        <button
          onClick={() => navigate("/")}
          className="bg-primary text-white px-6 py-3 rounded-lg shadow-md hover:bg-secondary transition"
        >
          Go Back to Home
        </button>
      </div>
    </div>
  )
}