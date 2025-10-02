// Format the response according to the new structure
const calculateAge = (dob: Date): number => {
  const today = new Date();
  const age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  return monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())
    ? age - 1
    : age;
};


export default calculateAge;