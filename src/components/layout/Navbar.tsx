import Image from "next/image"; // Import the Image component from Next.js

import { GithubIcon } from "lucide-react";
import ThemeToggle from "../ThemeToggle";

const Navbar = () => {
  return (
    <nav className="flex justify-between items-center p-4 bg-white dark:bg-gray-900 shadow-md">
      {/* Logo */}
      <div className="flex items-center space-x-2">
        <Image
          src="/logo.gif"
          alt="Logo"
          width={64}
          height={64}
          className="h-auto"
        />
        <h1 className=" bg-white dark:bg-gray-900 text-gray-600 dark:text-white text-xl">
          Playlist Predator
        </h1>
      </div>

      <div className="flex items-center space-x-4">
        <ThemeToggle />
        <a
          href="https://github.com/Aymaan-Shabbir"
          target="_blank"
          rel="noopener noreferrer"
        >
          <GithubIcon className="text-gray-600 dark:text-white" size={24} />
        </a>
      </div>
    </nav>
  );
};

export default Navbar;
