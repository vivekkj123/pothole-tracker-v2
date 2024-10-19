import { useAuthState } from "react-firebase-hooks/auth";
import { Navigate, useLocation } from "react-router-dom";
import { auth } from "../utils/firebase";

const PrivateRoute = ({ children }) => {
  const [user, loading] = useAuthState(auth);
  const location = useLocation();

  if (loading) {
    // You can replace this with a loading spinner or component
    return <div>Loading...</div>;
  }

  if (!user) {
    // Redirect to login if there's no user
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If there's a user, render the children components
  return children;
};

export default PrivateRoute;
