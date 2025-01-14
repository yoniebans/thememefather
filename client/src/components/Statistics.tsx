export const Statistics = () => {
  interface statsProps {
    title: string;
    quantity: string;
    description: string;
  }

  const stats: statsProps[] = [
    {
      title: "Launches",
      quantity: "52",
      description: "Memes / Year",
    },
    {
      title: "Dev Buy",
      quantity: "6.9%",
      description: ">> DAO",
    },
    {
      title: "Strategy",
      quantity: "50 / 50",
      description: "LP / Spot",
    },
    {
      title: "Memes Ranked",
      quantity: "1x",
      description: "Daily",
    },
  ];

  return (
    <section id="statistics">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map(({ title, quantity, description }: statsProps) => (
          <div key={description} className="space-y-2 text-center">
            <p className="text-muted-foreground">{title}</p>
            <h2 className="text-3xl sm:text-4xl font-bold">{quantity}</h2>
            <p className="text-xl text-muted-foreground">{description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};
