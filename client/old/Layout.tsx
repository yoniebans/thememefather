import { Outlet } from "react-router-dom";
import { WalletProvider } from "@/context/WalletContext";

export default function Layout() {
    return (
        <WalletProvider>
            <Outlet />
        </WalletProvider>
    );
}
