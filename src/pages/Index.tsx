import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import PackagesPreview from "@/components/PackagesPreview";
import Community from "@/components/Community";
import ClosingCTA from "@/components/ClosingCTA";
import Footer from "@/components/Footer";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import PageTransition from "@/components/PageTransition";

const Index = () => {
  return (
    <main className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar />
      <PageTransition>
        <Hero />
        <About />
        <PackagesPreview />
        <Community />
        <ClosingCTA />
      </PageTransition>
      <Footer />
      <FloatingWhatsApp />
    </main>
  );
};

export default Index;
