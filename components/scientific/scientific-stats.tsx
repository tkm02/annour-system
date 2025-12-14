"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { GraduationCap, Users, BookOpen, Award } from "lucide-react";
import { scientificApi } from "@/lib/api";

interface ScientificStatsData {
  total_seminaristes: number;
  // total_matieres: number;
  total_notes: number;
  moyenne_generale: number;
}

export default function ScientificStats() {
  const [stats, setStats] = useState<ScientificStatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await scientificApi.getScientificStats();
      setStats(data as ScientificStatsData);
    } catch (error) {
      console.error("Erreur stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Séminaristes",
      value: stats?.total_seminaristes?.toString().padStart(3, "0") || "000",
      icon: Users,
      color: "text-primary",
    },
    {
      title: "Notes Saisies",
      value: stats?.total_notes?.toString().padStart(3, "0") || "000",
      icon: BookOpen,
      color: "text-secondary",
    },
    // {
    //   title: "Matières",
    //   value: stats?.total_matieres?.toString().padStart(3, "0") || "000",
    //   icon: Award,
    //   color: "text-accent",
    // },
    {
      title: "Moyenne Générale",
      value: stats?.moyenne_generale ? `${stats.moyenne_generale.toFixed(2)}` : "00.00",
      icon: GraduationCap,
      color: "text-destructive",
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array(4).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, index) => (
        <Card key={index} className="border-border hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stat.color}`}>
              {stat.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
