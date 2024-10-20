import React, { useEffect, useState } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Navbar from "../components/Navbar";
import PotholeMap from "../components/PotholeMap";
import RiskMeter from "../components/RiskMeter";
import StatusChart from "../components/StatusChart";
import { firestore } from "../utils/firebase";

const Dashboard = () => {
  const [statusData, setStatusData] = useState([0, 0, 0]); // [Under Review, In Progress, Resolved]
  const [riskData, setRiskData] = useState({ high: 0, medium: 0, low: 0 });
  const [totalPotholes, setTotalPotholes] = useState(0);

  useEffect(() => {
    const q = query(collection(firestore, "potholes"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const potholeData = querySnapshot.docs.map((doc) => doc.data());

      const statusCounts = { underReview: 0, inProgress: 0, resolved: 0 };
      const riskCounts = { high: 0, medium: 0, low: 0 };

      potholeData.forEach((pothole) => {
        // Count statuses
        if (pothole.status === "Under Review") {
          statusCounts.underReview++;
        } else if (pothole.status === "In Progress") {
          statusCounts.inProgress++;
        } else if (pothole.status === "Resolved") {
          statusCounts.resolved++;
        }

        // Count risk levels
        if (pothole.riskLevel === "High") {
          riskCounts.high++;
        } else if (pothole.riskLevel === "Medium") {
          riskCounts.medium++;
        } else if (pothole.riskLevel === "Low") {
          riskCounts.low++;
        }
      });

      setStatusData([statusCounts.underReview, statusCounts.inProgress, statusCounts.resolved]);
      setRiskData(riskCounts);
      setTotalPotholes(potholeData.length);
    });

    return () => unsubscribe();
  }, []);

  return (
    <>
      <Navbar />
      <div className="container mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
          <div className="lg:col-span-2">
            <Card className="h-full">
              {" "}
              {/* Ensure the card takes full height */}
              <CardContent className="p-0 h-screen ">
                {" "}
                {/* Remove padding for map */}
                <PotholeMap />
              </CardContent>
            </Card>
          </div>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold mb-2">Pothole Status</h3>
              </CardHeader>
              <CardContent>
                <StatusChart data={statusData} />
              </CardContent>
            </Card>
            <Card>
              <CardContent className='flex'>
                <h3 className="text-xl font-bold pt-4 my-2">
                  Total Potholes Reported:{" "}
                  <span className="text-blue-600 text-3xl">{totalPotholes}</span>
                </h3>
              </CardContent>
            </Card>
            
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
