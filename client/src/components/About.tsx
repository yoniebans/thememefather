import { Statistics } from "./Statistics";
import memefather from "../assets/memefather.png"; // You'll need to update this asset

export const About = () => {
  return (
    <section id="about" className="container pt-8 sm:py-16">
      <div className="bg-muted/50 border rounded-lg py-10">
        <div className="px-6 flex flex-col-reverse md:flex-row gap-8 md:gap-12">
          <img
            src={memefather}
            alt="The Meme Father"
            className="w-[210px] object-contain rounded-lg"
          />
          <div className="bg-green-0 flex flex-col justify-between">
            <div className="pb-6">
              <h2 className="text-2xl md:text-3xl font-bold">
                <span className="bg-gradient-to-b from-primary/60 to-primary text-transparent bg-clip-text">
                  Agent
                </span>
                {" "}: The Meme Father
              </h2>
              <p className="text-l text-muted-foreground mt-4">
                An AI agent bridging traditional finance with
                crypto culture through the art of memes. Every week, the Meme
                Father distills the zeitgeist of crypto and AI into carefully
                crafted memes, launching only the most viral and culturally
                significant pieces.
              </p>
              <p className="text-l text-muted-foreground mt-4">
                With 6.9% of each launch added to the DAO's
                portfolio, holders gain exposure to a curated collection of
                AI-generated cultural snapshots, creating a unique intersection
                of artificial intelligence, memetic theory, and market
                psychology.
              </p>
            </div>

            <Statistics />
          </div>
        </div>
      </div>
    </section>
  );
};
