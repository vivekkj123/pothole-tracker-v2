import React, { useState, useEffect } from 'react';
import { X, MapPin, Upload, Image as ImageIcon } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { firestore, storage } from '../utils/firebase';

const ReportPotholeModal = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (photo) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(photo);
    } else {
      setPhotoPreview(null);
    }
  }, [photo]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.substr(0, 5) === "image") {
      setPhoto(file);
    } else {
      setPhoto(null);
      setError("Please select an image file.");
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        },
        (error) => {
          setError(`Error getting location: ${error.message}`);
        }
      );
    } else {
      setError("Geolocation is not supported by this browser.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!location) {
      setError("Please get your current location before submitting.");
      return;
    }
    setIsSubmitting(true);
    setError(null);

    try {
      const storageRef = ref(storage, `reported_potholes/${Date.now()}`);
      await uploadBytes(storageRef, photo);
      const photoURL = await getDownloadURL(storageRef);

      await addDoc(collection(firestore, 'potholes'), {
        email,
        location,
        photoURL,
        status: 'Under Review',
        reportedDate: serverTimestamp(),
      });

      onClose();
      // You might want to show a success message here
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
          <DialogTitle className="text-2xl font-bold text-blue-600">Report a Pothole</DialogTitle>
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          >
            <X className="h-4 w-4 text-blue-600" />
            <span className="sr-only">Close</span>
          </button>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email" className="text-blue-600">Email</Label>
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
            <Label htmlFor="location" className="text-blue-600">Location</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="location"
                value={location}
                readOnly
                placeholder="GPS coordinates will appear here"
                className="border-blue-300 focus:border-blue-500 focus:ring-blue-500 flex-grow"
              />
              <Button type="button" onClick={getCurrentLocation} className="bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap">
                <MapPin className="w-4 h-4 mr-2" />
                Get Location
              </Button>
            </div>
          </div>
          <div>
            <Label htmlFor="photo" className="text-blue-600">Photo</Label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-blue-300 border-dashed rounded-md">
              {photoPreview ? (
                <div className="space-y-1 text-center">
                  <img src={photoPreview} alt="Preview" className="mx-auto h-32 w-32 object-cover rounded-md" />
                  <button
                    type="button"
                    onClick={() => {
                      setPhoto(null);
                      setPhotoPreview(null);
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
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReportPotholeModal;