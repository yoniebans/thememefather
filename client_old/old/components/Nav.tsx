import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import fontboltImage from "@/assets/fontbolt.png";
import { SocialButtons } from "@/components/SocialButtons";
import { WalletButton } from "@/components/WalletButton";

export function Nav() {
    const navigate = useNavigate();
    const location = useLocation();
    const currentPath = location.pathname;

    return (
        <div className="absolute top-4 w-full px-4 flex justify-between items-center z-50">
            <img
                src={fontboltImage}
                alt="Logo"
                className="h-12 w-auto cursor-pointer"
                onClick={() => navigate('/')}
            />

            <div className="flex items-center gap-2">
                {/* Always show WalletButton on office page */}
                {currentPath === '/office' && <WalletButton />}

                <Button
                    variant="outline"
                    className={`bg-[#EC4899] hover:bg-[#DB2777]/90 text-black rounded-xl border-2 border-black ${
                        currentPath === '/office' ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    onClick={() => navigate('/office')}
                    disabled={currentPath === '/office'}
                >
                    office
                </Button>

                <Button
                    variant="outline"
                    className={`bg-[#EC4899] hover:bg-[#DB2777]/90 text-black rounded-xl border-2 border-black ${
                        currentPath === '/vault' ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    onClick={() => navigate('/vault')}
                    disabled={currentPath === '/vault'}
                >
                    vault
                </Button>

                <Button
                    variant="outline"
                    className={`bg-[#EC4899] hover:bg-[#DB2777]/90 text-black rounded-xl border-2 border-black ${
                        currentPath === '/kitchen' ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    onClick={() => navigate('/kitchen')}
                    disabled={currentPath === '/kitchen'}
                >
                    kitchen
                </Button>

                <Button
                    variant="outline"
                    className={`bg-[#EC4899] hover:bg-[#DB2777]/90 text-black rounded-xl border-2 border-black ${
                        currentPath === '/' ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    onClick={() => navigate('/')}
                    disabled={currentPath === '/'}
                >
                    home
                </Button>

                <SocialButtons />
            </div>
        </div>
    );
}