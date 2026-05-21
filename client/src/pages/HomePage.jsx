import Hero from "../sections/Hero";
import About from "../sections/About";
import MenuTeaser from "../sections/MenuTeaser";
import SpacesTeaser from "../sections/SpacesTeaser";
import GalleryTeaser from "../sections/GalleryTeaser";
import Contact from "../sections/Contact";

export default function HomePage({ config }) {
  return (
    <>
      <Hero config={config} />
      <About config={config} />
      <MenuTeaser />
      <SpacesTeaser />
      <GalleryTeaser />
      <Contact config={config} />
    </>
  );
}
