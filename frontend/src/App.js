import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import './css/App.css';
import Home from "./Components/Home";
import About from "./Components/About";
import Work from "./Components/Work";
import Testimonial from "./Components/Testimonial";
import Contact from "./Components/Contact";
import Footer from "./Components/Footer";
import Navbar from "./Components/Navbar";
import Login from "./pages/Login"
import Register from "./pages/Register"; 
import BeatExplorePage from "./pages/BeatExplorePage";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          {/* Landing Page */}
          <Route
            path="/"
            element={
              <>
                <Navbar /> 
                <Home />
                <About /> 
                <Work />
                <Testimonial />
                <Contact />
                <Footer />
              </>
            }
          />

          {/* Login Page */}
          <Route path="/Login" element={<Login />} />

          {/* Register Page */}
          <Route path="/Register" element={<Register />} />
          
          <Route path="/explore" element={<BeatExplorePage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
