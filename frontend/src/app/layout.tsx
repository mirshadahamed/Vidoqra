import type { Metadata } from "next";
import { Instrument_Serif, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: "400",
});

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vidoqra — Your media. Simplified.",
  description: "A simpler way to explore available media formats and manage your downloads. Quiet luxury, Swiss editorial clarity, and cinematic media tools.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${instrumentSerif.variable} ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var stored = localStorage.getItem('vidoqra_theme');
                var isDark = stored === 'dark' || (!stored && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
                if (isDark) {
                  document.documentElement.classList.add('dark');
                  document.documentElement.setAttribute('data-theme', 'dark');
                  document.documentElement.style.colorScheme = 'dark';
                } else {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.setAttribute('data-theme', 'light');
                  document.documentElement.style.colorScheme = 'light';
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-[#F5F4F0] dark:bg-[#111315] text-[#17191C] dark:text-[#F4F4F0] selection:bg-[#526F61]/20 selection:text-[#526F61] dark:selection:bg-[#8BA997]/20 dark:selection:text-[#8BA997] transition-colors duration-200">
        {children}
      </body>
    </html>
  );
}
