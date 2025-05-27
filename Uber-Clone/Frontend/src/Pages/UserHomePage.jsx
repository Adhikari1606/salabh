import React, { useContext, useState, useEffect } from "react";
import { Search, MapPin, User, LogOut, X } from "lucide-react";
import { motion } from "framer-motion";
import { LocationInput, RecentTrips, LookingForDriver, OffersSection } from "../Components";
import { SocketContext } from "../Context/SocketContext";
import { UserDataContext } from "../Context/UserContext";
import { useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function UserHomePage() {
  const [pickup, setPickup] = useState("");
  const [drop, setDrop] = useState("");
  const [showDriverSearch, setShowDriverSearch] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showPredictFarePopup, setShowPredictFarePopup] = useState(false);
  const { socket } = useContext(SocketContext);
  const { user } = useContext(UserDataContext);
  const nav = useNavigate();

  useEffect(() => {
    if (socket && user) {
      socket.emit("join", { userId: user._id, role: "user" });
    }
  }, [user, socket]);

  const handleBack = () => {
    if (showDriverSearch) {
      setShowDriverSearch(false);
    }
  };

  const handlePickupChange = (value) => {
    setPickup(value);
  };

  const handleDropChange = (value) => {
    setDrop(value);
  };

  const handleLogout = () => {
    nav("/user/logout");
    console.log("Logging out...");
  };

  const goProfile = () => {
    nav("/user/profile");
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-black text-white p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Welcome, {user?.fullname?.firstname}</h1>
        <div className="relative">
          <button
            className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors flex items-center"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            <User className="w-6 h-6 mr-2" />
            <span onClick={goProfile}>Profile</span>
          </button>
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
              <button
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 inline-block mr-2" />
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="p-4 max-w-3xl mx-auto">
        {showDriverSearch ? (
          <motion.div key="driver-search">
            <LookingForDriver pickup={pickup} drop={drop} onBack={handleBack} />
          </motion.div>
        ) : (
          <motion.div key="main-view">
            <div className="mb-6">
              <LocationInput
                placeholder="Enter pickup location"
                icon={MapPin}
                value={pickup}
                onChange={handlePickupChange}
              />
              <LocationInput
                placeholder="Enter drop location"
                icon={MapPin}
                value={drop}
                onChange={handleDropChange}
              />
              <button
                className="w-full bg-black text-white p-3 rounded-lg mt-2 flex items-center justify-center"
                onClick={() => setShowDriverSearch(true)}
              >
                <Search className="w-5 h-5 mr-2" />
                Find a Ride
              </button>
              <div className="flex justify-between mt-4">
                {/* Date Picker Input */}
                <div className="flex flex-col items-start">
                  <label className="text-sm font-medium text-gray-700 mb-1">Select Date</label>
                  <DatePicker
                    selected={selectedDate}
                    onChange={(date) => setSelectedDate(date)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholderText="Select a date"
                  />
                </div>
                <button
                  className="w-full bg-black text-white p-3 rounded-lg mt-2 flex items-center justify-center"
                  onClick={() => window.open("http://127.0.0.1:5000", "_blank")}
                >
                  <Search className="w-5 h-5 mr-2" />
                  Predict Fare
                </button>
              </div>
            </div>

            <RecentTrips />

            <OffersSection />
          </motion.div>
        )}
        <div className="px-4 py-5 sm:px-6 border-t border-gray-200">
          <button
            className="w-full sm:w-auto border border-gray-300 text-gray-700 font-bold py-2 px-4 rounded hover:bg-gray-100 transition duration-300"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </main>

      {/* Predict Fare Popup */}
      {showPredictFarePopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => setShowPredictFarePopup(false)}
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-bold mb-4">Predict Fare</h2>
            
          </div>
        </div>
      )}
    </div>
  );
}