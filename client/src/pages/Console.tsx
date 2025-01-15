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
                        <div className="relative group opacity-50">
                            <div className="pointer-events-none">
                                <WalletButton />
                            </div>
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block z-50">
                                <div className="bg-black/70 backdrop-blur-sm text-[#EC4899] text-xs py-1 px-2 rounded whitespace-nowrap">
                                    coming soon
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 flex items-center justify-center">
                        <Chat disabled={true} />
                    </div>
                </div>
            </div>
        </main>
    );
}