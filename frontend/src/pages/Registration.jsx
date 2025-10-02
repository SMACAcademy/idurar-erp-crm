import React, { useState, useEffect } from "react";
import { assets } from "../assets/assets";
import { ChevronDown } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import { useNavigate } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import { backendUrl } from "../App";

const StyledSelect = ({ children, value, onChange, disabled = false }) => (
  <div className="relative w-full">
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`w-full appearance-none p-3 border rounded-lg bg-white text-gray-700 
                 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-sm 
                 ${disabled ? "bg-gray-100 cursor-not-allowed" : ""}`}
    >
      {children}
    </select>
    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
  </div>
);

export const Registration = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    dob: "",
    gender: "",
    phone: "",
    location: "",
    email: "",
    work: "",
    pgType: "",
    pgLocation: "",
    documentType: "",
    document: null,
    photo: null,
    plan: "",
    toDate: "",
  });
  const [errors, setErrors] = useState({});
  const [pgLocations, setPgLocations] = useState([]);
  const [age, setAge] = useState(null);
  const navigate = useNavigate();

  // 🔹 Calculate age
  const calculateAge = (dob) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let a = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      a--;
    }
    return a;
  };

  useEffect(() => {
    if (formData.dob) setAge(calculateAge(formData.dob));
    else setAge(null);
  }, [formData.dob]);

  // 🔹 Auto-set pgType based on gender
  useEffect(() => {
    if (formData.gender === "MALE") {
      setFormData((prev) => ({ ...prev, pgType: "MENS" }));
    } else if (formData.gender === "FEMALE") {
      setFormData((prev) => ({ ...prev, pgType: "WOMENS" }));
    }
  }, [formData.gender]);

  // 🔹 Fetch PG locations when pgType changes
  useEffect(() => {
    if (formData.pgType) {
      fetch(backendUrl+`/filters/pg-locations?pgType=${formData.pgType}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setPgLocations(data.data.options);
          else setPgLocations([]);
        })
        .catch(() => setPgLocations([]));
    }
  }, [formData.pgType]);

  // 🔹 Step 1 Validation
  const validateStep1 = async () => {
    if (!formData.name.trim()) return toast.error("Name is required"), false;
    if (!formData.dob) return toast.error("Date of birth is required"), false;
    if (age <= 15) return toast.error("Age must be greater than 15"), false;
    if (!/^\d{10}$/.test(formData.phone)) return toast.error("Phone must be 10 digits"), false;
    if (!formData.email.trim()) return toast.error("Email is required"), false;
    if (!formData.location.trim()) return toast.error("Address is required"), false;

    try {
      const res = await fetch(backendUrl+"/register/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          dob: formData.dob,
          gender: formData.gender,
          phone: formData.phone,
          email: formData.email,
          location: formData.location,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Validation failed");
        return false;
      }
      return true;
    } catch {
      toast.error("Network error, please try again.");
      return false;
    }
  };

  // 🔹 Step 2 Validation
  const validateStep2 = () => {
    let newErrors = {};
    if (!formData.pgLocation) newErrors.pgLocation = "Select PG location";
    if (!formData.work) newErrors.work = "Select work";
    if (!formData.documentType) newErrors.documentType = "Select document type";
    if (!formData.document) newErrors.document = "Upload document";
    if (!formData.photo) newErrors.photo = "Upload profile photo";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 🔹 Step 3 Validation
  const validateStep3 = () => {
    let newErrors = {};
    if (!formData.plan) newErrors.plan = "Select plan";
    if (formData.plan === "short" && !formData.toDate) newErrors.toDate = "Select to date";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (step === 1 && (await validateStep1())) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const handleRegister = async () => {
    if (!validateStep3()) return;

    try {
      setLoading(true);
      const fd = new FormData();
      Object.entries({
        name: formData.name,
        dob: formData.dob,
        gender: formData.gender,
        phone: formData.phone,
        email: formData.email,
        location: formData.location,
        work: formData.work,
        pgType: formData.pgType,
        pgLocation: formData.pgLocation,
        rentType: formData.plan === "short" ? "SHORT_TERM" : "LONG_TERM",
      }).forEach(([key, val]) => fd.append(key, val));

      if (formData.plan === "short") fd.append("dateOfRelieving", formData.toDate);
      if (formData.photo) fd.append("profileImage", formData.photo);
      if (formData.document) fd.append("documentImage", formData.document);

      const res = await fetch(backendUrl+"/register", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();

      if (res.ok) {
        toast.success("Registration completed!");
        setTimeout(() => navigate("/"), 2000);
      } else {
        toast.error(data.message || "Something went wrong");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (field, file) => {
    if (file && file.size > 2 * 1024 * 1024) {
      toast.error("File size must be less than 2MB");
      return;
    }
    setFormData({ ...formData, [field]: file });
  };

  return (
    <>
      <ToastContainer position="top-right" />
      <div className="bg-white rounded-2xl shadow-lg grid grid-cols-2 gap-6">
        {/* Left Side - Form */}
        <div className="w-screen mt-5 px-5 md:w-auto">
          {/* Progress */}
          <div className="flex justify-between mb-8">
            {["Personal", "ID & PG", "Plan"].map((label, idx) => (
              <div key={label} className="flex-1 text-center">
                <span
                  className={`w-10 h-10 mx-auto flex items-center justify-center rounded-full mb-2 text-white 
                  ${step >= idx + 1 ? "bg-secondary" : "bg-gray-400"}`}
                >
                  {idx + 1}
                </span>
                <p className={step === idx + 1 ? "text-primary font-semibold" : "text-gray-500"}>{label}</p>
              </div>
            ))}
          </div>

          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-3">
              <input type="text" placeholder="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full p-3 border rounded-lg" />
              <input type="date" placeholder="Date of Birth" value={formData.dob} onChange={(e) => setFormData({ ...formData, dob: e.target.value })} className="w-full p-3 border rounded-lg" />
              {age !== null && <p className={`text-sm ${age <= 15 ? "text-red-500" : "text-gray-600"}`}>Age: <span className="font-semibold">{age}</span> years</p>}

              <StyledSelect value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })}>
                <option value="">Select Gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </StyledSelect>

              <input type="text" placeholder="Phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full p-3 border rounded-lg" />
              <input type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full p-3 border rounded-lg" />
              <input type="text" placeholder="Address" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="w-full p-3 border rounded-lg" />

              <button onClick={handleNext} disabled={age !== null && age <= 15} className={`w-full py-3 rounded-lg text-white ${age !== null && age <= 15 ? "bg-gray-400 cursor-not-allowed" : "bg-primary hover:bg-secondary cursor-pointer"}`}>Next</button>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-4">
              <StyledSelect value={formData.pgType} disabled>
                <option value="MENS">Mens</option>
                <option value="WOMENS">Womens</option>
              </StyledSelect>

              <StyledSelect value={formData.pgLocation} onChange={(e) => setFormData({ ...formData, pgLocation: e.target.value })}>
                <option value="">Select PG Location</option>
                {pgLocations.map((pg) => (
                  <option key={pg.value} value={pg.value}>{pg.label} ({pg.pgName})</option>
                ))}
              </StyledSelect>
              {errors.pgLocation && <p className="text-red-500">{errors.pgLocation}</p>}

              <StyledSelect value={formData.work} onChange={(e) => setFormData({ ...formData, work: e.target.value })}>
                <option value="">Select Work Type</option>
                <option value="IT">IT</option>
                <option value="ENG">ENG</option>
                <option value="BANKING">BANKING</option>
              </StyledSelect>
              {errors.work && <p className="text-red-500">{errors.work}</p>}

              <StyledSelect value={formData.documentType} onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}>
                <option value="">Select Document Type</option>
                <option value="AADHAR">Aadhar</option>
                <option value="PAN">PAN</option>
              </StyledSelect>
              {errors.documentType && <p className="text-red-500">{errors.documentType}</p>}

              {/* File Uploads */}
              <div className="flex items-center gap-6">
                <div className="flex-1">
                  <label className="block text-sm">{formData.documentType ? `Upload ${formData.documentType}` : "Upload Document"}</label>
                  <input type="file" accept="image/*" onChange={(e) => handleFileChange("document", e.target.files?.[0] || null)} className="w-full p-3 border rounded-lg" />
                </div>
                {formData.document && (
                  <div className="flex justify-center items-center w-32 h-32 border rounded-lg bg-gray-50">
                    <img src={URL.createObjectURL(formData.document)} alt="Doc Preview" className="max-h-28 object-contain" />
                  </div>
                )}
              </div>
              {errors.document && <p className="text-red-500">{errors.document}</p>}

              <div className="flex items-center gap-6">
                <div className="flex-1">
                  <label className="block text-sm">Upload Profile Photo</label>
                  <input type="file" accept="image/*" onChange={(e) => handleFileChange("photo", e.target.files?.[0] || null)} className="w-full p-3 border rounded-lg" />
                </div>
                {formData.photo && (
                  <div className="flex justify-center items-center w-32 h-32 border rounded-lg bg-gray-50">
                    <img src={URL.createObjectURL(formData.photo)} alt="Profile Preview" className="max-h-28 object-contain" />
                  </div>
                )}
              </div>
              {errors.photo && <p className="text-red-500">{errors.photo}</p>}

              <button onClick={handleNext} className="w-full bg-primary hover:bg-secondary text-white py-3 rounded-lg">Next</button>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="space-y-4">
              <label className="block p-3 border rounded-lg">
                <input type="radio" name="plan" value="short" checked={formData.plan === "short"} onChange={(e) => setFormData({ ...formData, plan: e.target.value })} /> Short Term
              </label>

              {formData.plan === "short" && (
                <div>
                  <label>Date Of Relieving</label>
                  <input type="date" value={formData.toDate} onChange={(e) => setFormData({ ...formData, toDate: e.target.value })} className="p-3 border rounded-lg w-full" />
                  {errors.toDate && <p className="text-red-500">{errors.toDate}</p>}
                </div>
              )}

              <label className="block p-3 border rounded-lg">
                <input type="radio" name="plan" value="long" checked={formData.plan === "long"} onChange={(e) => setFormData({ ...formData, plan: e.target.value })} /> Long Term
              </label>

              {errors.plan && <p className="text-red-500">{errors.plan}</p>}

              <button onClick={handleRegister} disabled={loading} className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg">
                {loading ? "Submitting..." : "Register"}
              </button>
            </div>
          )}
        </div>

        {/* Right Side - Image */}
        <div className="hidden md:flex justify-center items-center">
          <img src={assets.img10} alt="Registration Illustration" className="rounded-xl shadow-lg" />
        </div>
      </div>
    </>
  );
};