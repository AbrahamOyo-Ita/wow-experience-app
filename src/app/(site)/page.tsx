import { HomeHero, PurposeBand } from "@/components/home/hero";
import {
  EditionBlock,
  ExperiencePreview,
  HomeRsvp,
  InsightPreview,
  MinistersPreview,
  VolunteerCall,
} from "@/components/home/sections";

export default function HomePage() {
  return (
    <main>
      <HomeHero />
      <PurposeBand />
      <EditionBlock />
      <MinistersPreview />
      <ExperiencePreview />
      <VolunteerCall />
      <InsightPreview />
      <HomeRsvp />
    </main>
  );
}
