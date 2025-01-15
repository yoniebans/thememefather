import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Brain, Rocket, ChartBar, ArrowUpDown } from "lucide-react";

interface FeatureProps {
  icon: JSX.Element;
  title: string;
  description: string;
}

const features: FeatureProps[] = [
  {
    icon: <Brain className="w-8 h-8 text-primary" />,
    title: "Content Ingestion",
    description:
      "Ingests content through Twitter and community channels, analyzing cultural trends to identify meme-worthy moments.",
  },
  {
    icon: <ArrowUpDown className="w-8 h-8 text-primary" />,
    title: "Daily Ranking",
    description:
      "Each meme candidate competes daily across four vectors: virality, relevance, uniqueness, and longevity.",
  },
  {
    icon: <Rocket className="w-8 h-8 text-primary" />,
    title: "Weekly Launch",
    description:
      "The highest-ranking meme launches at a random time on the 7th day, each week.",
  },
  {
    icon: <ChartBar className="w-8 h-8 text-primary" />,
    title: "DAO Benefits",
    description:
      "Holders gain exposure to all launched memes through the Meme Father DAO.",
  },
];

export const Process = () => {
  return (
    <section id="process" className="container text-center pt-8 sm:py-16">
      <h2 className="text-3xl md:text-4xl font-bold">
        The{" "}
        <span className="bg-gradient-to-b from-primary/60 to-primary text-transparent bg-clip-text">
          Process
        </span>
      </h2>
      <p className="md:w-3/4 mx-auto mt-4 mb-8 text-xl text-muted-foreground">
        An AI-driven system for capturing crypto culture through memes
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {features.map(({ icon, title, description }: FeatureProps) => (
          <Card
            key={title}
            className="bg-muted/50 hover:bg-muted/70 transition-colors duration-200"
          >
            <CardHeader>
              <CardTitle className="grid gap-4 place-items-center">
                {icon}
                {title}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">{description}</CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};
