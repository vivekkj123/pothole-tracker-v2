import { ArcElement, Chart as ChartJS, Legend, Tooltip } from "chart.js";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import {
    Circle,
    MapContainer,
    TileLayer,
    ZoomControl,
    useMap,
} from "react-leaflet";

ChartJS.register(ArcElement, Tooltip, Legend);

const PotholeMap = () => {
  // This component ensures Leaflet resizes the map when needed
  const MapResizeHandler = () => {
    const map = useMap();

    useEffect(() => {
      map.invalidateSize(); // Forces Leaflet to recalculate tile positions
    }, [map]);

    return null;
  };

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={[10.8505, 76.2711]}
        zoom={30}
        className="h-full w-full" // Ensures the map occupies the full size of its container
        zoomControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <ZoomControl position="bottomright" />
        <Circle
          center={[10.9, 75.8]}
          radius={5000}
          pathOptions={{ color: "red", fillColor: "red", fillOpacity: 0.5 }}
        />
        <Circle
          center={[10.7, 76.1]}
          radius={3000}
          pathOptions={{
            color: "yellow",
            fillColor: "yellow",
            fillOpacity: 0.5,
          }}
        />
        <Circle
          center={[10.6, 76.3]}
          radius={2000}
          pathOptions={{ color: "green", fillColor: "green", fillOpacity: 0.5 }}
        />
        {/* Call the resize handler */}
        <MapResizeHandler />
      </MapContainer>
    </div>
  );
};

export default PotholeMap;
