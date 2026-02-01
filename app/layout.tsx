import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionHandler } from "@/components/auth/session-handler";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
    title: "Digital Audit System | ISB Инжиниринг",
    description: "Система цифрового аудита технических систем безопасности",
    manifest: "/manifest.json",
    themeColor: "#020617",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ru" className="dark">
            <body className={inter.className}>
                <SessionHandler />
                {children}
            </body>
        </html>
    );
}

