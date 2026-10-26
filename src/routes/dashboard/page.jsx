import { useSelector } from "react-redux";
import { Footer } from "@/layouts/footer";
import useGetAttendance from "@/hooks/useGetAttendance";
import DashboardSections from "./DashboardSections";
import MyDayCard from "./MyDayCard";

const DashboardPage = () => {
    const { user } = useSelector((state) => state.auth);
    useGetAttendance(); // loads my attendance for the "My day" card

    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="title">{greeting}, {user?.fullname?.split(" ")[0] || ""}</h1>
                <p className="text-sm text-muted-foreground">
                    {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
                    {user?.empId ? ` · Employee code ${user.empId}` : ""}
                </p>
            </div>

            <DashboardSections myDay={<MyDayCard />} />

            <Footer />
        </div>
    );
};

export default DashboardPage;
