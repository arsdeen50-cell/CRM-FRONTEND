import { useTheme } from "@/hooks/use-theme";
import { Footer } from "@/layouts/footer";
import AttendanceTable from "./AttendanceTable ";
import useGetAllAttendance from "@/hooks/useGetAllAttendance";
import useGetAttendance from "@/hooks/useGetAttendance";
import { useSelector } from "react-redux";
import EmployeeAttendanceTable from "./EmployeeAttendanceTable";
import {
    Clock,
    CheckCircle,
    XCircle,
    TrendingUp,
    User,
    Calendar,
    BarChart3,
    Activity,
    Target,
    Zap,
    ArrowUpRight,
    ArrowDownRight,
    Users,
    Clock4,
    Award,
    Star,
    TrendingDown,
    Eye,
    Plus,
    Minus,
    AlertCircle,
    CheckCircle2,
    Timer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import useAttendance from "@/hooks/useAttendance";
import { formatDateSafe, calculateDuration } from "@/utils/data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    AreaChart,
    Area,
} from "recharts";
import { useState, useEffect } from "react";

const DashboardPage = () => {
    const { theme } = useTheme();
    const { allAttendance, loading: allLoading, error: allError, todayAttendance } = useSelector((state) => state.attendance);
    const { user } = useSelector((state) => state.auth);
    const { data: userAttendance, loading: userLoading, error: userError, refetch } = useGetAttendance();
    const { punchIn, punchOut, loading: attendanceActionLoading, startBreak, endBreak } = useAttendance();
    
    const [workSeconds, setWorkSeconds] = useState(0);
    const [breakSeconds, setBreakSeconds] = useState(0);
    const [isWorking, setIsWorking] = useState(false);
    const [isBreak, setIsBreak] = useState(false);
    const [lastUpdateTime, setLastUpdateTime] = useState(null);

    useGetAllAttendance();

   useEffect(() => {
    let interval;

    if (isWorking) {
        interval = setInterval(() => {
            setWorkSeconds(prev => prev + 1);
        }, 1000);
    }

    if (isBreak) {
        interval = setInterval(() => {
            setBreakSeconds(prev => prev + 1);
        }, 1000);
    }

    return () => {
        if (interval) clearInterval(interval);
    };
}, [isWorking, isBreak]);

    // Load initial timer data from today's attendance
    useEffect(() => {
        if (todayAttendance && todayAttendance.punchIn && !todayAttendance.punchOut) {
            const punchInTime = new Date(todayAttendance.punchIn).getTime();
            const now = new Date().getTime();
            let totalBreakSeconds = 0;
            
            // Calculate total break time so far from completed breaks
            if (todayAttendance.breaks && todayAttendance.breaks.length > 0) {
                todayAttendance.breaks.forEach(break_ => {
                    if (break_.breakStart) {
                        const breakEnd = break_.breakEnd ? new Date(break_.breakEnd).getTime() : null;
                        if (breakEnd) {
                            // Completed break
                            totalBreakSeconds += (breakEnd - new Date(break_.breakStart).getTime()) / 1000;
                        }
                    }
                });
            }
            
            // Check if currently on break
            const lastBreak = todayAttendance.breaks?.[todayAttendance.breaks.length - 1];
            const isCurrentlyOnBreak = lastBreak && lastBreak.breakStart && !lastBreak.breakEnd;
            
            if (isCurrentlyOnBreak) {
                // If on break, calculate break time including current break
                const currentBreakStart = new Date(lastBreak.breakStart).getTime();
                const currentBreakDuration = (now - currentBreakStart) / 1000;
                totalBreakSeconds += currentBreakDuration;
                
                setBreakSeconds(totalBreakSeconds);
                setWorkSeconds(0); // Work timer doesn't run during break
                setIsWorking(false);
                setIsBreak(true);
            } else {
                // If working, calculate work time minus total breaks
                const totalWorkSeconds = (now - punchInTime) / 1000;
                const netWorkSeconds = Math.max(0, totalWorkSeconds - totalBreakSeconds);
                
                setWorkSeconds(netWorkSeconds);
                setBreakSeconds(totalBreakSeconds);
                setIsWorking(true);
                setIsBreak(false);
            }
        } else {
            // Reset when no active session
            setIsWorking(false);
            setIsBreak(false);
            setWorkSeconds(0);
            setBreakSeconds(0);
        }
        setLastUpdateTime(Date.now());
    }, [todayAttendance]);

    // Process attendance data
    const attendanceRecords = Array.isArray(allAttendance) ? allAttendance : allAttendance?.attendance || [];
    const userAttendanceRecords = Array.isArray(userAttendance) ? userAttendance : userAttendance?.attendance || [];

    // Handle punch actions
  const handlePunchIn = async () => {
        const result = await punchIn();
        if (result?.success) {
            await refetch();
            setIsWorking(true);
            setIsBreak(false);
            setWorkSeconds(0);
            setBreakSeconds(0);
            setLastUpdateTime(Date.now());
            window.location.assign(window.location.href);
        }
    };

  const handleBreakToggle = async () => {
        if (!isBreak) {
            // Start break - save current work time and switch to break
            const result = await startBreak();
            if (result?.success) {
                setIsWorking(false);
                setIsBreak(true);
                setLastUpdateTime(Date.now());
                await refetch();
                window.location.assign(window.location.href);
            }
        } else {
            // End break - resume work from where it left off
            const result = await endBreak();
            if (result?.success) {
                setIsBreak(false);
                setIsWorking(true);
                setLastUpdateTime(Date.now());
                await refetch();
               window.location.assign(window.location.href);
            }
        }
    };


    // Handle punch out
 const handlePunchOut = async () => {
        // If on break, end break first
        if (isBreak) {
            await endBreak();
        }
        
        const result = await punchOut();
        if (result?.success) {
            await refetch();
            setIsWorking(false);
            setIsBreak(false);
            setWorkSeconds(0);
            setBreakSeconds(0);
            setLastUpdateTime(null);
            window.location.assign(window.location.href);
        }
    };

     const formatTime = (totalSeconds) => {
        const hrs = Math.floor(totalSeconds / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        const secs = Math.floor(totalSeconds % 60);
        return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    const calculateDurationFn = (start, end) => {
        if (!start) return "0h 0m";
        try {
            const startDate = new Date(start);
            const endDate = end ? new Date(end) : new Date();
            if (isNaN(startDate.getTime()) || (end && isNaN(endDate.getTime()))) {
                return "Invalid Date";
            }
            const diffMs = endDate - startDate;
            const diffMins = Math.floor(diffMs / 60000);
            const hours = Math.floor(diffMins / 60);
            const minutes = diffMins % 60;
            return `${hours}h ${minutes}m`;
        } catch (e) {
            return "Error";
        }
    };

    // Calculate advanced statistics
    const calculateStats = () => {
        const records = user?.role === "admin" ? attendanceRecords : userAttendanceRecords;
        const today = new Date().toISOString().split("T")[0];

        const todayRecords = records.filter((record) => record.date === today || new Date(record.createdAt).toISOString().split("T")[0] === today);

        const thisWeekRecords = records.filter((record) => {
            const recordDate = new Date(record.createdAt || record.date);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return recordDate >= weekAgo;
        });

        const thisMonthRecords = records.filter((record) => {
            const recordDate = new Date(record.createdAt || record.date);
            const monthAgo = new Date();
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return recordDate >= monthAgo;
        });

        const totalHours = thisWeekRecords.reduce((total, record) => {
            if (record.punchIn && record.punchOut) {
                const duration = calculateDurationFn(record.punchIn, record.punchOut);
                const [hours] = duration.split("h");
                return total + (parseInt(hours) || 0);
            }
            return total;
        }, 0);

        const monthlyHours = thisMonthRecords.reduce((total, record) => {
            if (record.punchIn && record.punchOut) {
                const duration = calculateDurationFn(record.punchIn, record.punchOut);
                const [hours] = duration.split("h");
                return total + (parseInt(hours) || 0);
            }
            return total;
        }, 0);

        const averageHours = thisWeekRecords.length > 0 ? Math.round(totalHours / thisWeekRecords.length) : 0;
        const attendanceRate = thisWeekRecords.length > 0 ? Math.round((thisWeekRecords.length / 7) * 100) : 0;

        return {
            todayPresent: todayRecords.length > 0,
            weekPresent: thisWeekRecords.length,
            monthPresent: thisMonthRecords.length,
            totalHours,
            monthlyHours,
            averageHours,
            attendanceRate,
            efficiency: attendanceRate > 80 ? "Excellent" : attendanceRate > 60 ? "Good" : "Needs Improvement",
        };
    };

    const stats = calculateStats();

    // Generate enhanced chart data
    const generateChartData = () => {
        const data = [];
        const today = new Date();

        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split("T")[0];

            const dayRecords = userAttendanceRecords.filter((record) => {
                const recordDate = new Date(record.createdAt || record.date);
                return recordDate.toISOString().split("T")[0] === dateStr;
            });

            const hours =
                dayRecords.length > 0 && dayRecords[0].punchIn && dayRecords[0].punchOut
                    ? calculateDurationFn(dayRecords[0].punchIn, dayRecords[0].punchOut).split("h")[0]
                    : 0;

            data.push({
                date: date.toLocaleDateString("en-US", { weekday: "short" }),
                hours: parseInt(hours) || 0,
                present: dayRecords.length > 0 ? 1 : 0,
                efficiency: parseInt(hours) >= 8 ? 100 : parseInt(hours) >= 6 ? 75 : parseInt(hours) >= 4 ? 50 : 25,
            });
        }

        return data;
    };

    const chartData = generateChartData();

    // Generate pie chart data for attendance distribution
    const generatePieData = () => {
        const records = userAttendanceRecords.slice(-30);
        const present = records.filter((r) => r.punchIn && r.punchOut).length;
        const absent = records.length - present;
        const partial = records.filter((r) => r.punchIn && !r.punchOut).length;

        return [
            { name: "Present", value: present, color: "#10b981" },
            { name: "Absent", value: absent, color: "#ef4444" },
            { name: "Partial", value: partial, color: "#f59e0b" },
        ];
    };

    const pieData = generatePieData();

    // Loading and error states
    if (user?.role !== "admin" && userLoading)
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary"></div>
                        <div className="absolute inset-0 animate-ping rounded-full border-4 border-transparent border-t-primary"></div>
                    </div>
                    <p className="font-medium text-muted-foreground">Loading your attendance data...</p>
                </div>
            </div>
        );

    if (user?.role === "admin" && allLoading)
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary"></div>
                        <div className="absolute inset-0 animate-ping rounded-full border-4 border-transparent border-t-primary"></div>
                    </div>
                    <p className="font-medium text-muted-foreground">Loading all attendance data...</p>
                </div>
            </div>
        );

    if (user?.role !== "admin" && userError)
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
                    <p className="font-medium text-red-500">Error: {userError}</p>
                </div>
            </div>
        );

    if (user?.role === "admin" && allError)
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
                    <p className="font-medium text-red-500">Error: {allError}</p>
                </div>
            </div>
        );

    const safeTodayAttendance = todayAttendance || {};
    const todayHours =
        safeTodayAttendance.punchOut && safeTodayAttendance.punchIn
            ? calculateDurationFn(safeTodayAttendance.punchIn, safeTodayAttendance.punchOut)
            : "0h 0m";

    return (
        <div className="flex min-h-screen flex-col gap-6 bg-gradient-to-br from-slate-50 to-blue-50 p-6 dark:from-slate-900 dark:to-slate-800">
            {/* Header Section */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                        <h1 className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-4xl font-bold tracking-tight text-transparent">
                            Dashboard
                        </h1>
                        <p className="text-lg text-muted-foreground">
                            {user?.role === "admin" ? "Employee Attendance Overview" : `Employee Code: ${user?.empId}`}
                        </p>
                    </div>
                </div>

                {/* Profile Section */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white/50 p-3 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-800/50">
                        <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                            <AvatarImage
                                src={user?.avatar}
                                alt={user?.fullname}
                            />
                            <AvatarFallback className="bg-gradient-to-br from-primary to-blue-600 font-bold text-white">
                                {user?.fullname?.charAt(0) || "U"}
                            </AvatarFallback>
                        </Avatar>
                        <div className="hidden sm:block">
                            <p className="font-semibold text-slate-900 dark:text-slate-100">{user?.fullname}</p>
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="capitalize">
                                    {user?.role}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary Stats Bar */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-blue-100">Today's Status</CardTitle>
                        <Activity className="h-4 w-4 text-blue-200" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {safeTodayAttendance.punchIn ? (safeTodayAttendance.punchOut ? "Completed" : "Active") : "Not Started"}
                        </div>
                        <p className="text-xs text-blue-200">{todayHours} worked today</p>
                    </CardContent>
                    <div className="absolute right-0 top-0 h-20 w-20 -translate-y-10 translate-x-10 rounded-full bg-white/10"></div>
                </Card>

                <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-green-100">This Week</CardTitle>
                        <Calendar className="h-4 w-4 text-green-200" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.weekPresent} days</div>
                        <p className="flex items-center gap-1 text-xs text-green-200">
                            <ArrowUpRight className="h-3 w-3" />
                            +2.1% from last week
                        </p>
                    </CardContent>
                    <div className="absolute right-0 top-0 h-20 w-20 -translate-y-10 translate-x-10 rounded-full bg-white/10"></div>
                </Card>

                <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-amber-100">Total Hours</CardTitle>
                        <Clock4 className="h-4 w-4 text-amber-200" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalHours}h</div>
                        <p className="text-xs text-amber-200">{stats.averageHours}h average per day</p>
                    </CardContent>
                    <div className="absolute right-0 top-0 h-20 w-20 -translate-y-10 translate-x-10 rounded-full bg-white/10"></div>
                </Card>

                <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-purple-100">Attendance Rate</CardTitle>
                        <Target className="h-4 w-4 text-purple-200" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.attendanceRate}%</div>
                        <p className="text-xs text-purple-200">{7 - stats.weekPresent} days remaining</p>
                    </CardContent>
                    <div className="absolute right-0 top-0 h-20 w-20 -translate-y-10 translate-x-10 rounded-full bg-white/10"></div>
                </Card>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 gap-6">
                {/* Left Column - Attendance Table */}
                <div className="space-y-6 lg:col-span-2">
                    <Card className="border-0 bg-white/80 shadow-lg backdrop-blur-sm dark:bg-slate-800/80">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Users className="h-5 w-5 text-blue-500" />
                                {user?.role === "admin" ? "All Employees Attendance" : "Your Attendance History"}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="relative h-[400px] w-full overflow-auto rounded-lg">
                                {user?.role === "admin" ? (
                                    <AttendanceTable attendanceRecords={attendanceRecords || []} />
                                ) : (
                                    <EmployeeAttendanceTable
                                        attendanceRecords={userAttendanceRecords}
                                        refetch={refetch}
                                    />
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Quick Actions */}
                <div className="space-y-6">
                    {user?.role !== "admin" && (
                        <Card className="border-0 bg-white/80 shadow-lg backdrop-blur-sm dark:bg-slate-800/80">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Zap className="h-5 w-5 text-yellow-500" />
                                    Quick Actions
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Show Punch In only if not punched in */}
                                {/* {!safeTodayAttendance.punchIn && ( */}
                                    <Button
                                        onClick={handlePunchIn}
                                        disabled={attendanceActionLoading}
                                        className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg hover:from-green-600 hover:to-green-700"
                                        size="lg"
                                    >
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Punch In
                                    </Button>
                                {/* )} */}

                                {/* Show Timer and Break buttons only if punched in and not punched out */}
                                {/* {safeTodayAttendance.punchIn && !safeTodayAttendance.punchOut && ( */}
                                    <>
                                        <div className="text-center space-y-3">
                                            <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 rounded-lg">
                                                <div className="text-sm text-muted-foreground mb-1">Work Duration</div>
                                                <div className="text-3xl font-bold font-mono text-blue-600 dark:text-blue-400">
                                                    {formatTime(workSeconds)}
                                                </div>
                                            </div>
                                            
                                            <div className="p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
                                                <div className="text-sm text-muted-foreground mb-1">Break Duration</div>
                                                <div className="text-2xl font-bold font-mono text-yellow-600 dark:text-yellow-400">
                                                    {formatTime(breakSeconds)}
                                                </div>
                                            </div>
                                        </div>

                                        <Button
                                            onClick={handleBreakToggle}
                                            disabled={attendanceActionLoading}
                                            className={`w-full ${
                                                isBreak 
                                                    ? "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700" 
                                                    : "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                                            } text-white shadow-lg`}
                                            size="lg"
                                        >
                                            {isBreak ? (
                                                <>
                                                    <CheckCircle className="mr-2 h-4 w-4" />
                                                    Resume Work
                                                </>
                                            ) : (
                                                <>
                                                    <Timer className="mr-2 h-4 w-4" />
                                                    Take Break
                                                </>
                                            )}
                                        </Button>

                                        <Button
                                            onClick={handlePunchOut}
                                            disabled={attendanceActionLoading}
                                            className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg hover:from-red-600 hover:to-red-700"
                                            size="lg"
                                        >
                                            <XCircle className="mr-2 h-4 w-4" />
                                            Punch Out
                                        </Button>
                                    </>
                                {/* )} */}

                                {/* Show completion message */}
                                {/* {safeTodayAttendance.punchOut && (
                                    <div className="text-center p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
                                        <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                                        <p className="text-green-600 dark:text-green-400 font-medium">
                                            Today's work completed!
                                        </p>
                                    </div>
                                )} */}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default DashboardPage;