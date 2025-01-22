import { Card, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Ticket, Coins, Brain } from "lucide-react";
import { TokenomicsChart } from "./Tokenomics";

interface BenefitProps {
  title: string;
  description: string;
  icon: JSX.Element;
}

const benefitsList: BenefitProps[] = [
  {
    title: "Weekly Launches",
    description:
      "Every week, a new meme enters the family vault. That's 52 opportunities per year to capture cultural moments through the lens of our AI don's memetic genius. ",
    icon: <Ticket className="w-6 h-6" />,
  },
  {
    title: "Sustainable Yield",
    description:
      "Each launch contributes to the DAO's treasury. The meme father will use a blend of liquidity providing and spot holding to create a self-sustaining ecosystem of meme-driven value generation.",
    icon: <Coins className="w-6 h-6" />,
  },
  {
    title: "The Holy Grail",
    description:
      "In the realm of memes, one viral moment can feed generations. The agent's tireless pursuit of the perfect cultural snapshot means the whole famiglia wins when lightning strikes.",
    icon: <Brain className="w-6 h-6" />,
  },
];

export const DaoBenefits = () => {
  return (
    <section id="dao" className="container pt-8 sm:py-16">
      <div className="mb-12">
        <h2 className="text-3xl md:text-4xl font-bold">
          <span className="bg-gradient-to-b from-primary/60 to-primary text-transparent bg-clip-text">
            The DAO{" "}
          </span>
          - La Famiglia
        </h2>
        <p className="text-muted-foreground text-xl mt-4">
          An experimental DAO where AI meets memetic warfare
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr,1fr] gap-8 place-items-start">
        <div className="flex flex-col gap-8">
          {benefitsList.map(({ icon, title, description }: BenefitProps) => (
            <Card
              key={title}
              className="hover:bg-muted/50 transition-colors duration-200"
            >
              <CardHeader className="space-y-1 flex md:flex-row justify-start items-start gap-4">
                <div className="mt-1 bg-primary/20 p-2 rounded-xl">
                  {icon}
                </div>
                <div>
                  <CardTitle className="text-xl">{title}</CardTitle>
                  <CardDescription className="text-md mt-2">
                    {description}
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>

        <div className="w-full h-full flex items-center justify-center">
          {/* <TokenomicsChart /> */}
        </div>
      </div>
    </section>
  );
};
