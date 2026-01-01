import Navbar from "@/components/layout/Navbar";
import PlaylistForm from "@/components/playlist/PlaylistForm"; // PlaylistForm component
import { CloudLightning } from "lucide-react";
const Home = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      <Navbar />
      <div className="flex-grow max-w-lg mx-auto p-6">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-900 dark:text-white">
          Eye of Agomoto
        </h1>
        <p className="text-center text-gray-400 dark:text-gray-300 text-sm sm:text-base md:text-sm leading-relaxed my-4">
          Some features were added under the visionary directive of “yeah yeah”.
        </p>

        <PlaylistForm />
      </div>

      {/* Footer */}
      <footer className=" bg-red-200 dark:bg-gray-900 text-gray-600 dark:text-white py-4 text-center">
        <a
          href="https://github.com/Aymaan-Shabbir"
          className="flex items-center justify-center space-x-2"
        >
          <p className="text-sm">Made with</p>
          <CloudLightning
            className="text-gray-600 dark:text-white "
            size={24}
          />
          <p className="text-sm">by Aymaan Shabbir</p>
        </a>
        <p className="text-sm">Fueled by “yeah yeah”</p>
      </footer>
    </div>
  );
};

export default Home;
