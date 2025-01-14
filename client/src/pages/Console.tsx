import Chat from "@/components/Chat";
import { useWallet } from "@/context/WalletContext";
import omertaImage from "@/assets/omerta.png";
import { getNextScanTime } from "@/utils/dates";
import { WalletButton } from "@/components/WalletButton";

export function Office() {
    const { connected } = useWallet();
    const nextScan = getNextScanTime();

    return (
        <main className="flex-1 w-full bg-black/80">
            <div className="h-full w-full flex flex-col bg-[url('/src/assets/the_office.png')] bg-cover bg-center bg-no-repeat">
                <div className="container mx-auto px-4 py-8 flex flex-col flex-1">
                    <div className="mb-4 flex justify-between items-center">
                        <img
                            src={omertaImage}
                            alt="omerta"
                            className="h-8 w-auto"
                        />
                        <WalletButton />
                    </div>

                    <div className="flex-1 flex items-center justify-center">
                        <Chat disabled={!connected} />
                    </div>
                </div>
            </div>
        </main>
    );
}