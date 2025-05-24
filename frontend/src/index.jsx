import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { GoogleOAuthProvider } from "@react-oauth/google"; 


const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    
    <GoogleOAuthProvider clientId="424263053764-t8ppvf8e6g79o5e4fegrpnaibha20nac.apps.googleusercontent.com">
  <App />
</GoogleOAuthProvider>
  </React.StrictMode>
);
