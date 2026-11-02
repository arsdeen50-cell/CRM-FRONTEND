import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ThemeProvider } from "@/contexts/theme-context";
import { AppDialogs } from "@/components/ui/app-dialogs";
import Layout from "@/routes/layout";
import DashboardPage from "@/routes/dashboard/page";
import Login from "@/auth/Login";
import Signup from "@/auth/Signup";
import NotFound from "./pages/NotFound";
import { useEffect, lazy, Suspense } from "react";
// Pages load when first opened, so the first visit downloads far less
import PageLoader from "@/components/PageLoader";
import { setUser } from "./redux/authSlice";
import axios from "@/utils/axiosConfig";
const Task = lazy(() => import("./components/Task"));
import AdminRoute from "./utils/AdminRoute";
import EmployeeRoute from "./utils/EmployeeRoute";
const EmployeeTask = lazy(() => import("./components/EmployeeTask"));
const RoleBasedAccess = lazy(() => import("./pages/RoleBasedAccess"));
const AdminAssign = lazy(() => import("./components/AdminAssign"));
const EmployeeLeave = lazy(() => import("./components/EmployeeLeave"));
const Crm = lazy(() => import("./components/crm/Crm"));
const LeadSource = lazy(() => import("./pages/Crm/LeadSource"));
const GoOnBoarding = lazy(() => import("./pages/Crm/GoOnBoarding/index"));
const CreateGoOnBoardingForm = lazy(() => import("./components/crm/GoOnBoarding/CreateGoOnBoardingForm"));
const EditGoOnBoardingForm = lazy(() => import("./components/crm/GoOnBoarding/EditGoOnBoardingForm"));
const CandidateForm = lazy(() => import("./components/crm/GoOnBoarding/CandidateForm"));
import ForgotPassword from "./auth/ForgotPassword";
import SetPassword from "./auth/SetPassword";
import ChangePassword from "./auth/ChangePassword";
const LeadClientList = lazy(() => import("./pages/Crm/LeadClientList"));
const ClientDetail = lazy(() => import("./pages/Crm/ClientDetail"));
const Revenue = lazy(() => import("./pages/Crm/Revenue"));
const Automations = lazy(() => import("./pages/Crm/Automations"));
const CustomFields = lazy(() => import("./pages/Crm/CustomFields"));
import CrmMemberRoute from "./components/crm/CrmMemberRoute";
import { SalesRoute } from "./components/crm/AccessRoute";
const FollowUps = lazy(() => import("./pages/Crm/FollowUps"));
const Reports = lazy(() => import("./pages/Crm/Reports"));
const ImportLeads = lazy(() => import("./pages/Crm/ImportLeads"));
const Templates = lazy(() => import("./pages/Crm/Templates"));
const Proposals = lazy(() => import("./pages/Crm/Proposals"));
const Projects = lazy(() => import("./pages/Crm/Projects"));
const AuditLog = lazy(() => import("./pages/Crm/AuditLog"));
const Messages = lazy(() => import("./pages/Crm/Messages"));
const Sequences = lazy(() => import("./pages/Crm/Sequences"));
const LeadForms = lazy(() => import("./pages/Crm/LeadForms"));
const Targets = lazy(() => import("./pages/Crm/Targets"));
const Invoices = lazy(() => import("./pages/Crm/Invoices"));
const Retainers = lazy(() => import("./pages/Crm/Retainers"));
const ContentCalendar = lazy(() => import("./pages/Crm/ContentCalendar"));
const PortalAccess = lazy(() => import("./pages/Crm/PortalAccess"));
const TimeTracking = lazy(() => import("./pages/Crm/TimeTracking"));
const Profitability = lazy(() => import("./pages/Crm/Profitability"));
const Integrations = lazy(() => import("./pages/Crm/Integrations"));
const PublicLeadForm = lazy(() => import("./pages/Public/PublicLeadForm"));
const PublicProposal = lazy(() => import("./pages/Public/PublicProposal"));
const PublicInvoice = lazy(() => import("./pages/Public/PublicInvoice"));
const ClientPortal = lazy(() => import("./pages/Public/ClientPortal"));
const HrHome = lazy(() => import("./pages/HR/HrHome"));
const People = lazy(() => import("./pages/HR/People"));
const EmployeeProfile = lazy(() => import("./pages/HR/EmployeeProfile"));
const AttendanceReport = lazy(() => import("./pages/HR/AttendanceReport"));
const Payroll = lazy(() => import("./pages/HR/Payroll"));
const HrSettings = lazy(() => import("./pages/HR/HrSettings"));
const Roster = lazy(() => import("./pages/HR/Roster"));
const Exits = lazy(() => import("./pages/HR/Exits"));
const Expenses = lazy(() => import("./pages/HR/Expenses"));
const ExitDetail = lazy(() => import("./pages/HR/ExitDetail"));

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
  // HR set this password: choose your own before using the CRM (the server enforces it too)
  if (user.mustChangePassword) return <Navigate to="/change-password" replace />;
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
    { path: "/set-password/:token", element: <SetPassword /> },
    { path: "/change-password", element: <ChangePassword /> },
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
        { path: "crm/clients/:id", element: <SalesRoute><ClientDetail /></SalesRoute> },
        // Sales suite: member pages (employees see only their assigned leads) + admin pages (CrmRoute inside)
        { path: "crm/follow-ups", element: <FollowUps /> },
        { path: "crm/proposals", element: <Proposals /> },
        { path: "crm/projects", element: <Projects /> },
        { path: "crm/reports", element: <Reports /> },
        { path: "crm/revenue", element: <Revenue /> },
        { path: "crm/automations", element: <Automations /> },
        { path: "crm/custom-fields", element: <CustomFields /> },
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
        { path: "hr/roster", element: <Roster /> },
        { path: "hr/exits", element: <Exits /> },
        { path: "hr/expenses", element: <Expenses /> },
        { path: "hr/exits/:userId", element: <ExitDetail /> },
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
      <Suspense fallback={<PageLoader />}>
        <RouterProvider router={router} />
      </Suspense>
      <AppDialogs />
    </ThemeProvider>
  );
}

export default App;
