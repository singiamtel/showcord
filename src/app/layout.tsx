import './globals.css';

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className="h-full bg-gray-300">
            <head>
                <link
                    rel="stylesheet"
                    href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/styles/atom-one-dark-reasonable.min.css"
                    integrity="sha512-RwXJS3k4Z0IK6TGoL3pgQlA9g2THFhKL7z9TYWdAI8u6xK0AUuMWieJuWgTRayywC9A94ifUj1RzjDa1NIlUIg=="
                    crossOrigin="anonymous"
                    referrerPolicy="no-referrer"
                />
                <title> PS-Cord </title>
            </head>
            <body className="h-full">{children}</body>
        </html>
    );
}

