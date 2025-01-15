import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import notFoundImage from "@/assets/404.png";

export function NotFound() {
    const navigate = useNavigate();

    return (
        <main className="flex-1 w-full flex">
            <div className="flex-1 w-full flex flex-col">
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center text-white">
                        <div className="mb-4 flex justify-center">
                            <img
                                src={notFoundImage}
                                alt="404"
                                className="h-8 w-auto"
                            />
                        </div>
                        <p className="mb-8">not the alpha you're looking for</p>
                        <Button
                            variant="outline"
                            className="bg-[#EC4899] hover:bg-[#DB2777]/90 text-black rounded-xl border-2 border-black"
                            onClick={() => navigate('/')}
                        >
                            return home
                        </Button>
                    </div>
                </div>
            </div>
        </main>
    );
}