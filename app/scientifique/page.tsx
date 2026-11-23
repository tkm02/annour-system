import DashboardLayout from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/common/page-header"
import ScientificStats from "@/components/scientific/scientific-stats"
import NotesTable from "@/components/scientific/notes-table"

export default function ScientifiquePage() {
  return (
    <DashboardLayout>
      <PageHeader title="Scientifique" description="Suivi des notes et évaluations des séminaristes" />
      <div className="space-y-6">
        <ScientificStats />
        <NotesTable />
      </div>
    </DashboardLayout>
  )
}
