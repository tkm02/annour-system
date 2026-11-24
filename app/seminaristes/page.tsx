"use client";

import DashboardLayout from "@/components/layout/dashboard-layout";
import SeminaristesTable from "@/components/seminaristes/seminaristes-table";
import { Card, CardContent } from "@/components/ui/card";
import { scientificApi, Seminariste } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function SeminaristesPage() {
  const [seminaristes, setSeminaristes] = useState<Seminariste[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // ✅ FETCH SÉMINARISTES
  const fetchSeminaristes = async () => {
    try {
      setLoading(true);
      const response = await scientificApi.getSeminaristes(1, 10000);
      
      setSeminaristes(response.data);
      setTotal(response.total);
    } catch (error: any) {
      console.error("❌ Erreur fetch séminaristes:", error);
      toast.error(error.message || "Erreur chargement séminaristes");
    } finally {
      setLoading(false);
    }
  };

  // ✅ FETCH INITIAL
  useEffect(() => {
    fetchSeminaristes();
  }, []);

  // ✅ REFRESH
  const handleRefresh = () => {
    scientificApi.invalidateCache();
    fetchSeminaristes();
    toast.success("Liste actualisée");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ✅ HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">SÉMINARISTES</h1>
            <p className="text-muted-foreground">
              Gestion des séminaristes du séminaire An-Nour
            </p>
          </div>
        </div>

        {/* ✅ LOADING STATE */}
        {loading ? (
          <Card>
            <CardContent className="p-12">
              <div className="flex flex-col items-center justify-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <div className="text-lg font-semibold">Chargement des séminaristes...</div>
                <p className="text-sm text-muted-foreground">Veuillez patienter</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* ✅ TABLE AVEC DONNÉES */
          <SeminaristesTable
            seminaristes={seminaristes}
            total={total}
            onRefresh={handleRefresh}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
