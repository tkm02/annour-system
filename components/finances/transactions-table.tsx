"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FinanceTransaction } from "@/lib/api";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

interface TransactionsTableProps {
  transactions: FinanceTransaction[];
  isLoading: boolean;
}

export function TransactionsTable({ transactions, isLoading }: TransactionsTableProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-full bg-muted rounded animate-pulse" />
        <div className="space-y-2">
            {Array(5).fill(0).map((_, i) => (
                <div key={i} className="h-12 w-full bg-muted rounded animate-pulse" />
            ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Catégorie</TableHead>
            <TableHead>Libellé</TableHead>
            <TableHead>Tiers</TableHead>
            <TableHead className="text-right">Montant</TableHead>
            <TableHead className="text-right">Statut</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                Aucune transaction trouvée.
              </TableCell>
            </TableRow>
          ) : (
            transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell className="font-medium whitespace-nowrap">
                  {format(new Date(transaction.date_transaction), "dd MMM yyyy", { locale: fr })}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {transaction.type === "ENTREE" ? (
                      <ArrowDownRight className="h-4 w-4 text-green-500" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm font-medium">
                      {transaction.type === "ENTREE" ? "Entrée" : "Sortie"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{transaction.categorie}</Badge>
                </TableCell>
                <TableCell className="max-w-[200px] truncate" title={transaction.libelle}>
                  {transaction.libelle}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {transaction.type === "ENTREE" ? transaction.payeur : transaction.beneficiaire}
                </TableCell>
                <TableCell className={`text-right font-bold ${transaction.type === "ENTREE" ? "text-green-600" : "text-red-600"}`}>
                  {transaction.type === "ENTREE" ? "+" : "-"} {formatCurrency(transaction.montant)}
                </TableCell>
                <TableCell className="text-right">
                  <Badge 
                    className={`${
                        transaction.statut === "VALIDE" 
                        ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-100" 
                        : "bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100"
                    }`}
                  >
                    {transaction.statut}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
