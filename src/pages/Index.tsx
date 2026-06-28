import SEOHead from "@/components/SEOHead";
import Layout from "@/components/Layout";
import Hero from "@/components/Hero";
import About from "@/components/About";
import PackagesPreview from "@/components/PackagesPreview";
import TestimoniPreview from "@/components/TestimoniPreview";
import Community from "@/components/Community";
import ClosingCTA from "@/components/ClosingCTA";

const Index = () => {
  return (
    <Layout>
      <SEOHead
        title="IPAN STORE | Jasa Optimasi PC Gaming & Boost FPS Free Fire"
        description="IPAN STORE menyediakan jasa optimasi PC gaming, tweaking Windows, dan boost FPS Free Fire agar gameplay terasa lebih ringan, stabil, dan nyaman."
      />
      <Hero />
      <About />
      <PackagesPreview />
      <TestimoniPreview />
      <Community />
      <ClosingCTA />
    </Layout>
  );
};

export default Index;
