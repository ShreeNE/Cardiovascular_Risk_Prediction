import type { Metadata } from 'next';
import { Geist, Geist_Mono, Cinzel } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const cinzel = Cinzel({
  variable: '--font-cinzel',
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'Coronary Assessment Simulator // Z-Alizadeh Sani Cohort Analysis',
  description:
    'A clinical cardiovascular risk assessment simulator powered by machine learning and interactive 3D anatomical coronary visualization.',
  keywords: [
    'cardiovascular risk prediction',
    'Z-Alizadeh Sani dataset',
    'coronary artery disease',
    '3D heart model',
    'clinical simulator',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${cinzel.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#05080D] text-[#E8EDF3] selection:bg-[#F04452]/30 selection:text-white">
        {children}
      </body>
    </html>
  );
}

