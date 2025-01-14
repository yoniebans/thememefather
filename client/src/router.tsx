import { createBrowserRouter } from "react-router-dom";
import Layout from "@/Layout";
import HomePage from "@/pages/HomePage";
import { Vault } from "@/pages/Vault";
import { Office } from "@/pages/Office";
import { Kitchen } from "@/pages/Kitchen";
import { NotFound } from "@/pages/NotFound";

export const router = createBrowserRouter([
    {
        element: <Layout />,
        children: [
            {
                path: "/",
                element: <HomePage />,
            },
            {
                path: "/vault",
                element: <Vault />,
            },
            {
                path: "/office",
                element: <Office />,
            },
            {
                path: "/kitchen",
                element: <Kitchen />,
            },
            {
                path: "*",
                element: <NotFound />,
            },
        ],
    },
]);