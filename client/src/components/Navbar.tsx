import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { GitHubLogoIcon } from "@radix-ui/react-icons";
import { buttonVariants } from "./ui/button";
import { Menu } from "lucide-react";
import fontboltLogo from "../assets/fontbolt.png";

interface RouteProps {
  href: string;
  label: string;
  type: 'section' | 'page';
  desktopOnly?: boolean;
}

const routeList: RouteProps[] = [
  {
    href: "#about",
    label: "Agent",
    type: 'section'
  },
  {
    href: "#process",
    label: "Process",
    type: 'section'
  },
  {
    href: "#dao",
    label: "DAO",
    type: 'section'
  },
  {
    href: "#faq",
    label: "FAQ",
    type: 'section'
  },
  {
    href: "/console",
    label: "Console",
    type: 'page',
    desktopOnly: true
  },
  {
    href: "/kitchen",
    label: "Kitchen",
    type: 'page'
  },
  {
    href: "/vault",
    label: "Vault",
    type: 'page'
  }
];

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // 768px is the md breakpoint in Tailwind
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const renderNavItem = ({ href, label, type, desktopOnly }: RouteProps) => {
    // Skip rendering if it's desktop-only and we're on mobile
    if (desktopOnly && isMobile) {
      return null;
    }

    // For section links when not on homepage, prefix with '/'
    if (!isHomePage && type === 'section') {
      return (
        <Link
          key={label}
          to={`/${href}`}
          className={buttonVariants({ variant: "ghost" })}
          onClick={() => setIsOpen(false)}
        >
          {label}
        </Link>
      );
    }

    // For section links on homepage or regular page links
    return type === 'section' ? (
      <a
        key={label}
        href={href}
        className={buttonVariants({ variant: "ghost" })}
        onClick={() => setIsOpen(false)}
      >
        {label}
      </a>
    ) : (
      <Link
        key={label}
        to={href}
        className={buttonVariants({ variant: "ghost" })}
        onClick={() => setIsOpen(false)}
      >
        {label}
      </Link>
    );
  };

  return (
    <header className="sticky border-b-[1px] top-0 z-40 w-full bg-background">
      <NavigationMenu className="mx-auto">
        <NavigationMenuList className="container h-14 px-4 w-screen flex justify-between">
          <NavigationMenuItem className="font-bold flex">
            <Link
              to="/"
              className="flex items-center gap-2"
            >
              <img src={fontboltLogo} alt="The Meme Father" className="h-8" />
            </Link>
          </NavigationMenuItem>

          {/* mobile */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger className="px-2 md:hidden">
              <Menu className="h-5 w-5" onClick={() => setIsOpen(true)}>
                <span className="sr-only">Menu Icon</span>
              </Menu>
            </SheetTrigger>

            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle className="font-bold text-xl">
                  <img
                    src={fontboltLogo}
                    alt="The Meme Father"
                    className="h-8"
                  />
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col justify-center items-center gap-2 mt-4">
                {routeList.map((route) => renderNavItem(route))}
                <a
                  href="https://github.com/yoniebans/thememefather"
                  target="_blank"
                  rel="noreferrer noopener"
                  className={`w-[110px] border ${buttonVariants({
                    variant: "secondary",
                  })}`}
                >
                  <GitHubLogoIcon className="mr-2 w-5 h-5" />
                  Github
                </a>
              </nav>
            </SheetContent>
          </Sheet>

          {/* desktop */}
          <nav className="hidden md:flex gap-2">
            {routeList.map((route) => renderNavItem(route))}
          </nav>

          <div className="hidden md:flex">
            <a
              href="https://github.com/yoniebans/thememefather"
              target="_blank"
              rel="noreferrer noopener"
              className={`border ${buttonVariants({ variant: "secondary" })}`}
            >
              <GitHubLogoIcon className="mr-2 w-5 h-5" />
              Github
            </a>
          </div>
        </NavigationMenuList>
      </NavigationMenu>
    </header>
  );
};