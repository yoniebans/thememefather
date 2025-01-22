// import ai16z from "@/assets/ai16z.png";
import aethir from "@/assets/aethir-horizontal-logo-color.png";
// import daosdotfun from "@/assets/daosdotfun.png";
interface SponsorProps {
  icon: JSX.Element;
  name: string;
}

const sponsors: SponsorProps[] = [
//   {
//     icon: (
//       <img src={daosdotfun} alt="DAOs.fun" className="w-10 h-10 rounded-full" />
//     ),
//     name: "DAOs.fun",
//   },
  {
    icon: <img src={aethir} alt="Aethir" className="h-8 w-auto" />,
    name: "Aethir",
  },
//   {
//     icon: <img src={ai16z} alt="AI16Z" className="w-10 h-10 rounded-full" />,
//     name: "ai16z",
//   },
];

export const Sponsors = () => {
  return (
    <section id="sponsors" className="container pt-8 sm:py-16">
      <h2 className="text-center text-md lg:text-xl font-bold mb-8 text-primary">
        Powered by
      </h2>

      <div className="flex flex-wrap justify-center items-center gap-4 md:gap-8">
        {sponsors.map(({ icon, name }: SponsorProps) => (
          <div
            key={name}
            className="flex items-center gap-4 text-muted-foreground/60"
          >
            <span>{icon}</span>
            {/* <h3 className="text-xl font-bold">{name}</h3> */}
          </div>
        ))}
      </div>
    </section>
  );
};
