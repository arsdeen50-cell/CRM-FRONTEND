import React, { useState } from "react";
import TaskTabs from "./TaskTabs";
import AssignTask from "../pages/AssignTask";
import { useSelector } from "react-redux";

const Task = () => {
     const [statusFilter, setStatusFilter] = useState("all");
      const { statusCounts, totalCount } = useSelector((state) => state.task);
      
    return (
        <div className="py-8">
            <div className="card">
                <div className="card-body flex lg:flex-row lg:justify-between">
                    <h1 className="text-2xl font-semibold">All Tasks</h1>
                    <div className="">
                        <TaskTabs value={statusFilter} onChange={setStatusFilter} counts={statusCounts} />
                    </div>
                </div>
                <div className="flex w-full justify-start bg-slate-100 p-4 transition-colors dark:bg-slate-950">
                    <AssignTask statusFilter={statusFilter} />
                </div>
            </div>
        </div>
    );
};

export default Task;
