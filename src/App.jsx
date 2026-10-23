import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ThemeProvider } from "@/contexts/theme-context";
import Layout from "@/routes/layout";
import DashboardPage from "@/routes/dashboard/page";
import Login from "@/auth/Login";
import Signup from "@/auth/Signup";
import NotFound from "./pages/NotFound";
import { useEffect } from "react";
import { setUser } from "./redux/authSlice";
import axios from "@/utils/axiosConfig";
import Task from "./components/Task";
import AdminRoute from "./utils/AdminRoute";
import EmployeeRoute from "./utils/EmployeeRoute";
import EmployeeTask from "./components/EmployeeTask";
import RoleBasedAccess from "./pages/RoleBasedAccess";
import AdminAssign from "./components/AdminAssign";
import EmployeeLeave from "./components/EmployeeLeave";
import Crm from "./components/crm/Crm";
import LeadSource from "./pages/Crm/LeadSource";
import GoOnBoarding from "./pages/Crm/GoOnBoarding/index";
import CreateGoOnBoardingForm from "./components/crm/GoOnBoarding/CreateGoOnBoardingForm";
import EditGoOnBoardingForm from "./components/crm/GoOnBoarding/EditGoOnBoardingForm";
import CandidateForm from "./components/crm/GoOnBoarding/CandidateForm";
import ForgotPassword from "./auth/ForgotPassword";
import LeadClientList from "./pages/Crm/LeadClientList";
import CrmMemberRoute from "./components/crm/CrmMemberRoute";
import { SalesRoute } from "./components/crm/AccessRoute";
import FollowUps from "./pages/Crm/FollowUps";
import Reports from "./pages/Crm/Reports";
import ImportLeads from "./pages/Crm/ImportLeads";
import Templates from "./pages/Crm/Templates";
import Proposals from "./pages/Crm/Proposals";
import Projects from "./pages/Crm/Projects";
import AuditLog from "./pages/Crm/AuditLog";
import Messages from "./pages/Crm/Messages";
import Sequences from "./pages/Crm/Sequences";
import LeadForms from "./pages/Crm/LeadForms";
import Targets from "./pages/Crm/Targets";
import Invoices from "./pages/Crm/Invoices";
import Retainers from "./pages/Crm/Retainers";
import ContentCalendar from "./pages/Crm/ContentCalendar";
import PortalAccess from "./pages/Crm/PortalAccess";
import TimeTracking from "./pages/Crm/TimeTracking";
import Profitability from "./pages/Crm/Profitability";
import Integrations from "./pages/Crm/Integrations";
import PublicLeadForm from "./pages/Public/PublicLeadForm";
import PublicProposal from "./pages/Public/PublicProposal";
import PublicInvoice from "./pages/Public/PublicInvoice";
import ClientPortal from "./pages/Public/ClientPortal";
import HrHome from "./pages/HR/HrHome";
import People from "./pages/HR/People";
import EmployeeProfile from "./pages/HR/EmployeeProfile";
import AttendanceReport from "./pages/HR/AttendanceReport";
import Payroll from "./pages/HR/Payroll";
import HrSettings from "./pages/HR/HrSettings";

const PrivateRoute = ({ children }) => {
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 || error.response?.status === 500) {
          return Promise.reject(error);
        }
        return Promise.reject(error);
      },
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  if (!user) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }, [dispatch]);

  const router = createBrowserRouter([
    // 🟢 Public routes (no login required)
    {
          path: "crm/create-goonboarding",
          element: (
            // <EmployeeRoute>
              <CreateGoOnBoardingForm />
            // </EmployeeRoute>
          ),
        },
    {
      path: "/candidate-form/:id",
      element: <CandidateForm />,
    },
    // Client-facing pages (no CRM login): lead form, proposal signing, invoice, client portal
    { path: "/f/:key", element: <PublicLeadForm /> },
    { path: "/p/:token", element: <PublicProposal /> },
    { path: "/i/:token", element: <PublicInvoice /> },
    { path: "/portal/:token", element: <ClientPortal /> },
    {
      path: "/login",
      element: <Login />,
    },
    {
  path: "/forgot-password",
  element: <ForgotPassword />,
},
    {
      path: "/signup",
      element: <Signup />,
    },
    {
      path: "*",
      element: <NotFound />,
    },

    // 🔒 Protected routes
    {
      path: "/",
      element: (
        <PrivateRoute>
          <Layout />
        </PrivateRoute>
      ),
      children: [
        { index: true, element: <DashboardPage /> },
        {
          path: "task",
          element: (
            <AdminRoute>
              <Task />
            </AdminRoute>
          ),
        },
        {
          path: "employeetask",
          element: (
            <EmployeeRoute>
              <EmployeeTask />
            </EmployeeRoute>
          ),
        },
        {
          path: "rolebased",
          element: (
            <EmployeeRoute>
              <RoleBasedAccess />
            </EmployeeRoute>
          ),
        },
        {
          path: "adminassign",
          element: (
            <EmployeeRoute>
              <AdminAssign />
            </EmployeeRoute>
          ),
        },
        {
          path: "leave",
          element: <EmployeeLeave />,
        },
        {
          path: "crm",
          element: (
            <CrmMemberRoute>
              <Crm />
            </CrmMemberRoute>
          ),
        },
        {
          path: "crm/lead-source",
          element: (
            <SalesRoute>
              <LeadSource />
            </SalesRoute>
          ),
        },

         {
          path: "crm/lead-list",
          element: (
            <SalesRoute>
              <LeadClientList />
            </SalesRoute>
          ),
        },
        // Sales suite: member pages (employees see only their assigned leads) + admin pages (CrmRoute inside)
        { path: "crm/follow-ups", element: <FollowUps /> },
        { path: "crm/proposals", element: <Proposals /> },
        { path: "crm/projects", element: <Projects /> },
        { path: "crm/reports", element: <Reports /> },
        { path: "crm/import", element: <ImportLeads /> },
        { path: "crm/templates", element: <Templates /> },
        { path: "crm/audit-log", element: <AuditLog /> },
        // Agency suite (each page checks member/admin access itself)
        { path: "crm/messages", element: <Messages /> },
        { path: "crm/sequences", element: <Sequences /> },
        { path: "crm/lead-forms", element: <LeadForms /> },
        { path: "crm/targets", element: <Targets /> },
        { path: "crm/invoices", element: <Invoices /> },
        { path: "crm/retainers", element: <Retainers /> },
        { path: "crm/content", element: <ContentCalendar /> },
        { path: "crm/portal", element: <PortalAccess /> },
        { path: "crm/time", element: <TimeTracking /> },
        { path: "crm/profitability", element: <Profitability /> },
        { path: "crm/integrations", element: <Integrations /> },
        // HR (each page checks access; the API enforces it)
        { path: "hr", element: <HrHome /> },
        { path: "hr/people", element: <People /> },
        { path: "hr/people/:userId", element: <EmployeeProfile /> },
        { path: "hr/attendance", element: <AttendanceReport /> },
        { path: "hr/payroll", element: <Payroll /> },
        { path: "hr/settings", element: <HrSettings /> },
        {
          path: "crm/goonboardingdata",
          element: (
            <EmployeeRoute>
              <GoOnBoarding />
            </EmployeeRoute>
          ),
        },
        {
          path: "crm/goonboarding/:id",
          element: (
            <EmployeeRoute>
              <EditGoOnBoardingForm />
            </EmployeeRoute>
          ),
        },
      ],
    },
  ]);

  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}

export default App;
