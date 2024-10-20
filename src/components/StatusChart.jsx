import React, { useEffect, useRef } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const StatusChart = ({ data }) => {
  const chartRef = useRef(null);

  useEffect(() => {
    // Destroy the previous chart instance before creating a new one
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, []);

  const chartData = {
    labels: ['Under Review', 'In Progress', 'Resolved'],
    datasets: [
      {
        data: data,
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
        hoverBackgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
  };

  return <Pie ref={chartRef} data={chartData} options={options} />;
};

export default StatusChart;