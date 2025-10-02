// context/AppContext.jsx
import { createContext, useState } from "react";

export const AppContext = createContext();

const AppContextProvider = ({ children }) => {
  const[text,setText]=useState("");
console.log(text);

  return (
    <AppContext.Provider value={{ text,setText }}>
      {children}
    </AppContext.Provider>
  );
};

export default AppContextProvider;
