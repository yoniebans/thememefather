import { createBrowserRouter } from "react-router-dom";
import Layout from "@/Layout";
import HomePage from "@/pages/HomePage";
import { Vault } from "@/pages/Vault";
import { Office as Console } from "@/pages/Console";
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
                path: "/console",
                element: <Console />,
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