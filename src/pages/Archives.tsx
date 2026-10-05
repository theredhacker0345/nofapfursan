import { Screen, SectionHead } from "@/components/Screen";
import { StatsCard } from "@/components/StatsCard";
import { MotivationCard } from "@/components/MotivationCard";
import { ActivityHistory } from "@/components/ActivityHistory";
import { ActivityHeatmap } from "@/components/DynamicComponents";
import { useStreak } from "@/hooks/useStreak";

export default function Archives() {
  const { streakData } = useStreak();

  return (
    <Screen title="History" subtitle="Everything you have recorded" back>
      <SectionHead>Record</SectionHead>
      <StatsCard data={streakData} />

      <SectionHead>Consistency</SectionHead>
      <ActivityHeatmap />

      <SectionHead>Wisdom</SectionHead>
      <MotivationCard />

      <SectionHead>Timeline</SectionHead>
      <ActivityHistory />
    </Screen>
  );
}