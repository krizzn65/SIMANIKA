import { ScrollReset } from "@/components/layout/ScrollReset";
import { SessionTimeoutModal } from "@/components/auth/SessionTimeoutModal";
import { DevNotice } from "@/components/layout/DevNotice";
import { MaintenanceGate } from "@/components/layout/MaintenanceGate";
import { motionBootScript, motionCssVars } from "@/lib/motion";
import "./globals.css";

export const metadata = {
  title: "SIMANIKA",
  description:
    "Ruang tumbuh, berkarya, dan berkolaborasi bagi mahasiswa Informatika.",
  icons: {
    icon: [
      {
        url: "/images/logos/logo-mif-256.png",
        type: "image/png",
      },
    ],
    shortcut: "/images/logos/logo-mif-256.png",
    apple: "/images/logos/logo-mif-256.png",
  },
};

export const viewport = {
  themeColor: "#f4f7fb",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{ __html: motionCssVars }} />
        <script dangerouslySetInnerHTML={{ __html: motionBootScript }} />
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if('scrollRestoration' in history){history.scrollRestoration='manual';}}catch(e){}",
          }}
        />
      </head>
      <body>
        <ScrollReset />
        <MaintenanceGate>{children}</MaintenanceGate>
        <SessionTimeoutModal />
        <DevNotice />
      </body>
    </html>
  );
}
