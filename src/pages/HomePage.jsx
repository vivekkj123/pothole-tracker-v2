import Navbar from "../components/Navbar";
import PotholeMap from "../components/PotholeMap";
import { CardContent } from "@/components/ui/card";

const HomePage = () => {
  return (
    <div>
      <Navbar />
      <CardContent className="p-0 h-screen ">
        {" "}
        {/* Remove padding for map */}
        <PotholeMap />
      </CardContent>{" "}
    </div>
  );
};

export default HomePage;
