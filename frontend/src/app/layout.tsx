import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'CorVita // RPG Cardiovascular Risk & Coronary Stenosis Customizer',
  description:
    'A cinematic RPG character-customization style medical risk simulator powered by the Z-Alizadeh Sani clinical dataset with interactive 3D WebGL heart models, real-time hemodynamic telemetry, and coronary stenosis prediction.',
  keywords: [
    'cardiovascular risk prediction',
    'Z-Alizadeh Sani dataset',
    '3D heart model',
    'Three.js',
    'coronary artery disease',
    'medical simulator',
    'RPG character customizer',
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100">{children}</body>
    </html>
  );
}
