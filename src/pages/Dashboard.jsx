import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Navbar from "../components/Navbar";
import PotholeMap from "../components/PotholeMap";
import RiskMeter from "../components/RiskMeter";
import StatusChart from "../components/StatusChart";

const Dashboard = () => {
  const statusData = [20, 50, 30];
  const riskData = { high: 35, medium: 50, low: 15 };

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
              <CardContent>
                <h3 className="text-xl font-bold mb-2">
                  Total Potholes Reported:{" "}
                  <span className="text-blue-600 text-3xl">100</span>
                </h3>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <h3 className="text-lg font-semibold mb-2">Risk Assessment</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>High Risk Case</span>
                    <span className="text-red-500">{riskData.high}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Medium Risk</span>
                    <span className="text-yellow-500">{riskData.medium}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Low Risk</span>
                    <span className="text-green-500">{riskData.low}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
