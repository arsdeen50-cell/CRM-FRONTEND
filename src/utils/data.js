import { format, isValid } from "date-fns";


// date formatting utility functions
export const formatDateSafe = (date, dateFormat) => {
    if (!date) return "N/A";
    const dateObj = new Date(date);
    return isValid(dateObj) ? format(dateObj, dateFormat) : "Invalid Date";
};

export const calculateDuration = (start, end) => {
  if (!start) return "N/A";

  const startDate = new Date(start);
  const endDate = end ? new Date(end) : new Date();

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return "N/A";
  }

  const diffMs = endDate - startDate;

  const totalSeconds = Math.floor(diffMs / 1000);

  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  return `${hrs}h ${mins}m ${secs}s`;
};


export const calculateWorkDuration = (record) => {
  if (!record.punchIn) return "0h 0m 0s";

  const start = new Date(record.punchIn);
  const end = record.punchOut ? new Date(record.punchOut) : new Date();

  const totalSeconds = Math.floor((end - start) / 1000);

  // Calculate break time including current break if any
  let breakSeconds = 0;

  record.breaks?.forEach((b) => {
    if (b.breakStart) {
      const breakStart = new Date(b.breakStart);
      const breakEnd = b.breakEnd ? new Date(b.breakEnd) : new Date();
      breakSeconds += (breakEnd - breakStart) / 1000;
    }
  });

  const workSeconds = Math.max(0, totalSeconds - breakSeconds);

  const hrs = Math.floor(workSeconds / 3600);
  const mins = Math.floor((workSeconds % 3600) / 60);
  const secs = Math.floor(workSeconds % 60);

  return `${hrs}h ${mins}m ${secs}s`;
};

export const calculateBreakTime = (breaks = []) => {
  let totalSeconds = 0;

  breaks.forEach((b) => {
    if (b.breakStart) {
      const start = new Date(b.breakStart);
      const end = b.breakEnd ? new Date(b.breakEnd) : new Date(); // ✅ LIVE BREAK

      totalSeconds += (end - start) / 1000;
    }
  });

  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = Math.floor(totalSeconds % 60);

  return `${hrs}h ${mins}m ${secs}s`;
};

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