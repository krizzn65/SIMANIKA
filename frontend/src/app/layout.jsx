import "./globals.css";

export const metadata = {
  title: "SIMANIKA — Himpunan Mahasiswa Informatika",
  description:
    "Ruang tumbuh, berkarya, dan berkolaborasi bagi mahasiswa Informatika.",
  icons: {
    icon: [
      {
        url: "/images/logos/Logo MIF 2020.png",
        type: "image/png",
      },
    ],
    shortcut: "/images/logos/Logo MIF 2020.png",
    apple: "/images/logos/Logo MIF 2020.png",
  },
};

export const viewport = {
  themeColor: "#f4f7fb",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        {children}
      </body>
    </html>
  );
}
