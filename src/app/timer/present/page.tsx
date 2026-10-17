import { TimerPresentScreen } from "@/components/timer/present-screen";

export default async function TimerPresentPage({ searchParams }: { searchParams: Promise<{ session?: string }> }) {
  const params = await searchParams;
  return <TimerPresentScreen publicCode={params.session ?? ""} />;
}
