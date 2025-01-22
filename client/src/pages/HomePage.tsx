import { About } from "@/components/About";
import { FAQ } from "@/components/FAQ";
import { Hero } from "@/components/Hero";
import { Process } from "@/components/Process";
import { DaoBenefits } from "@/components/Dao";
import { Sponsors } from "@/components/Sponsors";
import { TwitterPosts } from "@/components/TwitterPosts";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Sponsors />
      <About />
      <Process />
      <DaoBenefits />
      <TwitterPosts />
      <FAQ />
    </>
  );
}