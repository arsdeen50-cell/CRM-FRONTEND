import TaskCard from "./TaskCard";

const TaskGrid = ({ tasks, onEdit, onDelete, isAdmin }) => {
    if (tasks.length === 0) {
        return null; // Handled in parent component
    }

    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tasks.map((task) => (
                <TaskCard
                    key={task._id}
                    task={task}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    isAdmin={isAdmin}
                />
            ))}
        </div>
    );
};

export default TaskGrid;