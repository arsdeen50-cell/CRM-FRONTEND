import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    tasks: [],
    loading: false,
    error: null,
    statusCounts: {
        Pending: 0,
        "In Progress": 0,
        Completed: 0,
        total: 0
    },
};

const taskSlice = createSlice({
    name: "task",
    initialState,
    reducers: {
        fetchTasksStart(state) {
            state.loading = true;
            state.error = null;
        },
        fetchTasksSuccess(state, action) {
            state.tasks = action.payload.tasks;
            state.statusCounts = {
                Pending: action.payload.count?.Pending || 0,
                "In Progress": action.payload.count?.["In Progress"] || 0,
                Completed: action.payload.count?.Completed || 0,
                total: action.payload.count?.total || 0
            };
            state.loading = false;
        },
        fetchTasksFailure(state, action) {
            state.loading = false;
            state.error = action.payload;
        },
        createTaskStart(state) {
            state.loading = true;
            state.error = null;
        },
        createTaskSuccess(state, action) {
            state.loading = false;
            state.tasks.unshift(action.payload);
            // Update counts for the new task's status
            const status = action.payload.status;
            state.statusCounts = {
                ...state.statusCounts,
                [status]: (state.statusCounts[status] || 0) + 1,
                total: (state.statusCounts.total || 0) + 1
            };
        },
        createTaskFailure(state, action) {
            state.loading = false;
            state.error = action.payload;
        },
        updateTaskStart(state) {
            state.loading = true;
            state.error = null;
        },
        updateTaskSuccess(state, action) {
            state.loading = false;
            const updatedTask = action.payload;
            const oldTaskIndex = state.tasks.findIndex(task => task._id === updatedTask._id);
            
            if (oldTaskIndex !== -1) {
                const oldStatus = state.tasks[oldTaskIndex].status;
                const newStatus = updatedTask.status;
                
                // Update counts if status changed
                if (oldStatus !== newStatus) {
                    state.statusCounts = {
                        ...state.statusCounts,
                        [oldStatus]: Math.max((state.statusCounts[oldStatus] || 0) - 1, 0),
                        [newStatus]: (state.statusCounts[newStatus] || 0) + 1
                    };
                }
                
                state.tasks[oldTaskIndex] = updatedTask;
            }
        },
        updateTaskFailure(state, action) {
            state.loading = false;
            state.error = action.payload;
        },
        deleteTaskStart(state) {
            state.loading = true;
            state.error = null;
        },
        deleteTaskSuccess(state, action) {
            state.loading = false;
            const deletedTaskId = action.payload;
            const deletedTask = state.tasks.find(task => task._id === deletedTaskId);
            
            if (deletedTask) {
                state.tasks = state.tasks.filter(task => task._id !== deletedTaskId);
                // Update counts for the deleted task's status
                const status = deletedTask.status;
                state.statusCounts = {
                    ...state.statusCounts,
                    [status]: Math.max((state.statusCounts[status] || 0) - 1, 0),
                    total: Math.max((state.statusCounts.total || 0) - 1, 0)
                };
            }
        },
        deleteTaskFailure(state, action) {
            state.loading = false;
            state.error = action.payload;
        },
    },
});

export const {
    fetchTasksStart,
    fetchTasksSuccess,
    fetchTasksFailure,
    createTaskStart,
    createTaskSuccess,
    createTaskFailure,
    updateTaskStart,
    updateTaskSuccess,
    updateTaskFailure,
    deleteTaskStart,
    deleteTaskSuccess,
    deleteTaskFailure,
} = taskSlice.actions;

export default taskSlice.reducer;