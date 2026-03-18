import { format, isValid } from "date-fns";


// date formatting utility functions
export const formatDateSafe = (date, dateFormat) => {
    if (!date) return "N/A";
    const dateObj = new Date(date);
    return isValid(dateObj) ? format(dateObj, dateFormat) : "Invalid Date";
};

export function calculateDuration(punchIn, punchOut) {
  if (!punchIn || !punchOut) return "N/A";

  const inTime = new Date(punchIn);
  const outTime = new Date(punchOut);
  const diffMs = outTime - inTime;

  if (isNaN(diffMs) || diffMs < 0) return "N/A";

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}


export const getLightBorder = (status) => {
  switch (status) {
    case "Pending":
      return "border-l-yellow-500";
    case "In Progress":
      return "border-l-orange-500";
    case "Completed":
      return "border-l-green-600";
    default:
      return "";
  }
};

 export const getDarkBorder = (status) => {
  switch (status) {
    case "Pending":
      return "dark:border-l-yellow-500";
    case "In Progress":
      return "dark:border-l-orange-500";
    case "Completed":
      return "dark:border-l-green-600";
    default:
      return "";
  }
};

 export const getBadgeBg = (status) => {
  switch (status) {
    case "Pending":
      return "bg-yellow-500";
    case "In Progress":
      return "bg-orange-500";
    case "Completed":
      return "bg-green-600";
    default:
      return "";
  }
};

export const taskData = [
  {
    id: 1,
    title: "Design",
    description: "Lorem ipsum dolor sit amet consectetur, adipisicing elit. Voluptatibus, sequi?",
    startDate: "20 MAY 2025",
    endDate: "20 MAY 2025",
    status: "Pending",
  },
  {
    id: 2,
    title: "Development",
    description: "Implement the backend APIs",
    startDate: "21 MAY 2025",
    endDate: "25 MAY 2025",
    status: "In Progress",
  },
  {
    id: 3,
    title: "Testing",
    description: "Perform final QA checks",
    startDate: "26 MAY 2025",
    endDate: "28 MAY 2025",
    status: "Completed",
  },


   {
    id: 1,
    title: "Design",
    description: "Lorem ipsum dolor sit amet consectetur, adipisicing elit. Voluptatibus, sequi?",
    startDate: "20 MAY 2025",
    endDate: "20 MAY 2025",
    status: "Pending",
  },
  {
    id: 2,
    title: "Development",
    description: "Implement the backend APIs",
    startDate: "21 MAY 2025",
    endDate: "25 MAY 2025",
    status: "In Progress",
  },
  {
    id: 3,
    title: "Testing",
    description: "Perform final QA checks",
    startDate: "26 MAY 2025",
    endDate: "28 MAY 2025",
    status: "Completed",
  },
];