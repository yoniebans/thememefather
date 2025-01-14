import { About } from "./components/About";
import { FAQ } from "./components/FAQ";
import { Footer } from "./components/Footer";
import { Hero } from "./components/Hero";
import { Process } from "./components/Process";
import { Navbar } from "./components/Navbar";
import { ScrollToTop } from "./components/ScrollToTop";
import { DaoBenefits } from "./components/Dao";
import { Sponsors } from "./components/Sponsors";
import { TwitterPosts } from "./components/TwitterPosts";
import "./App.css";

function App() {
  return (
    <>
      <Navbar />
      <Hero />
      <Sponsors />
      <About />
      <Process />
      <DaoBenefits />
      <TwitterPosts />
      <FAQ />
      <Footer />
      <ScrollToTop />
    </>
  );
}

export default App;
