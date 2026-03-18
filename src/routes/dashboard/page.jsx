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
    Timer
} from "lucide-react";
import { Button } from "@/components/ui/button";
import useAttendance from "@/hooks/useAttendance";
import { formatDateSafe, calculateDuration } from "@/utils/data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { useState, useEffect } from "react";

const DashboardPage = () => {
    const { theme } = useTheme();
    const { allAttendance, loading: allLoading, error: allError, todayAttendance } = useSelector((state) => state.attendance);
    const { user } = useSelector((state) => state.auth);
    const { data: userAttendance, loading: userLoading, error: userError, refetch } = useGetAttendance();
    const { punchIn, punchOut, loading: attendanceActionLoading } = useAttendance();
    const [isAnimating, setIsAnimating] = useState(false);

    useGetAllAttendance();

    // Process attendance data
    const attendanceRecords = Array.isArray(allAttendance) ? allAttendance : allAttendance?.attendance || [];
    const userAttendanceRecords = Array.isArray(userAttendance) ? userAttendance : userAttendance?.attendance || [];

    // Handle punch actions with animation
    const handlePunchIn = async () => {
        setIsAnimating(true);
        await punchIn();
        await refetch();
        setTimeout(() => setIsAnimating(false), 1000);
    };

    const handlePunchOut = async () => {
        setIsAnimating(true);
        await punchOut();
        await refetch();
        setTimeout(() => setIsAnimating(false), 1000);
    };

    const formatDateSafe = (date, formatStr = "h:mm a") => {
        if (!date) return "N/A";
        try {
            const dateObj = new Date(date);
            if (isNaN(dateObj.getTime())) return "Invalid Date";
            return new Intl.DateTimeFormat("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
            }).format(dateObj);
        } catch (e) {
            return "Invalid Date";
        }
    };

    const calculateDuration = (start, end) => {
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
        const today = new Date().toISOString().split('T')[0];

        const todayRecords = records.filter(record =>
            record.date === today || new Date(record.createdAt).toISOString().split('T')[0] === today
        );

        const thisWeekRecords = records.filter(record => {
            const recordDate = new Date(record.createdAt || record.date);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return recordDate >= weekAgo;
        });

        const thisMonthRecords = records.filter(record => {
            const recordDate = new Date(record.createdAt || record.date);
            const monthAgo = new Date();
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return recordDate >= monthAgo;
        });

        const totalHours = thisWeekRecords.reduce((total, record) => {
            if (record.punchIn && record.punchOut) {
                const duration = calculateDuration(record.punchIn, record.punchOut);
                const [hours] = duration.split('h');
                return total + (parseInt(hours) || 0);
            }
            return total;
        }, 0);

        const monthlyHours = thisMonthRecords.reduce((total, record) => {
            if (record.punchIn && record.punchOut) {
                const duration = calculateDuration(record.punchIn, record.punchOut);
                const [hours] = duration.split('h');
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
            efficiency: attendanceRate > 80 ? "Excellent" : attendanceRate > 60 ? "Good" : "Needs Improvement"
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
            const dateStr = date.toISOString().split('T')[0];

            const dayRecords = userAttendanceRecords.filter(record => {
                const recordDate = new Date(record.createdAt || record.date);
                return recordDate.toISOString().split('T')[0] === dateStr;
            });

            const hours = dayRecords.length > 0 && dayRecords[0].punchIn && dayRecords[0].punchOut
                ? calculateDuration(dayRecords[0].punchIn, dayRecords[0].punchOut).split('h')[0]
                : 0;

            data.push({
                date: date.toLocaleDateString('en-US', { weekday: 'short' }),
                hours: parseInt(hours) || 0,
                present: dayRecords.length > 0 ? 1 : 0,
                efficiency: parseInt(hours) >= 8 ? 100 : parseInt(hours) >= 6 ? 75 : parseInt(hours) >= 4 ? 50 : 25
            });
        }

        return data;
    };

    const chartData = generateChartData();

    // Generate pie chart data for attendance distribution
    const generatePieData = () => {
        const records = userAttendanceRecords.slice(-30); // Last 30 days
        const present = records.filter(r => r.punchIn && r.punchOut).length;
        const absent = records.length - present;
        const partial = records.filter(r => r.punchIn && !r.punchOut).length;

        return [
            { name: 'Present', value: present, color: '#10b981' },
            { name: 'Absent', value: absent, color: '#ef4444' },
            { name: 'Partial', value: partial, color: '#f59e0b' }
        ];
    };

    const pieData = generatePieData();

    // Loading and error states with better UI
    if (user?.role !== "admin" && userLoading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-4">
                <div className="relative">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-ping"></div>
                </div>
                <p className="text-muted-foreground font-medium">Loading your attendance data...</p>
            </div>
        </div>
    );

    if (user?.role === "admin" && allLoading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-4">
                <div className="relative">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-ping"></div>
                </div>
                <p className="text-muted-foreground font-medium">Loading all attendance data...</p>
            </div>
        </div>
    );

    if (user?.role !== "admin" && userError) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-500 font-medium">Error: {userError}</p>
            </div>
        </div>
    );

    if (user?.role === "admin" && allError) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-500 font-medium">Error: {allError}</p>
            </div>
        </div>
    );

    const safeTodayAttendance = todayAttendance || {};
    const todayHours = safeTodayAttendance.punchOut && safeTodayAttendance.punchIn
        ? calculateDuration(safeTodayAttendance.punchIn, safeTodayAttendance.punchOut)
        : "0h 0m";

    return (
        <div className="flex flex-col gap-6 p-6 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 min-h-screen">
            {/* Enhanced Header Section */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                            Dashboard
                        </h1>
                        <p className="text-muted-foreground text-lg">
                            {user?.role === "admin"
                                ? "Employee Attendance Overview"
                                : `Employee Code: ${user?.empId}`
                            }
                        </p>
                    </div>
                </div>

                {/* Enhanced Profile Section */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700">
                        <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                            <AvatarImage src={user?.avatar} alt={user?.fullname} />
                            <AvatarFallback className="bg-gradient-to-br from-primary to-blue-600 text-white font-bold">
                                {user?.fullname?.charAt(0) || "U"}
                            </AvatarFallback>
                        </Avatar>
                        <div className="hidden sm:block">
                            <p className="font-semibold text-slate-900 dark:text-slate-100">{user?.fullname}</p>
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="capitalize">
                                    {user?.role}
                                </Badge>
                                {/* <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                    <span>Premium</span>
                                </div> */}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Enhanced Summary Stats Bar */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:shadow-xl transition-all duration-300 hover:scale-105">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-blue-100">Today's Status</CardTitle>
                        <Activity className="h-4 w-4 text-blue-200" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {safeTodayAttendance.punchIn
                                ? (safeTodayAttendance.punchOut ? "Completed" : "Active")
                                : "Not Started"
                            }
                        </div>
                        <p className="text-xs text-blue-200">
                            {todayHours} worked today
                        </p>
                    </CardContent>
                    <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
                </Card>

                <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white hover:shadow-xl transition-all duration-300 hover:scale-105">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-green-100">This Week</CardTitle>
                        <Calendar className="h-4 w-4 text-green-200" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.weekPresent} days</div>
                        <p className="text-xs text-green-200 flex items-center gap-1">
                            <ArrowUpRight className="h-3 w-3" />
                            +2.1% from last week
                        </p>
                    </CardContent>
                    <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
                </Card>

                <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-amber-500 to-amber-600 text-white hover:shadow-xl transition-all duration-300 hover:scale-105">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-amber-100">Total Hours</CardTitle>
                        <Clock4 className="h-4 w-4 text-amber-200" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalHours}h</div>
                        <p className="text-xs text-amber-200">
                            {stats.averageHours}h average per day
                        </p>
                    </CardContent>
                    <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
                </Card>

                <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white hover:shadow-xl transition-all duration-300 hover:scale-105">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-purple-100">Attendance Rate</CardTitle>
                        <Target className="h-4 w-4 text-purple-200" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.attendanceRate}%
                        </div>
                        <p className="text-xs text-purple-200">
                            {7 - stats.weekPresent} days remaining
                        </p>
                    </CardContent>
                    <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
                </Card>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 gap-6">
                {/* Left Column - Charts and Stats */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Enhanced Attendance Trend Chart */}
                    {/* <Card className="shadow-lg border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <TrendingUp className="h-5 w-5 text-blue-500" />
                                Attendance Trend
                            </CardTitle>
                            <CardDescription>
                                Your attendance pattern and efficiency over the last 7 days
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                                            </linearGradient>
                                            <linearGradient id="colorEfficiency" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                                        <XAxis
                                            dataKey="date"
                                            className="text-xs"
                                            tick={{ fontSize: 12 }}
                                        />
                                        <YAxis
                                            className="text-xs"
                                            tick={{ fontSize: 12 }}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'hsl(var(--card))',
                                                border: '1px solid hsl(var(--border))',
                                                borderRadius: '12px',
                                                boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                                            }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="hours"
                                            stroke="#3b82f6"
                                            strokeWidth={3}
                                            fill="url(#colorHours)"
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="efficiency"
                                            stroke="#10b981"
                                            strokeWidth={2}
                                            fill="url(#colorEfficiency)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card> */}

                    {/* Enhanced Attendance Table */}
                    <Card className="shadow-lg border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
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

                {/* Right Column - Quick Actions and Details */}
                <div className="space-y-6">
                    {/* Enhanced Quick Actions */}
                    {user?.role !== "admin" && (
                        <Card className="shadow-lg border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Zap className="h-5 w-5 text-yellow-500" />
                                    Quick Actions
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
  {/* Punch In Button */}
  <Button
    onClick={handlePunchIn}
    disabled={attendanceActionLoading}
    className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg"
    size="lg"
  >
    <CheckCircle className="mr-2 h-4 w-4" />
    Punch In
  </Button>

  {/* Punch Out Button */}
  <Button
    onClick={handlePunchOut}
    disabled={
      attendanceActionLoading 
    }
    className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg"
    size="lg"
  >
    <XCircle className="mr-2 h-4 w-4" />
    Punch Out
  </Button>
</CardContent>

                        </Card>
                    )}

                    {/* Enhanced Today's Summary */}
                    {/* <Card className="shadow-lg border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Clock className="h-5 w-5 text-blue-500" />
                                Today's Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {safeTodayAttendance.punchIn ? (
                                <>
                                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
                                        <span className="text-sm font-medium">Total Hours</span>
                                        <span className="text-xl font-bold text-blue-600 dark:text-blue-400">{todayHours}</span>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-sm p-2 bg-slate-50 dark:bg-slate-800 rounded-md">
                                            <span className="text-muted-foreground flex items-center gap-1">
                                                <Plus className="h-3 w-3" />
                                                Punch In
                                            </span>
                                            <span className="font-medium">{formatDateSafe(safeTodayAttendance.punchIn)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm p-2 bg-slate-50 dark:bg-slate-800 rounded-md">
                                            <span className="text-muted-foreground flex items-center gap-1">
                                                <Minus className="h-3 w-3" />
                                                Punch Out
                                            </span>
                                            <span className="font-medium">
                                                {safeTodayAttendance.punchOut
                                                    ? formatDateSafe(safeTodayAttendance.punchOut)
                                                    : "Not punched out yet"
                                                }
                                            </span>
                                        </div>
                                    </div>
                                    {safeTodayAttendance.punchIn && !safeTodayAttendance.punchOut && (
                                        <div className="pt-2">
                                            <div className="flex justify-between text-sm mb-2">
                                                <span className="flex items-center gap-1">
                                                    <Timer className="h-3 w-3" />
                                                    Progress
                                                </span>
                                                <span>{todayHours}</span>
                                            </div>
                                            <Progress value={50} className="h-3" />
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center py-6">
                                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                                    <p className="text-sm text-muted-foreground">No attendance recorded today</p>
                                </div>
                            )}
                        </CardContent>
                    </Card> */}

                    {/* Enhanced Weekly Progress */}
                    {/* <Card className="shadow-lg border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <BarChart3 className="h-5 w-5 text-purple-500" />
                                Weekly Progress
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">Attendance Rate</span>
                                    <span className="text-xl font-bold text-purple-600 dark:text-purple-400">
                                        {stats.attendanceRate}%
                                    </span>
                                </div>
                                <Progress
                                    value={stats.attendanceRate}
                                    className="h-3"
                                />
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                        <p className="text-muted-foreground">Present</p>
                                        <p className="font-semibold text-green-600 dark:text-green-400">{stats.weekPresent} days</p>
                                    </div>
                                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                                        <p className="text-muted-foreground">Remaining</p>
                                        <p className="font-semibold text-amber-600 dark:text-amber-400">{7 - stats.weekPresent} days</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card> */}

                    {/* New: Attendance Distribution Chart */}
                    {/* <Card className="shadow-lg border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Award className="h-5 w-5 text-emerald-500" />
                                Attendance Distribution
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[200px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={40}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'hsl(var(--card))',
                                                border: '1px solid hsl(var(--border))',
                                                borderRadius: '12px',
                                                boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex justify-center gap-4 mt-4">
                                {pieData.map((item, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: item.color }}
                                        ></div>
                                        <span className="text-xs">{item.name}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card> */}
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default DashboardPage;
