import React, { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  collection,
  doc,
  onSnapshot,
  query,
  updateDoc,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useAuthState } from "react-firebase-hooks/auth";
import Navbar from "../components/Navbar";
import { auth, firestore, storage } from "../utils/firebase";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Fix Leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const MiniMap = ({ location }) => {
  const [lat, lon] = location
    .split(",")
    .map((coord) => parseFloat(coord.trim()));

  return (
    <MapContainer
      center={[lat, lon]}
      zoom={40}
      style={{ height: "100px", width: "100px" }}
      attributionControl={false}
      zoomControl={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <Marker position={[lat, lon]} />
    </MapContainer>
  );
};

const ReviewPage = () => {
  const [user] = useAuthState(auth);
  const [potholes, setPotholes] = useState([]);
  const [error, setError] = useState(null);
  const [sortOrder, setSortOrder] = useState("desc"); // 'asc' or 'desc'

  useEffect(() => {
    if (!user) return;

    const q = query(collection(firestore, "potholes"));
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const potholeData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          detectionCount: doc.data().detections?.length || 0,
        }));

        // Sort by detection count
        const sortedData = potholeData.sort((a, b) =>
          sortOrder === "desc"
            ? b.detectionCount - a.detectionCount
            : a.detectionCount - b.detectionCount
        );

        setPotholes(sortedData);
      },
      (err) => {
        setError("Error fetching potholes: " + err.message);
      }
    );

    return () => unsubscribe();
  }, [user, sortOrder]);

  const handleStatusChange = async (potholeId, newStatus) => {
    try {
      await updateDoc(doc(firestore, "potholes", potholeId), {
        status: newStatus,
      });
    } catch (err) {
      setError("Error updating status: " + err.message);
    }
  };

  const handlePhotoUpload = async (potholeId, file) => {
    if (!file) return;

    try {
      const storageRef = ref(storage, `resolved_potholes/${potholeId}`);
      await uploadBytes(storageRef, file);
      const photoURL = await getDownloadURL(storageRef);

      await updateDoc(doc(firestore, "potholes", potholeId), {
        status: "Resolved",
        resolvedPhotoURL: photoURL,
      });
    } catch (err) {
      setError("Error uploading photo: " + err.message);
    }
  };

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));
  };

  // Calculate counts for each status
  const statusCounts = potholes.reduce((acc, pothole) => {
    acc[pothole.status] = (acc[pothole.status] || 0) + 1;
    return acc;
  }, {});

  if (!user) {
    return (
      <Alert>
        <AlertDescription>Please log in to view this page.</AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      <Navbar />
      <div className="my-10 container mx-auto p-4 bg-gray-50">
        <h1 className="text-2xl font-bold mb-4 text-blue-600">
          Review Reported Potholes
        </h1>

        {/* Status Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {Object.entries(statusCounts).map(([status, count]) => (
            <div
              key={status}
              className="bg-white p-4 rounded-lg shadow border border-blue-200"
            >
              <h3 className="text-lg font-semibold text-blue-600">{status}</h3>
              <p className="text-3xl font-bold">{count}</p>
              <p className="text-sm text-gray-500">potholes</p>
            </div>
          ))}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="overflow-x-auto">
          <div className="mb-4">
            <Button
              onClick={toggleSortOrder}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Sort by Detections {sortOrder === "desc" ? "↓" : "↑"}
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="bg-blue-100">
                <TableHead className="text-blue-600">Location</TableHead>
                <TableHead className="text-blue-600">Reported Image</TableHead>
                <TableHead className="text-blue-600">Detections</TableHead>
                <TableHead className="text-blue-600">Reported Date</TableHead>
                <TableHead className="text-blue-600">Status</TableHead>
                <TableHead className="text-blue-600">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {potholes.map((pothole) => (
                <TableRow key={pothole.id} className="border-b border-blue-200">
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 h-24 relative overflow-hidden rounded-md border border-blue-300">
                        <MiniMap location={pothole.location} />
                      </div>
                      <span>{pothole.location}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="w-24 h-24 relative overflow-hidden rounded-md border border-blue-300">
                      <img
                        src={pothole.photoURL}
                        alt="Reported pothole"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-center">
                      <span className="text-lg font-bold">
                        {pothole.detectionCount}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(
                      pothole.reportedDate.toDate()
                    ).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Select
                      onValueChange={(value) =>
                        handleStatusChange(pothole.id, value)
                      }
                      defaultValue={pothole.status}
                    >
                      <SelectTrigger className="border-blue-300 focus:ring-blue-500">
                        <SelectValue placeholder={pothole.status} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Under Review">
                          Under Review
                        </SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {pothole.status !== "Resolved" && (
                      <div className="flex items-center space-x-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            handlePhotoUpload(pothole.id, e.target.files[0])
                          }
                          className="border-blue-300 focus:ring-blue-500"
                        />
                        <Button
                          onClick={() =>
                            handleStatusChange(pothole.id, "Resolved")
                          }
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <MapPin className="w-4 h-4 mr-2" />
                          Mark as Resolved
                        </Button>
                      </div>
                    )}
                    {pothole.status === "Resolved" &&
                      pothole.resolvedPhotoURL && (
                        <a
                          href={pothole.resolvedPhotoURL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 underline"
                        >
                          View Resolved Photo
                        </a>
                      )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
};

export default ReviewPage;
