import { HomeHero, PurposeBand } from "@/components/home/hero";
import {
  EditionBlock,
  ExperiencePreview,
  FlyerPromoSection,
  HomeRsvp,
  InsightPreview,
  MerchPromo,
  MinistersPreview,
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
      <MinistersPreview />
      <ExperiencePreview />
      <VolunteerCall />
      <SupportSection />
      <InsightPreview />
      <HomeRsvp />
    </main>
  );
}
