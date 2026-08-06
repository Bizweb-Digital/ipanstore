import SEOHead from "@/components/SEOHead";
import Layout from "@/components/Layout";
import Hero from "@/components/Hero";
import About from "@/components/About";
import PackagesPreview from "@/components/PackagesPreview";
import CatalogAppSettinx from "@/components/CatalogAppSettinx";
import TestimoniPreview from "@/components/TestimoniPreview";
import Community from "@/components/Community";
import ClosingCTA from "@/components/ClosingCTA";

const Index = () => {
  return (
    <Layout>
      <SEOHead
        title="IPAN STORE | Jasa Optimasi PC Gaming & Boost FPS Free Fire"
        description="IPAN STORE adalah jasa optimasi PC gaming, tweak Windows, dan boost FPS Free Fire #1 di Indonesia. Tersedia juga IPAN APP SettinX - aplikasi tweak premium lisensi lifetime Rp 75.000."
        keywords="jasa optimasi PC, boost FPS Free Fire, tweak emulator, IPAN APP SettinX, gaming optimizer Indonesia"
      />
      <Hero />
      <About />
      <PackagesPreview />
      <CatalogAppSettinx />
      <TestimoniPreview />
      <Community />
      <ClosingCTA />
    </Layout>
  );
};

export default Index;
