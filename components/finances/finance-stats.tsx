import { Card, CardContent } from "@/components/ui/card";
import { ArrowDownRight, ArrowUpRight, Wallet } from "lucide-react";

interface FinanceStatsProps {
  totalEntrees: number;
  totalSorties: number;
  soldePeriode: number;
}

export function FinanceStats({ totalEntrees, totalSorties, soldePeriode }: FinanceStatsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
    }).format(amount);
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <p className="text-sm font-medium text-muted-foreground">Total Entrées</p>
            <ArrowDownRight className="h-4 w-4 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-green-600">{formatCurrency(totalEntrees)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Revenus enregistrés sur la période
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <p className="text-sm font-medium text-muted-foreground">Total Sorties</p>
            <ArrowUpRight className="h-4 w-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-red-600">{formatCurrency(totalSorties)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Dépenses enregistrées sur la période
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <p className="text-sm font-medium text-muted-foreground">Solde Période</p>
            <Wallet className="h-4 w-4 text-primary" />
          </div>
          <div className={`text-2xl font-bold ${soldePeriode >= 0 ? "text-primary" : "text-red-600"}`}>
            {formatCurrency(soldePeriode)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Différence Entrées - Sorties
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
