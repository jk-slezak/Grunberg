import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Providers } from "./providers";
import "@/index.css";
import "@/App.css";

export const metadata: Metadata = {
  title: "Grunberg",
  description: "A browser-based text RPG dungeon crawler.",
};

const RootLayout = ({ children }: { children: ReactNode }) => (
  <html lang="en">
    <body>
      <div id="root">
        <Providers>{children}</Providers>
      </div>
    </body>
  </html>
);

export default RootLayout;
