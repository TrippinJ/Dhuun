import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const data = [
  { month: "Jan", earnings: 400 },
  { month: "Feb", earnings: 700 },
  { month: "Mar", earnings: 900 },
  { month: "Apr", earnings: 600 },
  { month: "May", earnings: 1100 },
];

const EarningsChart = () => {
  return (
    <ResponsiveContainer width="90%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="earnings" stroke="#8884d8" />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default EarningsChart;
