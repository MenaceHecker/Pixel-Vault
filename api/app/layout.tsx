import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Pixel Vault",
    description: "Zero-cost photo archival relay",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body style={{ margin: 0, background: "#0a0a0a" }}>{children}</body>
        </html>
    );
}