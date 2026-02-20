import type { Project } from "@/lib/types";

export const projects: Project[] = [
  {
    key: "flight-tracker",
    title: "Flight Tracker",
    subtitle: "Live flight statistics",
    route: "/flight-tracker-preview",
    stats: [
      { label: "Current Flights", value: 123 },
      { label: "Highest Altitude", value: "12,000 m" },
      { label: "Average Delay", value: "5 min" },
      { label: "On Time %", value: "97%" },
      { label: "Tracked Airports", value: 15 },
    ],
  },
  {
    key: "weather-app",
    title: "Weather App",
    subtitle: "Live weather",
    route: "/weather-app",
    stats: [
      { label: "Location", value: "Stockholm" },
      { label: "Temperature", value: "-4°C" },
      { label: "Humidity", value: "72%" },
      { label: "Wind Speed", value: "13 km/h" },
      { label: "Forecast Days", value: 7 },
    ],
  },
  {
    key: "todo-app",
    title: "Todo App",
    subtitle: "Keep track",
    route: "/todo-app",
    stats: [
      { label: "Tasks Today", value: 7 },
      { label: "Completed", value: 4 },
      { label: "Overdue", value: 1 },
      { label: "Upcoming Tasks", value: 5 },
      { label: "Priority Tasks", value: 2 },
    ],
  },
];

export function getProject(key: Project["key"]) {
  return projects.find((p) => p.key === key);
}
