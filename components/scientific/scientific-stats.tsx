"use client";

import { BookOpen, GraduationCap, Users } from "lucide-react";

import { StatCard, StatGrid, StatGridSkeleton } from "@/components/common/stat-card";
import { ErrorState, errorText } from "@/components/common/states";
import { useRemoteData } from "@/hooks/use-remote-data";
import { scientificApi } from "@/lib/api";

interface ScientificStatsData {
  total_seminaristes: number;
  total_notes: number;
  moyenne_generale: number;
}

const n = (value: number | undefined) => (value ?? 0).toLocaleString("fr-FR");

/** Indicateurs de la commission scientifique (GET /scientific/stats/scientifiques). */
export default function ScientificStats() {
  const { data, error, loading, reload } = useRemoteData(scientificApi.getScientificStats);
  const stats = data as ScientificStatsData | undefined;

  if (error) return <ErrorState message={errorText(error, "Indicateurs indisponibles.")} onRetry={reload} />;
  if (loading && !stats) return <StatGridSkeleton count={3} />;

  return (
    <StatGrid label="Indicateurs scientifiques" className="xl:grid-cols-3">
      <StatCard label="Séminaristes" value={n(stats?.total_seminaristes)} icon={Users} />
      <StatCard label="Notes saisies" value={n(stats?.total_notes)} icon={BookOpen} />
      <StatCard
        label="Moyenne générale"
        value={stats?.moyenne_generale ? stats.moyenne_generale.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"}
        hint="Sur 20"
        icon={GraduationCap}
        tone="brand"
      />
    </StatGrid>
  );
}
