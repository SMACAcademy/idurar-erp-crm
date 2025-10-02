import React, { useState, useEffect } from "react";
import toast, { Toaster } from 'react-hot-toast';

// Mock assets object (replace with your image asset later)
const assets = {
  img10: "https://placehold.co/600x800/e2e8f0/334155?text=Payment+Form"
};

// Dropdown component
const StyledSelect = ({ name, value, onChange, children, label, disabled }) => (
  <div className="relative w-full">
    {label && <label className="block text-gray-700 font-semibold mb-1">{label}</label>}
    <select
      name={name}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className="w-full appearance-none p-3 border rounded-lg bg-white
                 text-gray-700 focus:ring-2 focus:ring-indigo-500
                 transition shadow-sm outline-none disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
    >
      {children}
    </select>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
    >
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  </div>
);

// Thank You screen
const ThankYou = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
    <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md space-y-4 text-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="64"
        height="64"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mx-auto text-green-500"
      >
        <path d="M22 11.08V12a10 10 0 1 1-5.93-8.08"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
      <h1 className="text-3xl font-bold text-gray-800">Payment Submitted!</h1>
      <p className="text-lg text-gray-600">
        Your payment details have been successfully submitted for review.
      </p>
      <p className="text-sm text-gray-500">
        You will receive a confirmation once it has been approved by the administrator.
      </p>
    </div>
  </div>
);

export const Payment = () => {
  const [form, setForm] = useState({
    name: "",
    memberId: "",
    roomId: "",
    pgType: "",
    pgId: "",
    rentBillScreenshot: null,
    electricityBillScreenshot: null,
  });

  const [pgLocations, setPgLocations] = useState([]);
  const [pgRooms, setPgRooms] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);

  // Fetch PG Locations when pgType changes
  useEffect(() => {
    const fetchPgLocations = async () => {
      if (!form.pgType) {
        setPgLocations([]);
        setForm(prev => ({ ...prev, pgId: "", roomId: "" }));
        return;
      }
      setIsLoadingLocations(true);
      try {
        const url = `http://localhost:5000/api/v1/user/pg-locations?pgType=${form.pgType}`;
        const res = await fetch(url);
        const data = await res.json();
        console.log("PG Locations Response:", data);

        if (data.success) {
          const formatted = data.data?.options.map(pg => ({
            value: pg.value,
            label: pg.label,
            pgName: pg.pgName,
          }));
          setPgLocations(formatted || []);
          console.log("Formatted Locations:", formatted);
        } else {
          setPgLocations([]);
          setErrors(prev => ({ ...prev, fetch: data.message || "Failed to fetch PG locations." }));
          toast.error(data.message || "Failed to fetch PG locations.");
        }
      } catch (err) {
        setPgLocations([]);
        setErrors(prev => ({ ...prev, fetch: "Error fetching PG locations." }));
        toast.error("Error fetching PG locations.");
      } finally {
        setIsLoadingLocations(false);
      }
    };
    fetchPgLocations();
  }, [form.pgType]);

  // Fetch Rooms when pgLocation changes
  useEffect(() => {
    const fetchPgRooms = async () => {
      if (!form.pgId) {
        setPgRooms([]);
        setForm(prev => ({ ...prev, roomId: "" }));
        return;
      }
      setIsLoadingRooms(true);
      try {
        const url = `http://localhost:5000/api/v1/user/rooms?pgId=${form.pgId}`;
        const res = await fetch(url);
        const data = await res.json();
        console.log("Rooms Response:", data);

        if (data.success) {
          setPgRooms(data.data?.options || []);
        } else {
          setPgRooms([]);
          setErrors(prev => ({ ...prev, fetch: data.message || "Failed to fetch rooms." }));
          toast.error(data.message || "Failed to fetch rooms.");
        }
      } catch (err) {
        setPgRooms([]);
        setErrors(prev => ({ ...prev, fetch: "Error fetching rooms." }));
        toast.error("Error fetching rooms.");
      } finally {
        setIsLoadingRooms(false);
      }
    };
    fetchPgRooms();
  }, [form.pgId]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "rentBillScreenshot" || name === "electricityBillScreenshot") {
      const file = files[0];
      const MAX_FILE_SIZE = 5 * 1024 * 1024;
      if (file && file.size > MAX_FILE_SIZE) {
        setErrors(prev => ({ ...prev, [name]: "File size exceeds 5MB. Please choose a smaller file." }));
        toast.error("File size exceeds 5MB. Please choose a smaller file.");
        setForm({ ...form, [name]: null });
      } else {
        setErrors(prev => ({ ...prev, [name]: "" }));
        setForm({ ...form, [name]: file });
      }
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  // Handle Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    const newErrors = {};
    if (!form.rentBillScreenshot) newErrors.rentBillScreenshot = "Rent bill screenshot is required.";
    if (!form.electricityBillScreenshot) newErrors.electricityBillScreenshot = "Electricity bill screenshot is required.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fill out all required fields.");
      setIsSubmitting(false);
      return;
    }

    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        formData.append(key, value);
      });

      const response = await fetch("http://localhost:5000/api/v1/user/payment", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setIsSubmitted(true);
        toast.success("Payment submitted successfully!");
      } else {
        const errorMsg = data.message && typeof data.message === 'string' ? data.message : "Failed to submit payment.";
        setErrors(prev => ({ ...prev, api: errorMsg }));
        toast.error(errorMsg);
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, api: "An error occurred. Please try again later." }));
      toast.error("An error occurred. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };
console.log(form);

  if (isSubmitted) return <ThankYou />;

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-100 font-sans">
      <Toaster position="bottom-center" />
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <form onSubmit={handleSubmit} className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md space-y-4">
          <h1 className="text-3xl font-bold text-center text-indigo-700">Payment Form</h1>
          <p className="text-center text-gray-500">Please fill out your details to submit your monthly payment.</p>

          <input
            type="text"
            name="memberId"
            placeholder="Member ID"
            value={form.memberId}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition"
            required
          />
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={form.name}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition"
            required
          />

          {/* PG Type Dropdown */}
          <StyledSelect name="pgType" value={form.pgType} onChange={handleChange} label="Select PG Type">
            <option value="">Select PG Type</option>
            <option value="MENS">Men's</option>
            <option value="WOMENS">Women's</option>
          </StyledSelect>

          {/* PG Location Dropdown */}
          <StyledSelect
            name="pgId"
            value={form.pgId}
            onChange={handleChange}
            label="Select PG Location"
            disabled={isLoadingLocations || !form.pgType}
          >
            <option value="">{isLoadingLocations ? "Loading..." : "Select PG Location"}</option>
            {pgLocations.map((pg) => (
              <option key={pg.value} value={pg.value}>
                {pg.label} - {pg.pgName}
              </option>
            ))}
          </StyledSelect>

          {/* Room Dropdown */}
          <StyledSelect
            name="roomId"
            value={form.roomId}
            onChange={handleChange}
            label="Select Room No"
            disabled={isLoadingRooms || !form.pgId}
          >
            <option value="">{isLoadingRooms ? "Loading..." : "Select Room No"}</option>
            {pgRooms.map((room) => (
              <option key={room.value} value={room.value}>
                {room.label}
              </option>
            ))}
          </StyledSelect>

          {/* File Upload */}
          <div className="space-y-4 border rounded-xl p-4 bg-gray-50">
            <p className="font-semibold text-gray-700">Payment Screenshots</p>
            <div className="flex flex-col">
              <label htmlFor="rentBill" className="text-sm font-medium text-gray-700 mb-1">
                Rent Bill Screenshot
              </label>
              <input id="rentBill" type="file" name="rentBillScreenshot" onChange={handleChange} />
              {errors.rentBillScreenshot && <p className="text-red-500 text-xs mt-1">{errors.rentBillScreenshot}</p>}
            </div>
            <div className="flex flex-col">
              <label htmlFor="electricityBill" className="text-sm font-medium text-gray-700 mb-1">
                Electricity Bill Screenshot
              </label>
              <input id="electricityBill" type="file" name="electricityBillScreenshot" onChange={handleChange} />
              {errors.electricityBillScreenshot && <p className="text-red-500 text-xs mt-1">{errors.electricityBillScreenshot}</p>}
            </div>
            {errors.api && <p className="text-red-500 text-sm font-medium">{errors.api}</p>}
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-all duration-200"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit Payment"}
          </button>
        </form>
      </div>

      {/* Right Side - Image */}
      <div className="flex-1 hidden lg:flex items-center justify-center p-6">
        <img src={assets.img10} alt="Payment illustration" className="w-full h-full object-cover rounded-2xl shadow-lg" />
      </div>
    </div>
  );
};
