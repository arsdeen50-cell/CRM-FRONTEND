import { Button } from "@/components/ui/button";
import { PencilLine, UserCheck, X, Search, Filter, Download } from "lucide-react";
import React, { useEffect, useState } from "react";
import CreateTaskDialog from "./CreateTaskDialog";
import TaskGrid from "@/components/TaskGrid";
import EditTaskSheet from "@/components/EditTaskSheet";
import useTask from "@/hooks/useTask";
import { useSelector } from "react-redux";
import DatePickerField from "@/components/DatePickerField";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const AssignTask = ({ statusFilter }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedStatus, setSelectedStatus] = useState(statusFilter || "all");
  
  const { tasks } = useSelector((state) => state.task);
  const { user } = useSelector((state) => state.auth);
  const {
    fetchTasks,
    getAdminTasks,
    createTask,
    updateTask,
    deleteTask,
    updateAdminTask,
    getAllUsers,
  } = useTask();

  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [statusOptions] = useState([
    { value: "all", label: "All Statuses" },
    { value: "Pending", label: "Pending" },
    { value: "In Progress", label: "In Progress" },
    { value: "Completed", label: "Completed" },
  ]);

  useEffect(() => {
    loadData();
    if (user.role === "admin") {
      loadUsers();
    }
  }, []);

  // Load data based on user role
  const loadData = async () => {
    try {
      console.log("Loading data for user role:", user.role);
      if (user.role === "admin") {
        // For admin dashboard, use getAdminTasks which shows ALL tasks
        await getAdminTasks();
      } else {
        // For regular users, use fetchTasks which shows their own tasks + assigned tasks
        await fetchTasks();
      }
    } catch (error) {
      console.error("Error loading tasks:", error);
      toast.error("Failed to load tasks");
    }
  };

  const loadUsers = async () => {
    try {
      const allUsers = await getAllUsers();
      console.log("Loaded users:", allUsers);
      setUsers(allUsers);
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Failed to load users");
    }
  };

  const handleEdit = (task) => {
    setCurrentTask(task);
    setIsSheetOpen(true);
  };

  const handleSaveTask = async (id, data) => {
    if (!id) {
      toast.error("Task ID missing!");
      return;
    }

    const success =
      user.role === "admin"
        ? await updateAdminTask(id, data)
        : await updateTask(id, data);

    if (success) {
      toast.success("Task updated successfully!");
      loadData(); // Reload data
      setIsSheetOpen(false);
    }
  };

  const handleDelete = async (taskId) => {
    if (!taskId) {
      toast.error("Failed to delete task - ID is missing");
      return;
    }
    
    const success = await deleteTask(taskId);
    if (!success) {
      toast.error("Failed to delete task");
    } else {
      loadData(); // Reload data
    }
  };

  const handleCreate = async (taskData) => {
    const success = await createTask(taskData);
    if (success) {
      setIsDialogOpen(false);
      loadData(); // Reload data
    }
  };

  // Function to normalize status for comparison
  const normalize = (str) => str?.toLowerCase().replace(/\s+/g, "-");

  // Main filtering function
  const filteredTasks = tasks.filter((task) => {
    // Filter by status
    if (selectedStatus !== "all") {
      const normalizedTaskStatus = normalize(task.status);
      const normalizedSelectedStatus = normalize(selectedStatus);
      if (normalizedTaskStatus !== normalizedSelectedStatus) return false;
    }

    // Filter by date range (from date and to date)
    const taskStartDate = new Date(task.startDate);
    const taskEndDate = new Date(task.endDate);
    
    if (fromDate) {
      const fromDateObj = new Date(fromDate);
      fromDateObj.setHours(0, 0, 0, 0); // Start of the day
      if (taskStartDate < fromDateObj) return false;
    }
    
    if (toDate) {
      const toDateObj = new Date(toDate);
      toDateObj.setHours(23, 59, 59, 999); // End of the day
      if (taskEndDate > toDateObj) return false;
    }

    // Filter by search query (title, description)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = task.title?.toLowerCase().includes(query);
      const matchesDescription = task.description?.toLowerCase().includes(query);
      if (!matchesTitle && !matchesDescription) return false;
    }

    // Filter by assigned user OR created by (for admin)
    if (user.role === "admin" && selectedUser !== "all") {
      // Check if assigned to the selected user
      const isAssignedToUser = task.assignedTo?.some(
        assignment => {
          // Check both user object and user ID string formats
          const assignedUserId = assignment.user?._id || assignment.user;
          return assignedUserId === selectedUser;
        }
      );
      
      // Check if created by the selected user
      const isCreatedByUser = task.createdBy?._id === selectedUser || 
                             task.createdBy === selectedUser;
      
      // Return true if either condition is met
      if (!isAssignedToUser && !isCreatedByUser) return false;
    }

    return true;
  });

  // Export functionality
  const exportToCSV = () => {
    try {
      // Determine which data to export (filtered or all)
      const dataToExport = filteredTasks.length > 0 ? filteredTasks : tasks;
      
      if (dataToExport.length === 0) {
        toast.error("No data to export");
        return;
      }

      // Define CSV headers
      const headers = [
        "Task ID",
        "Title",
        "Description",
        "Status",
        "Start Date",
        "End Date",
        "Created At",
        "Created By",
        "Assigned To",
      ];

      // Prepare CSV content
      const csvRows = [];
      
      // Add headers
      csvRows.push(headers.join(","));
      
      // Add data rows
      dataToExport.forEach(task => {
        // Get assigned users names
        const assignedUsers = task.assignedTo?.map(assignment => {
          if (typeof assignment.user === 'object') {
            return assignment.user.fullname || assignment.user.email;
          }
          return "Unknown User";
        }).join("; ") || "Not Assigned";

        // Get created by user name
        const createdBy = typeof task.createdBy === 'object' 
          ? (task.createdBy.fullname || task.createdBy.email || "Unknown")
          : "Unknown";

        const row = [
          `"${task._id || ""}"`,
          `"${task.title || ""}"`,
          `"${task.description?.replace(/"/g, '""') || ""}"`,
          `"${task.status || ""}"`,
          `"${task.startDate ? new Date(task.startDate).toLocaleDateString() : ""}"`,
          `"${task.endDate ? new Date(task.endDate).toLocaleDateString() : ""}"`,
          `"${task.createdAt ? new Date(task.createdAt).toLocaleDateString() : ""}"`,
          `"${createdBy}"`,
          `"${assignedUsers}"`,
        ];
        
        csvRows.push(row.join(","));
      });

      // Create CSV file
      const csvString = csvRows.join("\n");
      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement("a");
      link.href = url;
      
      // Create filename with timestamp and filter info
      const timestamp = new Date().toISOString().split('T')[0];
      let filename = `tasks_export_${timestamp}`;
      
      // Add filter info to filename if filters are active
      if (filteredTasks.length > 0 && filteredTasks.length !== tasks.length) {
        filename += "_filtered";
      }
      if (selectedStatus !== "all") {
        filename += `_${selectedStatus}`;
      }
      if (selectedUser !== "all") {
        const user = users.find(u => u._id === selectedUser);
        if (user) {
          filename += `_${user.fullname || user.email}`;
        }
      }
      
      filename += ".csv";
      link.download = filename;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Exported ${dataToExport.length} task(s) to CSV`);
      
    } catch (error) {
      console.error("Error exporting to CSV:", error);
      toast.error("Failed to export data");
    }
  };

  const exportToJSON = () => {
    try {
      // Determine which data to export (filtered or all)
      const dataToExport = filteredTasks.length > 0 ? filteredTasks : tasks;
      
      if (dataToExport.length === 0) {
        toast.error("No data to export");
        return;
      }

      // Create JSON string
      const jsonString = JSON.stringify(dataToExport, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement("a");
      link.href = url;
      
      // Create filename with timestamp and filter info
      const timestamp = new Date().toISOString().split('T')[0];
      let filename = `tasks_export_${timestamp}`;
      
      // Add filter info to filename if filters are active
      if (filteredTasks.length > 0 && filteredTasks.length !== tasks.length) {
        filename += "_filtered";
      }
      
      filename += ".json";
      link.download = filename;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Exported ${dataToExport.length} task(s) to JSON`);
      
    } catch (error) {
      console.error("Error exporting to JSON:", error);
      toast.error("Failed to export data");
    }
  };

  // Check if any filter is active
  const isAnyFilterActive = () => {
    return searchQuery || selectedUser !== "all" || fromDate || toDate || selectedStatus !== "all";
  };

  // Get the export button label
  const getExportLabel = () => {
    const count = filteredTasks.length > 0 ? filteredTasks.length : tasks.length;
    return `Export (${count})`;
  };

  // Group tasks by createdAt date, sorted by latest first
  const groupTasksByCreatedAt = (tasksArray) => {
    return Object.entries(
      tasksArray.reduce((acc, task) => {
        // Use createdAt for grouping
        const dateKey = new Date(task.createdAt).toDateString();
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(task);
        return acc;
      }, {})
    )
    // Sort groups by latest date first
    .sort(([dateA], [dateB]) => new Date(dateB) - new Date(dateA))
    // Sort tasks within each group by createdAt (latest first)
    .map(([date, tasksInGroup]) => [
      date, 
      tasksInGroup.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    ]);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedUser("all");
    setFromDate("");
    setToDate("");
    setSelectedStatus("all");
  };

  console.log("Current user role:", user.role);
  console.log("Total tasks:", tasks.length);
  console.log("Filtered tasks:", filteredTasks.length);

  return (
    <div className="w-full">
      <div className="flex flex-col gap-5">
        {/* Header with Create/Assign Button and Export */}
        <div className="flex items-center justify-between">
          {user.role === "admin" ? (
            <div className="flex items-center gap-4">
              <Button
                variant="destructive"
                onClick={() => navigate("/adminassign")}
              >
                <UserCheck className="h-4 w-4" />
                Assign Task
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Button
                variant="destructive"
                onClick={() => setIsDialogOpen(true)}
              >
                <PencilLine className="h-4 w-4" />
                Create Task
              </Button>
            </div>
          )}

          {/* Export Button - Only for admin */}
          {user.role === "admin" && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  {getExportLabel()}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={exportToCSV}>
                  Export as CSV
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({filteredTasks.length > 0 ? filteredTasks.length : tasks.length} items)
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportToJSON}>
                  Export as JSON
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({filteredTasks.length > 0 ? filteredTasks.length : tasks.length} items)
                  </span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Filter Section */}
        <div className="mb-6 rounded-lg border bg-card p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Filters</h3>
          </div>
          
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Search Input */}
            <div>
              <Label htmlFor="search">Search Tasks</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search title or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={selectedStatus}
                onValueChange={setSelectedStatus}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* User Filter (Admin only) */}
            {user.role === "admin" && users.length > 0 && (
              <div>
                <Label htmlFor="user">Created By / Assigned To</Label>
                <Select
                  value={selectedUser}
                  onValueChange={setSelectedUser}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user._id} value={user._id}>
                        {user.fullname || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Date Range Filters */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="fromDate">From Date</Label>
                <Input
                  id="fromDate"
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="toDate">To Date</Label>
                <Input
                  id="toDate"
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  min={fromDate}
                />
              </div>
            </div>
          </div>

          {/* Active Filters Indicator and Reset Button */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''} found
              {isAnyFilterActive() && " (with filters applied)"}
              {user.role === "admin" && (
                <span className="ml-2">
                  • Export will include {filteredTasks.length > 0 ? filteredTasks.length : tasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                disabled={!isAnyFilterActive()}
              >
                <X className="mr-2 h-4 w-4" />
                Reset Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Tasks Display */}
        {filteredTasks.length === 0 ? (
          <div className="mt-10 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">No tasks found</h3>
            <p className="text-sm text-muted-foreground">
              {isAnyFilterActive()
                ? "Try adjusting your filters or search criteria"
                : "Create your first task to get started"}
            </p>
            {isAnyFilterActive() && (
              <Button
                variant="link"
                onClick={handleResetFilters}
                className="mt-2"
              >
                Clear all filters
              </Button>
            )}
          </div>
        ) : user.role === "admin" ? (
          // Admin View - Grouped by Created At Date
          <div className="space-y-8">
            {groupTasksByCreatedAt(filteredTasks).map(([date, tasksOnDate]) => (
              <div key={date} className="space-y-4">
                <div className="border-b pb-2">
                  <h2 className="text-xl font-semibold">
                    Created on: {new Date(date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {tasksOnDate.length} task{tasksOnDate.length !== 1 ? 's' : ''} created
                  </p>
                </div>
                <TaskGrid
                  tasks={tasksOnDate}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  isAdmin={true}
                />
              </div>
            ))}
          </div>
        ) : (
          // Regular User View - Sorted by createdAt (latest first)
          <TaskGrid
            tasks={filteredTasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))}
            onEdit={handleEdit}
            onDelete={handleDelete}
            isAdmin={false}
          />
        )}

        {/* Dialogs */}
        <CreateTaskDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onCreate={handleCreate}
        />

        <EditTaskSheet
          task={currentTask}
          open={isSheetOpen}
          onOpenChange={setIsSheetOpen}
          onSave={(data) => handleSaveTask(currentTask?._id, data)}
          isAdmin={user.role === "admin"}
          users={users}
        />
      </div>
    </div>
  );
};

export default AssignTask;