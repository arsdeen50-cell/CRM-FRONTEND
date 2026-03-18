import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TaskTabs = ({ value, onChange, counts = {} }) => {
  const getCount = (key) => {
    if (key === "all") return counts.total || 0;

    const mapping = {
      pending: "Pending",
      "in-progress": "In Progress",
      completed: "Completed",
    };

    return counts[mapping[key]] || 0;
  };

  return (
    <div>
      <Tabs value={value} onValueChange={onChange} className="w-full">
        <TabsList className="mb-8 grid grid-cols-2 gap-2 sm:flex sm:justify-start lg:mb-0">
          {["all", "pending", "in-progress", "completed"].map((status) => (
            <TabsTrigger key={status} value={status}>
              <div className="flex items-center gap-2 capitalize">
                {status.replace("-", " ")}
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-xs text-white">
                  {getCount(status)}
                </span>
              </div>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
};


export default TaskTabs;

