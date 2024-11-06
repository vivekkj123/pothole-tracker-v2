// Import necessary libraries at the beginning
import { useState, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  ZoomControl,
  useMap,
  CircleMarker,
  Popup,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { firestore } from "../utils/firebase";
import L from "leaflet";
import "leaflet-routing-machine";
import { Search, MapPin, Loader2 } from "lucide-react";
import _ from 'lodash';
import Navbar from "./Navbar";

// Format date helper function
const formatDate = (timestamp) => {
    if (!timestamp || !timestamp.toDate) {
      return "Date not available";
    }
    try {
      return new Date(timestamp.toDate()).toLocaleDateString();
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Date not available";
    }
};

// Define MapComponent
const MapComponent = ({ userLocation, potholes, fromCoords, toCoords }) => {
  const map = useMap();

  useEffect(() => {
    if (fromCoords && toCoords) {
      const bounds = L.latLngBounds([fromCoords, toCoords]);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, fromCoords, toCoords]);

  return (
    <>
      {fromCoords && toCoords && (
        <RouteControl fromCoords={fromCoords} toCoords={toCoords} />
      )}
      {potholes.map((pothole) => {
        const coordinates = pothole.location?.split(",").map((coord) => parseFloat(coord.trim())) || [];
        if (coordinates.length !== 2 || isNaN(coordinates[0]) || isNaN(coordinates[1])) {
          return null;
        }

        const [lat, lon] = coordinates;
        return (
          <CircleMarker
            key={pothole.id}
            center={[lat, lon]}
            radius={8}
            fillColor="red"
            color="white"
            weight={2}
            opacity={0.8}
            fillOpacity={0.6}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-lg mb-2">Pothole Report</h3>
                <div className="space-y-1">
                  <p className="flex items-center">
                    <span className="font-medium mr-2">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-sm ${
                      pothole.status === "Under Review"
                        ? "bg-yellow-100 text-yellow-800"
                        : pothole.status === "In Progress"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                    }`}>
                      {pothole.status}
                    </span>
                  </p>
                  <p>
                    <span className="font-medium">Reported:</span>{" "}
                    {formatDate(pothole.reportedDate)}
                  </p>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </>
  );
};

// RouteControl component
const RouteControl = ({ fromCoords, toCoords }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !fromCoords || !toCoords) return;

    const routingControl = L.Routing.control({
      waypoints: [
        L.latLng(fromCoords[0], fromCoords[1]),
        L.latLng(toCoords[0], toCoords[1]),
      ],
      routeWhileDragging: false,
      showAlternatives: true,
      lineOptions: {
        styles: [{ color: "#6366f1", weight: 6 }],
        extendToWaypoints: false,
        missingRouteTolerance: 0,
      },
    }).addTo(map);

    return () => {
      map.removeControl(routingControl);
    };
  }, [map, fromCoords, toCoords]);

  return null;
};

// Define LocationSearch component
const LocationSearch = ({ label, value, onChange, onSearch, isLoading }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const suggestionRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchSuggestions = _.debounce(async (input) => {
    if (!input.trim() || input.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoadingSuggestions(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          input
        )}&limit=5`
      );

      if (!response.ok) throw new Error("Failed to fetch suggestions");

      const data = await response.json();
      setSuggestions(data);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, 300);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);
    setShowSuggestions(true);
    fetchSuggestions(newValue);
  };

  const handleSuggestionClick = (suggestion) => {
    onChange(suggestion.display_name);
    setShowSuggestions(false);
    onSearch(suggestion.display_name, [parseFloat(suggestion.lat), parseFloat(suggestion.lon)]);
  };

  return (
    <div className="relative flex-1" ref={suggestionRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MapPin className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => value.length >= 3 && setShowSuggestions(true)}
          className="block w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter location..."
        />
        <button
          onClick={() => onSearch(value)}
          disabled={isLoading}
          className="absolute inset-y-0 right-0 flex items-center px-3 bg-blue-500 text-white rounded-r-lg hover:bg-blue-600 disabled:bg-gray-300"
        >
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
        </button>

        {/* Suggestions dropdown with higher z-index and position absolute */}
        {showSuggestions && (suggestions.length > 0 || isLoadingSuggestions) && (
          <div
            className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto"
            style={{ top: "100%", left: 0 }}
          >
            {isLoadingSuggestions ? (
              <div className="p-3 text-center text-gray-500">
                <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
                Loading suggestions...
              </div>
            ) : (
              suggestions.map((suggestion) => (
                <button
                  key={suggestion.place_id}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                >
                  <div className="font-medium">{suggestion.display_name}</div>
                  <div className="text-sm text-gray-500">
                    {suggestion.type} in {suggestion.country}
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Modified PotholeNavigation component
const PotholeNavigation = () => {
    const [potholes, setPotholes] = useState([]);
    const [userLocation, setUserLocation] = useState([10.8505, 76.2711]);
    const [fromAddress, setFromAddress] = useState("");
    const [toAddress, setToAddress] = useState("");
    const [fromCoords, setFromCoords] = useState(null);
    const [toCoords, setToCoords] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
  
    useEffect(() => {
      const q = query(
        collection(firestore, "potholes"),
        where("status", "!=", "Resolved")
      );
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const potholeData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPotholes(potholeData);
      });
  
      return () => unsubscribe();
    }, []);
  
    const searchLocation = async (address, coordinates = null) => {
      if (!address.trim()) {
        alert("Please enter a location");
        return;
      }
  
      // If coordinates are provided directly (from suggestions), use them
      if (coordinates) {
        return coordinates;
      }
  
      setIsSearching(true);
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`);
  
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
  
        const data = await response.json();
  
        if (data && data.length > 0) {
          return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        } else {
          alert("Location not found. Please try a different address.");
          return null;
        }
      } catch (error) {
        console.error("Error searching location:", error);
        alert("Error searching location. Please try again.");
        return null;
      } finally {
        setIsSearching(false);
      }
    };
  
    const handleSearch = async (address, coords, setCoords) => {
      const coordinates = coords || await searchLocation(address);
      if (coordinates) {
        setCoords(coordinates);
      }
    };
  
    return (
      <div className="flex flex-col h-screen">
        <Navbar/>
        <div className="p-4 bg-cyan-50 shadow-md z-10">
          <div className="flex flex-col md:flex-row gap-4">
            <LocationSearch
              label="From"
              value={fromAddress}
              onChange={setFromAddress}
              onSearch={(address, coords) => handleSearch(address, coords, setFromCoords)}
              isLoading={isSearching}
            />
            <LocationSearch
              label="To"
              value={toAddress}
              onChange={setToAddress}
              onSearch={(address, coords) => handleSearch(address, coords, setToCoords)}
              isLoading={isSearching}
            />
          </div>
        </div>
  
        <div className="flex-1 relative z-[-20]">
          <MapContainer
            center={userLocation}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ZoomControl position="bottomright" />
  
            <MapComponent
              userLocation={userLocation}
              potholes={potholes}
              fromCoords={fromCoords}
              toCoords={toCoords}
            />
          </MapContainer>
        </div>
      </div>
    );
  };
  
  export default PotholeNavigation;