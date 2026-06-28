import type { ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import FloatingWhatsApp from "./FloatingWhatsApp";
import PageTransition from "./PageTransition";
import CustomCursor from "./CustomCursor";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <main className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <CustomCursor />
      <Navbar />
      <PageTransition>
        {children}
      </PageTransition>
      <Footer />
      <FloatingWhatsApp />
    </main>
  );
};

export default Layout;
