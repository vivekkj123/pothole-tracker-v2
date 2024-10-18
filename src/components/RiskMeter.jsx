const RiskMeter = ({ risk }) => (
  <div className="flex justify-between items-center mt-4">
    <div
      className={`w-1/3 h-2 rounded-full ${
        risk === "HIGH" ? "bg-red-500" : "bg-gray-200"
      }`}
    />
    <div
      className={`w-1/3 h-2 rounded-full ${
        risk === "MEDIUM" ? "bg-yellow-500" : "bg-gray-200"
      }`}
    />
    <div
      className={`w-1/3 h-2 rounded-full ${
        risk === "LOW" ? "bg-green-500" : "bg-gray-200"
      }`}
    />
  </div>
);
export default RiskMeter;
