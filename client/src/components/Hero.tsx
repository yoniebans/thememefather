import { Button } from "./ui/button";
import { buttonVariants } from "./ui/button";
import { HeroCards } from "./HeroCards";
import { Brain } from "lucide-react";

export const Hero = () => {
  return (
    <section className="container grid lg:grid-cols-2 place-items-center py-16 md:py-28 gap-10">
      <div className="text-center lg:text-start space-y-6">
        <main className="text-5xl md:text-6xl font-bold">
          <h2 className="inline">
            <span className="inline bg-gradient-to-r from-[#6366F1] via-[#8B5CF6] to-[#D946EF] text-transparent bg-clip-text">
              AI-Powered Meme Economy
            </span>
          </h2>
        </main>

        <p className="text-xl text-muted-foreground md:w-10/12 mx-auto lg:mx-0">
          Welcome to la famiglia - where AI meets memetic warfare. Every week, a
          new cultural timestamp is minted into crypto history through our
          autonomous meme creation system.
        </p>

        <div className="space-y-4 md:space-y-0 md:space-x-4">
          <Button className="w-full md:w-auto group transition-all">
            <Brain className="mr-2 h-4 w-4 group-hover:rotate-12 transition-transform" />
            Join La Famiglia
          </Button>

          <a
            rel="noreferrer noopener"
            href="https://x.com/the_meme_father"
            target="_blank"
            className={`w-full md:w-auto ${buttonVariants({
              variant: "outline",
            })}`}
          >
            <svg
              role="img"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              className="fill-foreground w-5 h-5 mr-2"
            >
              <title>X</title>
              <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
            </svg>
            Follow The Don
          </a>
        </div>

        <p className="text-sm text-muted-foreground">
          An experiment in autonomous meme creation and market psychology
        </p>
      </div>

      {/* Hero cards sections */}
      <div className="z-10">
        <HeroCards />
      </div>

      {/* Shadow effect */}
      <div className="shadow"></div>
    </section>
  );
};
