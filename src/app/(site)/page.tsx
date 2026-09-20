import { HomeHero, PurposeBand } from "@/components/home/hero";
import {
  EditionBlock,
  ExperiencePreview,
  FlyerPromoSection,
  HomeRsvp,
  MerchPromo,
  SoundRisingSection,
  SupportSection,
  VolunteerCall,
} from "@/components/home/sections";

export default function HomePage() {
  return (
    <main>
      <HomeHero />
      <PurposeBand />
      <SoundRisingSection />
      <EditionBlock />
      <FlyerPromoSection />
      <MerchPromo />
      <ExperiencePreview />
      <VolunteerCall />
      <SupportSection />
      <HomeRsvp />
    </main>
  );
}
