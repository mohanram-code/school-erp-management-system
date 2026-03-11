"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

const SettingsPage = () => {
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [radius, setRadius] = useState("100");
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/settings");
      const data = await response.json();
      if (data.settings) {
        setLatitude(data.settings.schoolLatitude?.toString() || "");
        setLongitude(data.settings.schoolLongitude?.toString() || "");
        setRadius(data.settings.radiusMeters?.toString() || "100");
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    }
  };

  const handleSave = async () => {
    if (!latitude || !longitude || !radius) {
      setMessage("Please fill in all fields");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitude, longitude, radius }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Settings saved successfully!");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage(data.error || "Failed to save settings");
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (error) {
      setMessage("Error saving settings");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    setGettingLocation(true);
    setMessage("Getting your current location...");

    if (!navigator.geolocation) {
      setMessage("Geolocation is not supported by your browser");
      setGettingLocation(false);
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toString());
        setLongitude(position.coords.longitude.toString());
        setMessage("Location detected! Click 'Save Location' to apply.");
        setGettingLocation(false);
        setTimeout(() => setMessage(""), 5000);
      },
      (error) => {
        let errorMessage = "Unable to get location. ";
        if (error.code === error.PERMISSION_DENIED) {
          errorMessage += "Please enable location access in your browser.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMessage += "Location information is unavailable.";
        } else {
          errorMessage += "Request timed out.";
        }
        setMessage(errorMessage);
        setGettingLocation(false);
        setTimeout(() => setMessage(""), 5000);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return (
    <div className="flex-1 p-4">
      <div className="bg-white p-6 rounded-md">
        <h1 className="text-2xl font-semibold mb-6">System Settings</h1>
        <p className="text-sm text-gray-500 mb-6">Admin-only configuration panel</p>

        {/* School Configuration */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Image src="/home.png" alt="" width={20} height={20} />
            School Configuration
          </h2>
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <div className="flex justify-between items-center py-2 border-b">
              <div>
                <p className="font-medium">School Name</p>
                <p className="text-sm text-gray-500">PencilDZ School Management</p>
              </div>
              <button className="text-purple-600 font-medium text-sm hover:underline">
                Edit
              </button>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <div>
                <p className="font-medium">Academic Year</p>
                <p className="text-sm text-gray-500">2024-2025</p>
              </div>
              <button className="text-purple-600 font-medium text-sm hover:underline">
                Edit
              </button>
            </div>
            <div className="flex justify-between items-center py-2">
              <div>
                <p className="font-medium">Total Classes</p>
                <p className="text-sm text-gray-500">Configure class structure</p>
              </div>
              <button className="text-purple-600 font-medium text-sm hover:underline">
                Manage
              </button>
            </div>
          </div>
        </div>

        {/* Location Settings */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Image src="/home.png" alt="" width={20} height={20} />
            School Location Settings
          </h2>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800">
              <strong>Important:</strong> Set your school's GPS coordinates to enable location-based attendance for teachers.
            </p>
          </div>

          {message && (
            <div className={`p-3 rounded-lg mb-4 ${
              message.includes("success") || message.includes("detected")
                ? "bg-green-50 text-green-800 border border-green-200" 
                : message.includes("Getting")
                ? "bg-blue-50 text-blue-800 border border-blue-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}>
              <div className="flex items-center gap-2">
                {gettingLocation && <div className="animate-spin">📍</div>}
                <span>{message}</span>
              </div>
            </div>
          )}

          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="e.g., 13.0827"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="e.g., 80.2707"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">
                Allowed Radius (meters)
              </label>
              <input
                type="number"
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Teachers can mark attendance within this radius from school location
              </p>
            </div>
            <div className="flex gap-3 mt-4">
              <button 
                onClick={handleSave}
                disabled={loading || gettingLocation}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save Location"}
              </button>
              <button 
                onClick={getCurrentLocation}
                disabled={loading || gettingLocation}
                className="border border-purple-600 text-purple-600 px-4 py-2 rounded-lg text-sm hover:bg-purple-50 disabled:opacity-50"
              >
                {gettingLocation ? "Getting..." : "Get Current Location"}
              </button>
            </div>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Image src="/announcement.png" alt="" width={20} height={20} />
            Notification Preferences
          </h2>
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <div className="flex justify-between items-center py-2">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-gray-500">Receive system updates via email</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
            <div className="flex justify-between items-center py-2">
              <div>
                <p className="font-medium">Low Attendance Alerts</p>
                <p className="text-sm text-gray-500">Get notified when student attendance drops</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
            <div className="flex justify-between items-center py-2">
              <div>
                <p className="font-medium">Fee Payment Reminders</p>
                <p className="text-sm text-gray-500">Automatic reminders for pending fees</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* System Preferences */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">System Preferences</h2>
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <div className="flex justify-between items-center py-2">
              <div>
                <p className="font-medium">Theme</p>
                <p className="text-sm text-gray-500">Choose system theme</p>
              </div>
              <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option>Light</option>
                <option>Dark</option>
                <option>System</option>
              </select>
            </div>
            <div className="flex justify-between items-center py-2">
              <div>
                <p className="font-medium">Language</p>
                <p className="text-sm text-gray-500">System language</p>
              </div>
              <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option>English</option>
                <option>Hindi</option>
                <option>Tamil</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;