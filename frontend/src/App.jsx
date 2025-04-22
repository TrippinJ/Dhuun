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
import Dashboard from "./pages/Dashboard";
import ChooseRole from "./pages/ChooseRole";
import SubscriptionPage from "./pages/Subscription";
import PrivateRoute from "./Components/PrivateRoute";
import CreatorCommunity from "./pages/CreatorCommunity";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import EditProfile from "./Components/EditProfile";
import EditBeat from "./Components/EditBeat"
import Favorites from "./Components/Favourites";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import { AudioProvider } from "./context/AudioContext";
import GlobalAudioPlayer from "./Components/GlobalAudioPlayer";
import VerifyOTP from "./pages/VerifyOTP";
import { LicenseProvider } from './context/LicenseContext';

function App() {
  return (
    <AudioProvider>
      <LicenseProvider>
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

              {/* Authentication Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/chooserole" element={<ChooseRole />} />
              <Route path="/verify-otp" element={<VerifyOTP />} />

              {/* Protected Routes */}
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                }
              />

              <Route
                path="/edit-profile"
                element={
                  <PrivateRoute>
                    <EditProfile />
                  </PrivateRoute>
                }
              />

              <Route
                path="/subscription"
                element={
                  <PrivateRoute>
                    <SubscriptionPage />
                  </PrivateRoute>
                }
              />

              <Route
                path="/edit-beat/:beatId"
                element={
                  <PrivateRoute>
                    <EditBeat />
                  </PrivateRoute>
                }
              />

              <Route
                path="/admin"
                element={
                  <PrivateRoute>
                    <AdminDashboard />
                  </PrivateRoute>
                }
              />

              <Route path="/dashboard/purchased" element={
                <PrivateRoute>
                  <Dashboard activePage="purchases" />
                </PrivateRoute>
              } />

              {/* Public Music Routes */}
              <Route path="/BeatExplorePage" element={<BeatExplorePage />} />
              <Route path="/creator-community" element={<CreatorCommunity />} />
              <Route path="/favorites" element={<Favorites />} />
              
              {/* Cart and Checkout Routes */}
              <Route path="/cart" element={<Cart />} />
              <Route
                path="/checkout"
                element={
                  <PrivateRoute>
                    <Checkout />
                  </PrivateRoute>
                }
              />
              <Route
                path="/checkout-success"
                element={
                  <PrivateRoute>
                    <CheckoutSuccess />
                  </PrivateRoute>
                }
              />
            </Routes>
            <GlobalAudioPlayer />
          </BrowserRouter>
        </div>
      </LicenseProvider>
    </AudioProvider>
  );
}

export default App;