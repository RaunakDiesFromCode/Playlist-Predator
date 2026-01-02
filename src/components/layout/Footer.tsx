import { CloudLightning } from "lucide-react";
import Link from "next/link";
import React from "react";

const Footer = () => {
    return (
        <footer className=" bottom-0 left-0 right-0 border-t p-2 flex flex-col items-center justify-center">
            <Link
                href="https://github.com/Aymaan-Shabbir"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 mb-2"
            >
                <span>Made with</span>
                <CloudLightning size={24} />
                <span>by Aymaan Shabbir</span>
            </Link>
            <div>Fueled by &quot;yeah yeah&quot;</div>
        </footer>
    );
};

export default Footer;
