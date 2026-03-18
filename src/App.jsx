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
      path: "/candidate-form/:id",
      element: <CandidateForm />,
    },
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
            <EmployeeRoute>
              <Crm />
            </EmployeeRoute>
          ),
        },
        {
          path: "crm/lead-source",
          element: (
            <EmployeeRoute>
              <LeadSource />
            </EmployeeRoute>
          ),
        },
        {
          path: "crm/goonboardingdata",
          element: (
            <EmployeeRoute>
              <GoOnBoarding />
            </EmployeeRoute>
          ),
        },
        {
          path: "crm/create-goonboarding",
          element: (
            <EmployeeRoute>
              <CreateGoOnBoardingForm />
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
