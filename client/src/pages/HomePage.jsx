import Hero from "../sections/Hero";
import About from "../sections/About";
import FlashSale from "../sections/FlashSale";
import MenuTeaser from "../sections/MenuTeaser";
import SpacesTeaser from "../sections/SpacesTeaser";
import Testimonials from "../sections/Testimonials";
import GalleryTeaser from "../sections/GalleryTeaser";
import Contact from "../sections/Contact";
import AccountPopup from "../components/AccountPopup";

export default function HomePage({ config }) {
  return (
    <>
      <Hero config={config} />
      <FlashSale />
      <About config={config} />
      <MenuTeaser />
      <SpacesTeaser />
      <Testimonials />
      <GalleryTeaser />
      <Contact config={config} />
      <AccountPopup config={config} />
    </>
  );
}
