"use client";

import { FinanceStats } from "@/components/finances/finance-stats";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { TransactionsTable } from "@/components/finances/transactions-table";
import { authApi, financesApi, FinanceTransaction } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function FinancesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    transactions: FinanceTransaction[];
    totalEntrees: number;
    totalSorties: number;
    soldePeriode: number;
  }>({
    transactions: [],
    totalEntrees: 0,
    totalSorties: 0,
    soldePeriode: 0,
  });

  useEffect(() => {
    checkPermissionAndFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkPermissionAndFetch = async () => {
    try {
      const user = authApi.getCurrentUser();

      const role = user?.role?.toUpperCase();
      if (
        !user ||
        (role !== "ADMINISTRATION" && role !== "FINANCE" && role !== "ADMIN")
      ) {
        toast.error(
          "Accès non autorisé : Réservé aux administrateurs ou au service finance."
        );
        router.push("/");
        return; // ✅ important
      }

      setLoading(true);

      console.log("🔎 Chargement des transactions financières...");
      const response = await financesApi.getTransactions(1, 100);

      console.log("✅ FinanceResponse:", response);

      setData({
        transactions: response.data,
        totalEntrees: response.total_entrees,
        totalSorties: response.total_sorties,
        soldePeriode: response.solde_periode,
      });
    } catch (error) {
      console.error("❌ Erreur finances:", error);
      toast.error("Impossible de charger les données financières.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          <div className="h-8 w-64 bg-muted rounded animate-pulse" />
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
          <div className="h-96 bg-muted rounded-xl animate-pulse" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Finances & Trésorerie
          </h1>
          <p className="text-muted-foreground">
            Suivi des entrées, sorties et de la balance financière.
          </p>
        </div>

        <FinanceStats
          totalEntrees={data.totalEntrees}
          totalSorties={data.totalSorties}
          soldePeriode={data.soldePeriode}
        />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight">
              Transactions Récentes
            </h2>
          </div>
          <TransactionsTable
            transactions={data.transactions}
            isLoading={loading}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
