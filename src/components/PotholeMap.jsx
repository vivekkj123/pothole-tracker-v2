import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, ZoomControl, useMap, CircleMarker, Popup } from 'react-leaflet';
import "leaflet/dist/leaflet.css";
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { firestore } from '../utils/firebase';

const PotholeMap = () => {
  const [potholes, setPotholes] = useState([]);
  const [userLocation, setUserLocation] = useState([10.8505, 76.2711]); // Default location
  const [mapReady, setMapReady] = useState(false);

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

    return () => unsubscribe();
  }, []);

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.error("Error getting user location:", error);
        }
      );
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
      <button onClick={handleGetLocation} className="absolute top-2 right-2 z-[1000] bg-blue-500 text-white p-2 rounded">
        Use My Location
      </button>
      <MapContainer
        center={userLocation}
        zoom={13}
        className="h-full w-full"
        zoomControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <ZoomControl position="bottomright" />
        
        {potholes.map(pothole => {
          const [lat, lon] = pothole.location.split(',').map(coord => parseFloat(coord.trim()));
          return (
            <CircleMarker 
              key={pothole.id} 
              center={[lat, lon]}
              radius={5}
              fillColor="red"
              color="red"
              weight={1}
              opacity={0.6}
              fillOpacity={0.4}
            >
              <Popup>
                <div>
                  <h3 className="font-bold">Pothole</h3>
                  <p>Status: {pothole.status}</p>
                  <p>Reported: {new Date(pothole.reportedDate.toDate()).toLocaleDateString()}</p>
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