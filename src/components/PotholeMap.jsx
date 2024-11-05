import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, ZoomControl, useMap, CircleMarker, Popup } from 'react-leaflet';
import "leaflet/dist/leaflet.css";
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { firestore } from '../utils/firebase';

// New component to handle map center updates
const LocationMarker = ({ position }) => {
  const map = useMap();
  
  useEffect(() => {
    if (position) {
      map.setView(position, 13);
    }
  }, [map, position]);

  return null;
};

const PotholeMap = () => {
  const [potholes, setPotholes] = useState([]);
  const [userLocation, setUserLocation] = useState([10.8505, 76.2711]); // Default location
  const [mapReady, setMapReady] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    // Fetch potholes data
    const q = query(collection(firestore, "potholes"), where("status", "!=", "Resolved"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const potholeData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPotholes(potholeData);
    }, (error) => {
      console.error("Error fetching potholes:", error);
    });

    // Try to get initial user location
    handleGetLocation();

    return () => unsubscribe();
  }, []);

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = [position.coords.latitude, position.coords.longitude];
          setUserLocation(newLocation);
          setIsLocating(false);
        },
        (error) => {
          console.error("Error getting user location:", error);
          setIsLocating(false);
          // Optionally show error to user
          alert("Unable to get your location. Please check your browser permissions.");
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    } else {
      alert("Geolocation is not supported by your browser");
    }
  };

  // Format date safely
  const formatDate = (timestamp) => {
    if (!timestamp || !timestamp.toDate) {
      return 'Date not available';
    }
    try {
      return new Date(timestamp.toDate()).toLocaleDateString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Date not available';
    }
  };

  // This component ensures Leaflet resizes the map when needed
  const MapResizeHandler = () => {
    const map = useMap();

    useEffect(() => {
      if (!mapReady) {
        map.invalidateSize();
        setMapReady(true);
      }
    }, [map]);

    return null;
  };

  return (
    <div className="w-full h-full relative">
      <button 
        onClick={handleGetLocation} 
        disabled={isLocating}
        className={`absolute top-2 right-2 z-[1000] ${
          isLocating 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-blue-500 hover:bg-blue-600'
        } text-white px-4 py-2 rounded-lg shadow-md transition-colors`}
      >
        {isLocating ? 'Getting Location...' : 'Use My Location'}
      </button>
      
      <MapContainer
        center={userLocation}
        zoom={13}
        className="h-full w-full"
        zoomControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <ZoomControl position="bottomright" />
        
        {/* Add LocationMarker to handle map updates */}
        <LocationMarker position={userLocation} />
        
        {potholes.map(pothole => {
          // Safely handle location parsing
          const coordinates = pothole.location?.split(',').map(coord => parseFloat(coord.trim())) || [];
          if (coordinates.length !== 2 || isNaN(coordinates[0]) || isNaN(coordinates[1])) {
            console.warn(`Invalid coordinates for pothole ${pothole.id}`);
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
                        pothole.status === 'Under Review' ? 'bg-yellow-100 text-yellow-800' :
                        pothole.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {pothole.status}
                      </span>
                    </p>
                    <p>
                      <span className="font-medium">Reported:</span>{' '}
                      {formatDate(pothole.reportedDate)}
                    </p>
                    {pothole.detections && pothole.detections.length > 0 && (
                      <div className="mt-2">
                        <p className="font-medium">Detections:</p>
                        <ul className="text-sm text-gray-600">
                          {pothole.detections.map((detection, index) => (
                            <li key={index}>{detection}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        <MapResizeHandler />
      </MapContainer>
    </div>
  );
};

export default PotholeMap;