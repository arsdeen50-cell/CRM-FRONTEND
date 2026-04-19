import { TriangleAlert, Home, NotepadText, Package, PackagePlus, Settings, ShoppingBag, UserCheck, UserPlus, Users } from "lucide-react";

export const navbarLinks = [
    {
        title: "Dashboard",
        links: [
            {
                label: "Dashboard",
                icon: Home,
                path: "/",
            },
            {
                label: "Task",
                icon: NotepadText,
                path: "/task",
            },
            {
                label: "Employee Tasks",
                icon: NotepadText,
                path: "/employeetask",
            },
            {
                label: "Role Based Access",
                icon: Users,
                path: "/rolebased",
            },
            {
                label: "Leave",
                icon: Users,
                path: "/leave",
            },
            {
                label: "CRM",
                icon: PackagePlus,
                path: "/crm",
            },

        ],
    },
    // {
    //     title: "Customers",
    //     links: [
    //         {
    //             label: "Customers",
    //             icon: Users,
    //             path: "/customers",
    //         },
    //         {
    //             label: "New customer",
    //             icon: UserPlus,
    //             path: "/new-customer",
    //         },
    //         {
    //             label: "Verified customers",
    //             icon: UserCheck,
    //             path: "/verified-customers",
    //         },
    //     ],
    // },
    // {
    //     title: "Products",
    //     links: [
    //         {
    //             label: "Products",
    //             icon: Package,
    //             path: "/products",
    //         },
    //         {
    //             label: "New product",
    //             icon: PackagePlus,
    //             path: "/new-product",
    //         },
    //         {
    //             label: "Inventory",
    //             icon: ShoppingBag,
    //             path: "/inventory",
    //         },
    //     ],
    // },
    // {
    //     title: "Settings",
    //     links: [
    //         {
    //             label: "Settings",
    //             icon: Settings,
    //             path: "/settings",
    //         },
    //     ],
    // },
];

// export const overviewData = [
//     {
//         name: "Jan",
//         total: 1500,
//     },
//     {
//         name: "Feb",
//         total: 2000,
//     },
//     {
//         name: "Mar",
//         total: 1000,
//     },
//     {
//         name: "Apr",
//         total: 5000,
//     },
//     {
//         name: "May",
//         total: 2000,
//     },
//     {
//         name: "Jun",
//         total: 5900,
//     },
//     {
//         name: "Jul",
//         total: 2000,
//     },
//     {
//         name: "Aug",
//         total: 5500,
//     },
//     {
//         name: "Sep",
//         total: 2000,
//     },
//     {
//         name: "Oct",
//         total: 4000,
//     },
//     {
//         name: "Nov",
//         total: 1500,
//     },
//     {
//         name: "Dec",
//         total: 2500,
//     },
// ];

// export const backend_url = "http://localhost:8000/api"

// http://localhost:3000

export const backend_url = "https://api.crm.arsdeen.cloud/api"

export const USER_API_END_POINT = `${backend_url}/v1/user`;

export const ATTENDANCE_API_END_POINT = `${backend_url}/v1/attendance`;

export const TASK_API_END_POINT = `${backend_url}/v1/task`;

export const LEAVE_API_END_POINT = `${backend_url}/v1/leave`;

export const ONBOARDING_API_END_POINT = `${backend_url}/v1/onboarding`;
