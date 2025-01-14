import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Brain, Sparkles, TrendingUp, Rocket } from "lucide-react";
import memefatherpepe from "../assets/memefatherpepe.png";
import fomc from "../assets/fomc.png";
import lambo from "../assets/lambo.png";
import { GitHubLogoIcon } from "@radix-ui/react-icons";
import { FannedImages } from "./FannedImages";

export const HeroCards = () => {
  return (
    <div className="hidden lg:flex flex-row flex-wrap gap-8 relative w-[700px] h-[500px]">
      <FannedImages
        topToken={{
          ticker: "LAMBO",
          score: "069",
          deployDate: "18/12/2024",
          image: lambo,
          tokenId: "409dea79-4663-05c0-ae0f-eb52360fcff6",
          vaultUrl: "lambo",
        }}
        bottomToken={{
          ticker: "FOMC",
          score: "069",
          deployDate: "21/01/1970",
          image: fomc,
          tokenId: "4d203ac1-1f31-0359-9a8e-75903f2d550a",
          vaultUrl: "fomc",
        }}
      />

      {/* Team */}
      <Card className="absolute right-[20px] top-4 w-80 flex flex-col justify-center items-center drop-shadow-xl shadow-black/10 dark:shadow-white/10">
        <CardHeader className="mt-8 flex justify-center items-center pb-2">
          <img
            src={memefatherpepe}
            alt="user avatar"
            className="absolute grayscale-[0%] -top-12 rounded-full w-24 h-24 aspect-square object-cover"
          />
          <CardTitle className="text-center">The Meme Father</CardTitle>
          <CardDescription className="font-normal text-primary">
            vires in memeris
          </CardDescription>
        </CardHeader>

        <CardContent className="text-center pb-2">
          <p>
            digital don of the memetic realm | running the largest degen family
            in crypto | bull run architect | fort knox of meme liquidity | vires
            in memeris 🤌
          </p>
        </CardContent>

        <CardFooter>
          <div>
            <a
              rel="noreferrer noopener"
              href="https://github.com/leoMirandaa"
              target="_blank"
              className={buttonVariants({
                variant: "ghost",
                size: "sm",
              })}
            >
              <span className="sr-only">Github icon</span>
              <GitHubLogoIcon className="w-5 h-5" />
            </a>
            <a
              rel="noreferrer noopener"
              href="https://twitter.com/the_meme_father"
              target="_blank"
              className={buttonVariants({
                variant: "ghost",
                size: "sm",
              })}
            >
              <span className="sr-only">X icon</span>
              <svg
                role="img"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                className="fill-foreground w-5 h-5"
              >
                <title>X</title>
                <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
              </svg>
            </a>
          </div>
        </CardFooter>
      </Card>

      {/* Weekly Stats */}
      <Card className="absolute top-[315px] left-[10px] w-70 drop-shadow-xl shadow-black/10">
        <CardHeader>
          <CardTitle className="flex items-center justify-between pb-4">
            Weekly Process
          </CardTitle>
          <div className="space-y-2 mt-4">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-primary" />
              <span>Content Ingestion</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Meme Generation</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span>Memetic Power Ranking</span>
            </div>
            <div className="flex items-center gap-2">
              <Rocket className="w-4 h-4 text-primary" />
              <span>Launch</span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* AI Memetics */}
      <Card className="absolute w-[340px] left-[300px] bottom-[-25px] drop-shadow-xl shadow-black/10">
        <CardHeader className="flex flex-row gap-4">
          <div className="mt-1 bg-primary/20 p-2 rounded-xl">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <CardTitle>AI Memetics</CardTitle>
            <CardDescription className="mt-2">
              AI memes are merely the appetizer, figlio mio. The real feast
              begins when we merge machine learning with memetic warfare.
            </CardDescription>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
};
