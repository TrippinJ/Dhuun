import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ErrorBoundary from './Components/ErrorBoundary';
import './css/App.css';
import Home from "./Components/Home";
import About from "./Components/About";
import Work from "./Components/Work";
import Testimonial from "./Components/Testimonial";
import Footer from "./Components/Footer";
import Navbar from "./Components/Navbar";
import Login from "./pages/Login"
import Register from "./pages/Register";
import { AuthProvider } from './context/AuthContext';
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
import { SettingsProvider } from './context/SettingsContext';
import { LicenseProvider } from './context/LicenseContext';
import { WishlistProvider } from './context/WishlistContext';
import GlobalAudioPlayer from "./Components/GlobalAudioPlayer";
import VerifyOTP from "./pages/VerifyOTP";

import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Transactions from "./pages/Transactions";

// Dashboard components
import PurchasedBeats from "./Components/PurchasedBeats";
import SellerWallet from "./Components/SellerWallet";
import DocumentVerification from './Components/DocumentVerification';
import SalesComponent from './Components/SoldBeats';

// Toastify
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AudioProvider>
          <LicenseProvider>
            <WishlistProvider>
              <SettingsProvider>
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
                            <Footer />
                          </>
                        }
                      />

                      {/* Authentication Routes */}
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />
                      <Route path="/chooserole" element={<ChooseRole />} />
                      <Route path="/verify-otp" element={<VerifyOTP />} />
                      <Route path="/forgot-password" element={<ForgotPassword />} />
                      <Route path="/reset-password" element={<ResetPassword />} />


                      {/* Public Music Routes */}
                      <Route path="/BeatExplorePage" element={<BeatExplorePage />} />
                      <Route path="/creator-community" element={<CreatorCommunity />} />

                      {/* Nested Dashboard Routes */}
                      <Route path="/dashboard" element={
                        <PrivateRoute>
                          <Dashboard />
                        </PrivateRoute>
                      }>
                        {/* Nested routes - these will render inside Dashboard */}
                        {/* <Route index element={<DashboardOverview />} /> */}
                        <Route path="profile" element={<EditProfile />} />
                        <Route path="wallet" element={<SellerWallet />} />
                        <Route path="purchases" element={<PurchasedBeats />} />
                        <Route path="verification" element={<DocumentVerification />} />
                        <Route path="/dashboard" element={<Dashboard />}/>
                          <Route path="sales" element={<SalesComponent />} />
                        </Route>

                        {/* Other Protected Routes */}
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
                          path="/admin/dashboard"
                          element={
                            <PrivateRoute adminOnly={true}>
                              <AdminDashboard />
                            </PrivateRoute>
                          }
                        />

                        {/* User Account Protected Routes */}
                        <Route path="/favorites" element={
                          <PrivateRoute>
                            <Favorites />
                          </PrivateRoute>
                        } />

                        <Route path="/cart" element={
                          <PrivateRoute>
                            <Cart />
                          </PrivateRoute>
                        } />

                        <Route path="/transactions" element={
                          <PrivateRoute>
                            <Transactions />
                          </PrivateRoute>
                        } />

                        {/* Checkout Routes */}
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
                    <ToastContainer
                      position="top-right"
                      autoClose={3000}
                      hideProgressBar={false}
                      newestOnTop={false}
                      closeOnClick
                      rtl={false}
                      pauseOnFocusLoss
                      draggable
                      pauseOnHover
                      theme="light"
                    />
                    <GlobalAudioPlayer />
                  </BrowserRouter>
                </div>
              </SettingsProvider>
            </WishlistProvider>
          </LicenseProvider>
        </AudioProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;