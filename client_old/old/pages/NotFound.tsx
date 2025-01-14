import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import fontboltImage from "@/assets/fontbolt.png";

export function NotFound() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen w-full bg-black/80 bg-[url('/src/assets/background_v2.png')] bg-cover bg-center bg-no-repeat">
            <div className="absolute top-4 w-full px-4 flex justify-between items-center">
                <img
                    src={fontboltImage}
                    alt="Logo"
                    className="h-12 w-auto cursor-pointer"
                    onClick={() => navigate('/')}
                />
            </div>

            <div className="h-screen flex flex-col items-center justify-center text-white font-mono">
                <h1 className="text-4xl mb-4 text-[#EC4899]">404 {">"}</h1>
                <p className="mb-8">this is not the alpha you're looking for</p>
                <Button
                    variant="outline"
                    className="bg-[#EC4899] hover:bg-[#DB2777]/90 text-black rounded-xl border-2 border-black"
                    onClick={() => navigate('/')}
                >
                    return home
                </Button>
            </div>
        </div>
    );
} 