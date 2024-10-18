import { Doughnut } from "react-chartjs-2";

const StatusChart = ({ data }) => (
  <Doughnut
    data={{
      labels: ["Under Review", "In Progress", "Resolved"],
      datasets: [
        {
          data: data,
          backgroundColor: ["#EF4444", "#FBBF24", "#10B981"],
        },
      ],
    }}
    options={{
      responsive: true,
      plugins: {
        legend: {
          position: "right",
        },
      },
    }}
  />
);

export default StatusChart;
