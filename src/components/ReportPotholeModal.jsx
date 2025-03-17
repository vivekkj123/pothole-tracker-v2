import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { Image as ImageIcon, MapPin, X } from "lucide-react";
import { useEffect, useState } from "react";
import { firestore, storage } from "../utils/firebase";

const ReportPotholeModal = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("");
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [detections, setDetections] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState(null);

  // Check for geolocation permission status on component mount
  useEffect(() => {
    checkLocationPermission();
  }, []);

  const checkLocationPermission = async () => {
    if (!navigator.permissions || !navigator.permissions.query) {
      // Fallback for browsers that don't support permissions API
      setPermissionStatus("unknown");
      return;
    }

    try {
      const result = await navigator.permissions.query({ name: "geolocation" });
      setPermissionStatus(result.state);

      result.addEventListener("change", () => {
        setPermissionStatus(result.state);
      });
    } catch (err) {
      console.error("Error checking location permission:", err);
      setPermissionStatus("unknown");
    }
  };

  const getCurrentLocation = () => {
    setIsGettingLocation(true);
    setError(null);

    // Options optimized for mobile
    const options = {
      enableHighAccuracy: true,
      timeout: 15000, // Increased timeout for slower mobile connections
      maximumAge: 0,
    };

    const handleSuccess = (position) => {
      const { latitude, longitude, accuracy } = position.coords;
      setLocation(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
      setIsGettingLocation(false);
      setError(null);

      // If accuracy is poor, inform the user but still allow them to proceed
      if (accuracy > 100) {
        // accuracy is in meters
        setError(
          "Warning: Location accuracy is low. Please ensure you're outdoors with clear sky view."
        );
      }
    };

    const handleError = (error) => {
      setIsGettingLocation(false);
      let errorMessage = "";

      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage =
            permissionStatus === "prompt"
              ? "Please allow location access when prompted by your browser."
              : "Location access was denied. Please enable location in your device settings and refresh the page.";
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage =
            "Unable to detect your location. Please ensure location services are enabled and you have a clear sky view.";
          break;
        case error.TIMEOUT:
          errorMessage =
            "Location request timed out. Please check your internet connection and try again.";
          break;
        default:
          errorMessage = `Unable to detect location: ${error.message}`;
      }

      setError(errorMessage);
    };

    // Clear any existing location data
    setLocation("");

    // First check if geolocation is available
    if (!navigator.geolocation) {
      setIsGettingLocation(false);
      setError(
        "Geolocation is not supported by your browser. Please try using a different browser or device."
      );
      return;
    }

    // Attempt to get location
    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      handleError,
      options
    );
  };

  const detectPotholes = async (file) => {
    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch(
        "https://pothole-s81-16128562725.asia-southeast1.run.app/detect",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to analyze image");
      }

      const data = await response.json();
      setDetections(data.detections);
      setPhotoPreview(`data:image/jpeg;base64,${data.image_data}`);
    } catch (err) {
      setError(`Error analyzing image: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      if (file.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB");
        return;
      }
      setPhoto(file);
      await detectPotholes(file);
    } else {
      setPhoto(null);
      setPhotoPreview(null);
      setDetections([]);
      setError("Please select a valid image file.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log(detections);

    if (!location) {
      setError("Please get your current location before submitting.");
      return;
    }
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(photoPreview);
      const blob = await response.blob();

      const storageRef = ref(storage, `reported_potholes/${Date.now()}`);
      await uploadBytes(storageRef, blob);
      const photoURL = await getDownloadURL(storageRef);

      await addDoc(collection(firestore, "potholes"), {
        email,
        location,
        photoURL,
        detections,
        status: "Under Review",
        reportedDate: serverTimestamp(),
      });

      onClose();
    } catch (err) {
      setError(`Error submitting report: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-blue-600">
            Report a Pothole
          </DialogTitle>
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          >
            <span className="sr-only">Close</span>
          </button>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email" className="text-blue-600">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="border-blue-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <Label htmlFor="location" className="text-blue-600">
              Location
            </Label>
            <div className="flex items-center space-x-2">
              <Input
                id="location"
                value={location}
                readOnly
                placeholder="GPS coordinates will appear here"
                className="border-blue-300 focus:border-blue-500 focus:ring-blue-500 flex-grow"
              />
              <Button
                type="button"
                onClick={getCurrentLocation}
                disabled={isGettingLocation}
                className="bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap"
              >
                {isGettingLocation ? (
                  <>
                    <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Getting...
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4 mr-2" />
                    Get Location
                  </>
                )}
              </Button>
            </div>
            {permissionStatus === "denied" && (
              <p className="mt-1 text-sm text-red-500">
                Location access is blocked. Please enable it in your device
                settings.
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="photo" className="text-blue-600">
              Photo
            </Label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-blue-300 border-dashed rounded-md">
              {isAnalyzing ? (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-600">
                    Analyzing image...
                  </p>
                </div>
              ) : photoPreview ? (
                <div className="space-y-1 text-center">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="mx-auto h-32 w-32 object-cover rounded-md"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPhoto(null);
                      setPhotoPreview(null);
                      setDetections([]);
                    }}
                    className="mt-2 inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Remove photo
                  </button>
                </div>
              ) : (
                <div className="space-y-1 text-center">
                  <ImageIcon className="mx-auto h-12 w-12 text-blue-400" />
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="photo"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                    >
                      <span>Upload a photo</span>
                      <Input
                        id="photo"
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        required
                        className="sr-only"
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, GIF up to 10MB
                  </p>
                </div>
              )}
            </div>
          </div>
          {error && (
            <>
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </>
          )}

          <div className={detections.length != 0 || photo === null ? `hidden` : `block`}>
            <Alert variant="">
              <AlertDescription>
                {detections.length === 0 ? "No Potholes Detected" : ""}
              </AlertDescription>
            </Alert>
          </div>

          <Button
            type="submit"
            disabled={
              isSubmitting ||
              isAnalyzing ||
              isGettingLocation ||
              detections.length === 0 ||
              !detections
            }
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSubmitting ? "Submitting..." : "Submit Report"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReportPotholeModal;
