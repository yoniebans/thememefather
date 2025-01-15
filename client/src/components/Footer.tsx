import fontboltLogo from "../assets/fontbolt.png";
import { Link, useNavigate } from "react-router-dom";

export const Footer = () => {
  const navigate = useNavigate();

  const handleSectionClick = (href: string) => {
    navigate('/', { replace: true });
    setTimeout(() => {
      const element = document.querySelector(href);
      element?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <footer id="footer">
      <hr className="w-11/12 mx-auto" />

      <section className="container py-6 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-8 gap-x-4 gap-y-6">
        <div className="col-span-full xl:col-span-4">
          <a
            rel="noreferrer noopener"
            href="/"
            className="font-bold text-xl flex items-center gap-2"
          >
            <img src={fontboltLogo} alt="The Meme Father" className="h-8" />
          </a>
        </div>

        <div className="flex flex-col gap-1 xl:col-span-1 xl:col-start-6">
          <h3 className="font-bold text-base mb-1">Follow Us</h3>
          <div>
            <a
              rel="noreferrer noopener"
              href="https://github.com/yoniebans/thememefather"
              target="_blank"
              className="opacity-60 hover:opacity-100"
            >
              Github
            </a>
          </div>

          <div>
            <a
              rel="noreferrer noopener"
              href="https://x.com/the_meme_father"
              target="_blank"
              className="opacity-60 hover:opacity-100"
            >
              Twitter
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-1 xl:col-span-1 xl:col-start-7">
          <h3 className="font-bold text-base mb-1">Interaction</h3>
          <div>
            <Link
              to="/console"
              className="opacity-60 hover:opacity-100"
            >
              Web
            </Link>
          </div>

          <div>
            <a
              rel="noreferrer noopener"
              href="https://x.com/the_meme_father"
              target="_blank"
              className="opacity-60 hover:opacity-100"
            >
              Twitter
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-1 xl:col-span-1 xl:col-start-8">
          <h3 className="font-bold text-base mb-1">About</h3>
          <div>
            <button
              onClick={() => handleSectionClick('#about')}
              className="opacity-60 hover:opacity-100"
            >
              Agent
            </button>
          </div>
          <div>
            <button
              onClick={() => handleSectionClick('#process')}
              className="opacity-60 hover:opacity-100"
            >
              Process
            </button>
          </div>

          <div>
            <button
              onClick={() => handleSectionClick('#dao')}
              className="opacity-60 hover:opacity-100"
            >
              DAO
            </button>
          </div>

          <div>
            <button
              onClick={() => handleSectionClick('#faq')}
              className="opacity-60 hover:opacity-100"
            >
              FAQ
            </button>
          </div>
        </div>
      </section>

      <section className="container pb-8">
        <p className="text-sm opacity-60">&copy; 2025 thememefather</p>
      </section>
    </footer>
  );
};
