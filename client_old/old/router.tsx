import { createBrowserRouter } from "react-router-dom";
import Home from "./pages/Home";
import { Vault } from "./pages/Vault";
import { Office } from "./pages/Office";
import { Kitchen } from "./pages/Kitchen";
import { NotFound } from "./pages/NotFound";
import Layout from "./Layout";

export const router = createBrowserRouter([
    {
        element: <Layout />,
        children: [
            {
                path: "/",
                element: <Home />,
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
