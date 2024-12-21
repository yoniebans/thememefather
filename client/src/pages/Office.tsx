import Chat from "@/components/Chat";
import { useWallet } from "@/context/WalletContext";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import omertaImage from "@/assets/omerta.png";
import { getNextScanTime } from "@/utils/dates";

export function Office() {
    const { connected } = useWallet();
    const nextScan = getNextScanTime();

    return (
        <main className="min-h-screen w-full bg-black/80">
            <div className="min-h-screen relative w-full flex flex-col bg-[url('/src/assets/the_office.png')] bg-cover bg-center bg-no-repeat">
                <Nav />

                <div className="container mx-auto px-4 pt-24">
                    <div className="mb-4">
                        <img
                            src={omertaImage}
                            alt="omerta"
                            className="h-12 w-auto"
                        />
                    </div>

                    <div className="flex-1 flex items-center justify-center">
                        <Chat disabled={!connected} />
                    </div>
                </div>

                <Footer
                    nextScan={nextScan}
                    nextLaunch="25/12/2024"
                />
            </div>
        </main>
    );
}