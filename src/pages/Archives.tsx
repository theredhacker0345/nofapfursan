import { Screen, SectionHead } from "@/components/Screen";
import { StatsCard } from "@/components/StatsCard";
import { MotivationCard } from "@/components/MotivationCard";
import { ActivityHistory } from "@/components/ActivityHistory";
import { ActivityHeatmap } from "@/components/DynamicComponents";
import { EmptyState } from "@/components/EmptyState";
import { useStreak } from "@/hooks/useStreak";
import { Shield } from "lucide-react";

export default function Archives() {
  const { streakData } = useStreak();
  const isActive = !!streakData.startDate;

  return (
    <Screen title="History" subtitle="Everything you have recorded" back>
      <SectionHead>Record</SectionHead>
      {isActive ? (
        <StatsCard data={streakData} />
      ) : (
        <EmptyState
          icon={<Shield className="h-7 w-7" aria-hidden="true" />}
          title="No streak yet"
          description="Start your first streak to build a record you can review here."
          className="my-2"
        />
      )}

      <SectionHead>Consistency</SectionHead>
      {isActive ? <ActivityHeatmap /> : (
        <EmptyState
          icon={<Shield className="h-7 w-7" aria-hidden="true" />}
          title="No check-ins yet"
          description="Daily check-ins appear here once you begin."
          className="my-2"
        />
      )}

      <SectionHead>Wisdom</SectionHead>
      <MotivationCard />

      <SectionHead>Timeline</SectionHead>
      <ActivityHistory />
    </Screen>
  );
}