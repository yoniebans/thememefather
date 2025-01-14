import fontboltLogo from "../assets/fontbolt.png";

export const Footer = () => {
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
            <a
              rel="noreferrer noopener"
              href="https://thememefather.com/office"
              target="_blank"
              className="opacity-60 hover:opacity-100"
            >
              Web
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

        <div className="flex flex-col gap-1 xl:col-span-1 xl:col-start-8">
          <h3 className="font-bold text-base mb-1">About</h3>
          <div>
            <a
              rel="noreferrer noopener"
              href="#"
              className="opacity-60 hover:opacity-100"
            >
              DAO
            </a>
          </div>

          <div>
            <a
              rel="noreferrer noopener"
              href="#"
              className="opacity-60 hover:opacity-100"
            >
              Tokenomics
            </a>
          </div>

          <div>
            <a
              rel="noreferrer noopener"
              href="#"
              className="opacity-60 hover:opacity-100"
            >
              FAQ
            </a>
          </div>
        </div>
      </section>

      <section className="container pb-8 text-center">
        <h3>&copy; 2024 thememefather</h3>
      </section>
    </footer>
  );
};
