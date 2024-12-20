import { Github, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SocialButtons() {
    return (
        <div className="flex gap-2">
            <Button
                variant="outline"
                size="icon"
                className="bg-[#EC4899] hover:bg-[#DB2777]/90 text-black rounded-xl border-2 border-black"
                onClick={() =>
                    window.open(
                        "https://x.com/the_meme_father",
                        "_blank"
                    )
                }
            >
                <Twitter className="h-4 w-4" />
            </Button>
            <Button
                variant="outline"
                size="icon"
                className="bg-[#EC4899] hover:bg-[#DB2777]/90 text-black rounded-xl border-2 border-black"
                onClick={() =>
                    window.open(
                        "https://github.com/yoniebans/the_mf",
                        "_blank"
                    )
                }
            >
                <Github className="h-4 w-4" />
            </Button>
        </div>
    );
} 