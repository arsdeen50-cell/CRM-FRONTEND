// components/EmployeeAttendanceCards.jsx
import { Clock, CheckCircle, XCircle, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSelector } from "react-redux";
import useAttendance from "@/hooks/useAttendance";
import useGetAttendance from "@/hooks/useGetAttendance";
import { formatDateSafe, calculateDuration } from "@/utils/data";

const EmployeeAttendanceCards = () => {
    const { todayAttendance } = useSelector((state) => state.attendance);
    const { user } = useSelector((state) => state.auth);
    const { refetch } = useGetAttendance();
    const { 
        punchIn, 
        punchOut, 
        loading: attendanceActionLoading 
    } = useAttendance();

    
    const safeTodayAttendance = todayAttendance || {};
    
    // Calculate today's working hours if punched out
    const todayHours = safeTodayAttendance.punchOut && safeTodayAttendance.punchIn
        ? calculateDuration(safeTodayAttendance.punchIn, safeTodayAttendance.punchOut)
        : "0h 0m";

    // Handle punch actions
    const handlePunchIn = async () => {
        await punchIn();
        await refetch();
    };

    const handlePunchOut = async () => {
        await punchOut();
        await refetch();
    };

    if (user?.role === 'admin') return null;

    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Today's Status Card */}
            <div className="card">
                <div className="card-header">
                    <div className="w-fit rounded-lg bg-blue-500/20 p-2 text-blue-500 transition-colors dark:bg-blue-600/20 dark:text-blue-600">
                        <Clock size={26} />
                    </div>
                    <p className="card-title">Today's Status</p>
                </div>
                <div className="card-body bg-slate-100 transition-colors dark:bg-slate-950">
                    <p className="text-3xl font-bold text-slate-900 transition-colors dark:text-slate-50">
                        {safeTodayAttendance.punchIn ? 
                            (safeTodayAttendance.punchOut ? "Completed" : "Active") : 
                            "Not Started"}
                    </p>
                    <span className="flex w-fit items-center gap-x-2 rounded-full border border-blue-500 px-2 py-1 font-medium text-blue-500 dark:border-blue-600 dark:text-blue-600 mt-2">
                        <TrendingUp size={18} />
                        {todayHours}
                    </span>
                </div>
            </div>

            {/* Punch Action Card */}
            <div className="card">
                <div className="card-header">
                    <div className={`w-fit rounded-lg p-2 transition-colors ${
                        !todayAttendance ? 'bg-green-500/20 text-green-500 dark:bg-green-600/20 dark:text-green-600' :
                        todayAttendance.punchOut ? 'bg-purple-500/20 text-purple-500 dark:bg-purple-600/20 dark:text-purple-600' :
                        'bg-red-500/20 text-red-500 dark:bg-red-600/20 dark:text-red-600'
                    }`}>
                        {!todayAttendance ? (
                            <CheckCircle size={26} />
                        ) : todayAttendance.punchOut ? (
                            <CheckCircle size={26} />
                        ) : (
                            <XCircle size={26} />
                        )}
                    </div>
                    <p className="card-title">Attendance Action</p>
                </div>
                <div className="card-body bg-slate-100 transition-colors dark:bg-slate-950">
                    {!todayAttendance ? (
                        <>
                            <Button 
                                onClick={handlePunchIn} 
                                disabled={attendanceActionLoading}
                                className="w-full bg-green-600 hover:bg-green-700"
                            >
                                Punch In
                            </Button>
                            <p className="text-sm text-center mt-2 text-muted-foreground">
                                Start your work day
                            </p>
                        </>
                    ) : !todayAttendance.punchOut ? (
                        <>
                            <Button 
                                onClick={handlePunchOut} 
                                disabled={attendanceActionLoading}
                                className="w-full bg-red-600 hover:bg-red-700"
                            >
                                Punch Out
                            </Button>
                            <p className="text-sm text-center mt-2 text-muted-foreground">
                                Working since {formatDateSafe(todayAttendance.punchIn)}
                            </p>
                        </>
                    ) : (
                        <>
                            <p className="text-lg text-center font-medium">
                                You've completed today's work
                            </p>
                            <p className="text-sm text-center mt-1 text-muted-foreground">
                                {formatDateSafe(todayAttendance.punchIn)} - {formatDateSafe(todayAttendance.punchOut)}
                            </p>
                        </>
                    )}
                </div>
            </div>

            {/* Today's Summary Card */}
            <div className="card">
                <div className="card-header">
                    <div className="w-fit rounded-lg bg-amber-500/20 p-2 text-amber-500 transition-colors dark:bg-amber-600/20 dark:text-amber-600">
                        <TrendingUp size={26} />
                    </div>
                    <p className="card-title">Today's Summary</p>
                </div>
                <div className="card-body bg-slate-100 transition-colors dark:bg-slate-950">
                    {todayAttendance ? (
                        <>
                            <p className="text-3xl font-bold text-slate-900 transition-colors dark:text-slate-50">
                                {todayHours}
                            </p>
                            <div className="mt-2 text-sm space-y-1">
                                <p>In: {formatDateSafe(todayAttendance.punchIn)}</p>
                                <p>Out: {todayAttendance.punchOut ? 
                                    formatDateSafe(todayAttendance.punchOut) : 
                                    "Not punched out yet"}</p>
                            </div>
                        </>
                    ) : (
                        <p className="text-lg font-medium text-center py-4">
                            No attendance recorded today
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EmployeeAttendanceCards;