import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { BarChart3, Users, User } from "lucide-react";

interface DemographicsData {
  niveau_academique: string;
  sexe: string;
}

interface DemographicsTableProps {
  data: DemographicsData[];
}

export default function DemographicsTable({ data }: DemographicsTableProps) {
  // Group by niveau_academique
  const demographics = data.reduce((acc: Record<string, { garcons: number; filles: number; total: number }>, seminariste) => {
    const niveau = seminariste.niveau_academique || 'Non classé';
    if (!acc[niveau]) {
      acc[niveau] = { garcons: 0, filles: 0, total: 0 };
    }
    if (seminariste.sexe === 'M') {
      acc[niveau].garcons += 1;
    } else if (seminariste.sexe === 'F') {
      acc[niveau].filles += 1;
    }
    acc[niveau].total += 1;
    return acc;
  }, {});

  const demographicsArray = Object.entries(demographics)
    .map(([niveau, counts]) => ({
      niveau,
      garcons: counts.garcons,
      filles: counts.filles,
      total: counts.total,
    }))
    .sort((a, b) => b.total - a.total);

  // Max values pour normalisation
  const maxGarcons = Math.max(...demographicsArray.map(d => d.garcons), 1);
  const maxFilles = Math.max(...demographicsArray.map(d => d.filles), 1);
  const maxTotal = Math.max(...demographicsArray.map(d => d.total), 1);
  const totalSeminaristes = demographicsArray.reduce((sum, d) => sum + d.total, 0);

  const getNiveauColor = (niveau: string, type: 'garcons' | 'filles' | 'total') => {
    const baseColors = {
      'Universitaire': type === 'garcons' ? 'blue' : type === 'filles' ? 'pink' : 'emerald',
      'Supérieur': type === 'garcons' ? 'indigo' : type === 'filles' ? 'rose' : 'purple',
      'Secondaire': type === 'garcons' ? 'sky' : type === 'filles' ? 'violet' : 'blue',
      'Primaire': type === 'garcons' ? 'cyan' : type === 'filles' ? 'fuchsia' : 'orange',
      'Non classé': type === 'garcons' ? 'slate' : type === 'filles' ? 'stone' : 'gray',
    };
    return baseColors[niveau as keyof typeof baseColors] || 'gray';
  };

  return (
    <Card className="border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Démographie</CardTitle>
        </div>
        <Button variant="outline" size="sm" className="gap-2 h-9">
          <Download className="h-4 w-4" />
          Exporter
        </Button>
      </CardHeader>
      
      <CardContent className="space-y-8">
       
        {/* STATS GLOBALES + RÉSUMÉ */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6  pt-6 border-t p-6 bg-gradient-to-br from-muted/50 rounded-xl">
          <div className="text-center">
            <div className="text-3xl font-black text-blue-600 mb-1">{demographicsArray.reduce((sum, d) => sum + d.garcons, 0)}</div>
            <div className="text-sm font-semibold text-blue-700">Garçons</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-black text-pink-500 mb-1">{demographicsArray.reduce((sum, d) => sum + d.filles, 0)}</div>
            <div className="text-sm font-semibold text-pink-700">Filles</div>
          </div>
          <div className="text-center border-l lg:border-l-0">
            <div className="text-3xl font-black text-foreground mb-1">{totalSeminaristes}</div>
            <div className="text-sm font-semibold text-muted-foreground">Total</div>
          </div>
          
        </div>

        {/* TABLEAU RÉCAP COMPACT */}
        <div className="overflow-x-auto border-t pt-6">
          <div className="min-w-[450px]">
            <div className="grid grid-cols-[160px_repeat(3,_minmax(80px,1fr))] gap-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide pb-3 border-b">
              <div>Niveau</div>
              <div className="text-center">Garçons</div>
              <div className="text-center">Filles</div>
              <div className="text-center">Total</div>
            </div>
            {demographicsArray.map((row, index) => (
              <div key={index} className="grid grid-cols-[160px_repeat(3,_minmax(80px,1fr))] gap-4 py-3 items-center border-b last:border-b-0">
                <div className="font-semibold text-sm capitalize truncate pr-4" title={row.niveau}>
                  {row.niveau}
                </div>
                <div className="text-center font-bold text-blue-600 text-base">{row.garcons}</div>
                <div className="text-center font-bold text-pink-500 text-base">{row.filles}</div>
                <div className="text-center font-black text-lg text-foreground">{row.total}</div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
