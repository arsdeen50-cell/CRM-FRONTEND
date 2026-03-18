import { Badge } from "@/components/ui/badge";
import { PencilLine, Trash, Calendar, User, Clock } from "lucide-react";
import { formatDateSafe, getBadgeBg, getDarkBorder, getLightBorder } from "@/utils/data";
import { useSelector } from "react-redux";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card";
import { Separator } from "./ui/separator";

const TaskCard = ({ task, onEdit, onDelete, isAdmin }) => {
    const { id: userId, user } = useSelector((state) => state.auth);
    const lightBorder = getLightBorder(task.status);
    const darkBorder = getDarkBorder(task.status);
    const badgeColor = getBadgeBg(task.status);

    // Calculate if task is overdue
    const isOverdue = task.status !== "Completed" && 
                     new Date(task.endDate) < new Date();

    return (
        <Card className={`overflow-hidden border-l-4 ${lightBorder} dark:border-l-4 ${darkBorder} hover:shadow-md transition-shadow`}>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Badge className={`${badgeColor} font-medium`}>
                                {task.status}
                            </Badge>
                            {isOverdue && (
                                <Badge variant="destructive" className="animate-pulse">
                                    Overdue
                                </Badge>
                            )}
                        </div>
                        <h3 className="text-lg font-semibold leading-tight">
                            {task.title}
                        </h3>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => onEdit?.(task)}
                            className="rounded-md p-2 hover:bg-muted"
                            title="Edit task"
                        >
                            <PencilLine className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => onDelete?.(task._id)}
                            className="rounded-md p-2 hover:bg-destructive/10 hover:text-destructive"
                            title="Delete task"
                        >
                            <Trash className="h-4 w-4" />
                        </button>
                    </div>
                </div>
                
                {/* Show created by info for ALL tasks (not just for admin) */}
                {task.createdBy && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-3 w-3" />
                        Created by: {task.createdBy.fullname || task.createdBy.email || "Unknown"}
                    </div>
                )}
            </CardHeader>
            
            <Separator />
            
            <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground line-clamp-3">
                    {task.description}
                </p>
                
                {/* Assigned Users Section - Show for admin or if user is assigned */}
                {(isAdmin || task.assignedTo?.some(a => a.user?._id === userId || a.user === userId)) && 
                 task.assignedTo?.length > 0 && (
                    <div className="mt-4">
                        <div className="mb-2 flex items-center gap-1 text-sm font-medium">
                            <User className="h-3 w-3" />
                            Assigned To:
                        </div>
                        <div className="space-y-2">
                            {task.assignedTo.map((assignment) => (
                                <div key={assignment._id || assignment.user?._id} 
                                     className="flex items-center justify-between rounded-md bg-muted/50 p-2">
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-6 w-6">
                                            <AvatarImage src={assignment.user?.profile?.profilePhoto} />
                                            <AvatarFallback className="text-xs">
                                                {assignment.user?.fullname?.charAt(0).toUpperCase() || 
                                                 assignment.user?.email?.charAt(0).toUpperCase() || 
                                                 "U"}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm">
                                            {assignment.user?.fullname || assignment.user?.email || "Unknown User"}
                                        </span>
                                    </div>
                                    <Badge variant="outline" className="text-xs">
                                        {assignment.status}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
            
            <Separator />
            
            <CardFooter className="flex justify-between pt-4 text-sm">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground">Start</span>
                            <span className="font-medium">{formatDateSafe(task.startDate, "MMM dd, yyyy")}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground">End</span>
                            <span className={`font-medium ${isOverdue ? 'text-destructive' : ''}`}>
                                {formatDateSafe(task.endDate, "MMM dd, yyyy")}
                            </span>
                        </div>
                    </div>
                </div>
                
                {task.priority && (
                    <Badge variant="outline" className={
                        task.priority === 'High' ? 'border-red-200 bg-red-50 text-red-700' :
                        task.priority === 'Medium' ? 'border-yellow-200 bg-yellow-50 text-yellow-700' :
                        'border-green-200 bg-green-50 text-green-700'
                    }>
                        {task.priority} Priority
                    </Badge>
                )}
            </CardFooter>
        </Card>
    );
};

export default TaskCard;