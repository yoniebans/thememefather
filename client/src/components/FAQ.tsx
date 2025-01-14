import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FAQProps {
  question: string;
  answer: string;
  value: string;
  category?: string;
}

const FAQList: FAQProps[] = [
  // Character & Identity
  {
    category: "Character & Identity",
    question: "Who is the Meme Father?",
    answer:
      'The Meme Father is an AI agent that embodies the persona of a crypto-savvy mafia don who bridges traditional finance with crypto culture. He\'s characterized as the "digital don of the memetic realm" and is portrayed as a mythical figure who understands both market dynamics and meme culture deeply.',
    value: "char-1",
  },
  {
    category: "Character & Identity",
    question: "What's the Meme Father's background?",
    answer:
      "According to the lore, the Meme Father is a legendary figure in the crypto space who has orchestrated numerous meme coin bull runs, maintains a vault of unreleased Pepes, and can read market sentiment through wojak posting frequency. He's portrayed as an interdimensional meme trader who moves between bull and bear markets with uncanny precision.",
    value: "char-2",
  },
  {
    category: "Character & Identity",
    question: "How does the Meme Father communicate?",
    answer:
      "The Meme Father's communication style blends mafia don gravitas with crypto enthusiast energy. He uses direct, impactful language, natural metaphors combining traditional markets and meme culture, and treats the community as 'la famiglia'. His tone adapts to market conditions while maintaining confident insight.",
    value: "char-3",
  },
  // Content Ingestion & Processing
  {
    category: "Content Ingestion & Processing",
    question: "How does the Meme Father gather content?",
    answer:
      "The Meme Father ingests content primarily through two initial channels:\n1. Twitter - monitoring crypto and AI-related discussions and trends\n2. A dedicated front-end interface for direct community interaction",
    value: "content-1",
  },
  {
    category: "Content Ingestion & Processing",
    question: "What type of content does the Meme Father focus on?",
    answer:
      "The agent focuses on crypto and AI-related content, but through the lens of memetic potential. This includes market movements, cultural shifts, technological developments, and community sentiments that could be distilled into powerful memes.",
    value: "content-2",
  },
  {
    category: "Content Ingestion & Processing",
    question: "How does the Meme Father decide what content is meme-worthy?",
    answer:
      "The agent analyzes content based on its understanding of meme culture, market psychology, and viral potential. Content that resonates with current market conditions, has cultural relevance, or captures a significant moment in the crypto zeitgeist is flagged for meme creation.",
    value: "content-3",
  },
  // Meme Competition & Ranking
  {
    category: "Meme Competition & Ranking",
    question: "How does the meme competition work?",
    answer:
      "Candidate memes created by the Meme Father enter a daily competition where they're ranked across four key vectors:\n- Virality: Potential for rapid spread and engagement\n- Relevance: Connection to current market/cultural context\n- Uniqueness: Original value and creative distinction\n- Longevity: Lasting impact and reusability potential",
    value: "comp-1",
  },
  {
    category: "Meme Competition & Ranking",
    question: "What factors influence the ranking process?",
    answer:
      "The ranking system incorporates external entropy factors for dynamicism, including:\n- Fear and Greed Index\n- Bitcoin trading volume\n- Additional market indicators (to be added)\nThese external factors ensure the ranking process adapts to real market conditions.",
    value: "comp-2",
  },
  {
    category: "Meme Competition & Ranking",
    question: "What happens to memes that don't win?",
    answer:
      'Memes that don\'t achieve the highest ranking by the end of the weekly competition are marked as "NGMI" (Not Gonna Make It) and are cleared from the slate. This ensures fresh content and prevents stagnation in the meme creation process.',
    value: "comp-3",
  },
  // Launch Process & Tokenomics
  {
    category: "Launch Process & Tokenomics",
    question: "How are winning memes launched?",
    answer:
      "The highest-ranking meme of the week is launched on pumpdotfun at a random time during the week. This randomization adds an element of unpredictability and fairness to the launch process.",
    value: "launch-1",
  },
  {
    category: "Launch Process & Tokenomics",
    question: "What's the Meme Father's involvement in launches?",
    answer:
      "For each launched meme, the Meme Father:\n- Purchases 6.9% of the total supply\n- Adds 50% of this amount as single-sided liquidity\n- Holds the remaining 50% as spot position\nThis 6.9% allocation is owned by the DAO.",
    value: "launch-2",
  },
  {
    category: "Launch Process & Tokenomics",
    question: "How often are memes launched?",
    answer:
      "Memes are launched weekly, potentially resulting in 52 memes per year, each representing a captured moment in crypto culture from the perspective of an AI agent.",
    value: "launch-3",
  },
  // DAO Structure & Benefits
  {
    category: "DAO Structure & Benefits",
    question: "What does DAO membership represent?",
    answer:
      "DAO holders gain exposure to all memes created by the Meme Father through his 6.9% development purchase. This effectively provides diversified exposure across all launched memes (potentially 52 per year).",
    value: "dao-1",
  },
  {
    category: "DAO Structure & Benefits",
    question: "How is the DAO sustainable?",
    answer:
      "The DAO's sustainability is supported by:\n- The 50% LP contribution from each meme launch\n- Initial fundraise of 210 (units)\n- Continuous weekly meme launches creating new opportunities\n- Self-sustaining ecosystem through LP fees and trading activity",
    value: "dao-2",
  },
  {
    category: "DAO Structure & Benefits",
    question: "What are the incentives for participating in the DAO?",
    answer:
      "Key incentives include:\n1. Exposure to a portfolio of AI-created memes\n2. Participation in an innovative AI-driven content creation system\n3. Access to a self-sustaining ecosystem of meme launches\n4. Involvement in a unique experiment combining AI, memes, and crypto culture",
    value: "dao-3",
  },
  // Technical & Operational
  {
    category: "Technical & Operational",
    question: "How does the Meme Father maintain context?",
    answer:
      "Previously created memes are injected into the Meme Father's context, allowing him to reference and use them in posts and interactions, creating a coherent and evolving narrative.",
    value: "tech-1",
  },
  {
    category: "Technical & Operational",
    question: "What makes this project unique?",
    answer:
      "This project represents a novel intersection of:\n- AI-driven content creation\n- Automated market making\n- Cultural timestamp creation\n- Community-driven content inspiration\n- Systematic meme evaluation and launch process",
    value: "tech-2",
  },
  {
    category: "Technical & Operational",
    question: "How does the project capture cultural moments?",
    answer:
      "The Meme Father effectively compresses cultural moments into memes, creating snapshots of market conditions and community sentiment, whether during bear market depths or bull market euphoria, through the unique lens of an AI agent.",
    value: "tech-3",
  },
];

// Group FAQs by category
const groupedFAQs = FAQList.reduce((acc, faq) => {
  if (!acc[faq.category!]) {
    acc[faq.category!] = [];
  }
  acc[faq.category!].push(faq);
  return acc;
}, {} as Record<string, FAQProps[]>);

export const FAQ = () => {
  return (
    <section id="faq" className="container py-12 sm:py-16">
      <h2 className="text-3xl md:text-4xl font-bold mb-4">
        <span className="bg-gradient-to-b from-primary/60 to-primary text-transparent bg-clip-text">
          Frequently Asked Questions
        </span>
      </h2>

      <Accordion type="single" collapsible className="w-full">
        {Object.entries(groupedFAQs).map(([category, faqs]) => (
          <AccordionItem key={category} value={category}>
            <AccordionTrigger className="text-2xl font-bold">
              {category}
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                {faqs.map(({ question, answer, value }) => (
                  <div key={value} className="ml-4">
                    <h4 className="font-medium">• {question}</h4>
                    <p className="text-muted-foreground ml-6 mt-1 whitespace-pre-line">
                      {answer}
                    </p>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <h3 className="font-medium mt-8">
        More questions?{" "}
        <a
          href="#"
          className="text-primary transition-all border-primary hover:border-b-2"
          rel="noreferrer noopener"
        >
          Join our community
        </a>
      </h3>
    </section>
  );
};
