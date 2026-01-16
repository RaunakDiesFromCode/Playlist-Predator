import { Heart } from "lucide-react";
import Link from "next/link";
import React from "react";

const Footer = () => {
    return (
        <footer className="flex flex-col items-center justify-center w-full md:text-sm">
            <Link
                href="https://github.com/RaunakDiesFromCode"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 mb-2"
            >
                <span>Made with</span>
                <span className="scale-100 md:scale-75">
                    <Heart color="red" opacity={0.7} />
                </span>
                <span>by Raunak Manna</span>
            </Link>
            <div className="text-sm md:text-xs text-center opacity-75">
                <div>Motivation by &quot;caps&quot;</div>
                <div>Fueled by &quot;yeah yeah&quot;</div>
            </div>
        </footer>
    );
};

export default Footer;
