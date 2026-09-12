import { HomeHero, PurposeBand } from "@/components/home/hero";
import {
  EditionBlock,
  ExperiencePreview,
  HomeRsvp,
  InsightPreview,
  MinistersPreview,
  SoundRisingSection,
  VolunteerCall,
} from "@/components/home/sections";

export default function HomePage() {
  return (
    <main>
      <HomeHero />
      <PurposeBand />
      <SoundRisingSection />
      <EditionBlock />
      <MinistersPreview />
      <ExperiencePreview />
      <VolunteerCall />
      <InsightPreview />
      <HomeRsvp />
    </main>
  );
}

