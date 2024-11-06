import { useState, useEffect } from "react";
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
import { Search, MapPin } from "lucide-react";

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

// Fix Leaflet icon issues
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// LocationSearch component for address input
const LocationSearch = ({ label, value, onChange, onSearch, isLoading }) => {
  return (
    <div className="flex-1">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MapPin className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="block w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter location..."
        />
        <button
          onClick={onSearch}
          disabled={isLoading}
          className="absolute inset-y-0 right-0 flex items-center px-3 bg-blue-500 text-white rounded-r-lg hover:bg-blue-600 disabled:bg-gray-300"
        >
          <Search className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

// RouteControl component to handle routing
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

// MapComponent to handle map interactions
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
        const coordinates =
          pothole.location
            ?.split(",")
            .map((coord) => parseFloat(coord.trim())) || [];
        if (
          coordinates.length !== 2 ||
          isNaN(coordinates[0]) ||
          isNaN(coordinates[1])
        ) {
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
                    <span
                      className={`px-2 py-1 rounded-full text-sm ${
                        pothole.status === "Under Review"
                          ? "bg-yellow-100 text-yellow-800"
                          : pothole.status === "In Progress"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
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

  const searchLocation = async (address, setCoords) => {
    if (!address.trim()) {
      alert("Please enter a location");
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          address
        )}&limit=1`
      );

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();

      if (data && data.length > 0) {
        setCoords([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
      } else {
        alert("Location not found. Please try a different address.");
      }
    } catch (error) {
      console.error("Error searching location:", error);
      alert("Error searching location. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="p-4 bg-white shadow-md z-10">
        <div className="flex flex-col md:flex-row gap-4">
          <LocationSearch
            label="From"
            value={fromAddress}
            onChange={setFromAddress}
            onSearch={() => searchLocation(fromAddress, setFromCoords)}
            isLoading={isSearching}
          />
          <LocationSearch
            label="To"
            value={toAddress}
            onChange={setToAddress}
            onSearch={() => searchLocation(toAddress, setToCoords)}
            isLoading={isSearching}
          />
        </div>
      </div>

      <div className="flex-1 relative">
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