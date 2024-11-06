import { signOut } from "firebase/auth";
import { Menu, X } from "lucide-react";
import React, { useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../utils/firebase";
import ReportPotholeModal from "./ReportPotholeModal";

const Navbar = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <header className="bg-white p-4 shadow-md">
      <div className="container mx-auto">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <img
              src="/emblem.svg"
              alt="Government of India Emblem"
              className="h-12"
            />
            <div className="hidden md:block">
              <h1 className="text-xl font-bold">
                Ministry of Road Transport and Highways
              </h1>
              <h2 className="text-lg">सड़क परिवहन और राजमार्ग मंत्रालय</h2>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-4">
            <NavLinks
              user={user}
              handleSignOut={handleSignOut}
              openReportModal={() => setIsReportModalOpen(true)}
            />
          </nav>

          <div className="md:hidden">
            <button onClick={toggleMenu} className="text-blue-600">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden mt-4">
          <nav className="flex flex-col space-y-4">
            <NavLinks
              user={user}
              handleSignOut={handleSignOut}
              openReportModal={() => setIsReportModalOpen(true)}
              mobile
            />
          </nav>
        </div>
      )}

      <ReportPotholeModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />
    </header>
  );
};

const NavLinks = ({ user, handleSignOut, openReportModal, mobile = false }) => (
  <>
    {user ? (
      <Link
        to="/dashboard"
        className={`text-blue-600 ${mobile ? "block" : ""}`}
      >
        Dashboard
      </Link>
    ) : (
      <Link to="/" className={`text-blue-600 ${mobile ? "block" : ""}`}>
        Home
      </Link>
    )}

<Link to="/navigation" className={`text-blue-600 ${mobile ? "block" : ""}`}>
      Navigation Map
    </Link>
    <Link to="/review" className={`text-blue-600 ${mobile ? "block" : ""}`}>
      Review
    </Link>
    <Link to="/contacts" className={`text-blue-600 ${mobile ? "block" : ""}`}>
      Contacts
    </Link>
    <Link to="/about" className={`text-blue-600 ${mobile ? "block" : ""}`}>
      About
    </Link>
    {user ? (
      <button
        onClick={handleSignOut}
        className={`text-blue-600 ${mobile ? "block" : ""}`}
      >
        Sign Out
      </button>
    ) : (
      <>
        <Link to="/login" className={`text-blue-600 ${mobile ? "block" : ""}`}>
          Govt. Login
        </Link>
        <button
          onClick={openReportModal}
          className={`text-white px-8 py-2 rounded-full bg-blue-600 ${
            mobile ? "inline-block mt-2" : ""
          }`}
        >
          Report a Pothole
        </button>
      </>
    )}
  </>
);

export default Navbar;