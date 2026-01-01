import { ThemeProvider } from "@/context/theme-context";
import "./globals.css"; // import global styles

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <head />
            <body>
                <ThemeProvider>{children}</ThemeProvider>
            </body>
        </html>
    );
}
