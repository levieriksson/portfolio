export type ProjectStat = {
  label: string;
  value: string | number;
};

export type Project = {
  title: string;
  stats: ProjectStat[];
};

export const projects: Project[] = [
  {
    title: "Flight Tracker",
    stats: [
      { label: "Current Flights", value: 123 },
      { label: "Highest Altitude", value: "12,000 m" },
      { label: "Average Delay", value: "5 min" },
      { label: "On Time %", value: "97%" },
      { label: "Tracked Airports", value: 15 },
    ],
  },
  {
    title: "Weather App",
    stats: [
      { label: "Location", value: "Stockholm" },
      { label: "Temperature", value: "-4°C" },
      { label: "Humidity", value: "72%" },
      { label: "Wind Speed", value: "13 km/h" },
      { label: "Forecast Days", value: 7 },
    ],
  },
  {
    title: "Todo App",
    stats: [
      { label: "Tasks Today", value: 7 },
      { label: "Completed", value: 4 },
      { label: "Overdue", value: 1 },
      { label: "Upcoming Tasks", value: 5 },
      { label: "Priority Tasks", value: 2 },
    ],
  },
];
