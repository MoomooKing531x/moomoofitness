import "./globals.css";

export const metadata = {
  title: "MoomooFitness",
  description: "Track your fitness. Earn rewards. Compete with friends.",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className="min-h-screen bg-white text-gray-900">{children}</body>
    </html>
  );
}
