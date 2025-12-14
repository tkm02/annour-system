// "use client"

// import { useState } from "react"
// import { usersApi } from "@/lib/api"
// import { Button } from "@/components/ui/button"
// import { AlertTriangle, X, Loader2, CheckCircle } from "lucide-react"

// interface DeleteAccessModalProps {
//   user: {
//     id: string
//     username: string
//   }
//   onClose: () => void
//   onSuccess: () => void
// }

// export default function DeleteAccessModal({ user, onClose, onSuccess }: DeleteAccessModalProps) {
//   const [loading, setLoading] = useState(false)
//   const [error, setError] = useState<string | null>(null)
//   const [success, setSuccess] = useState(false)

//   const handleDelete = async () => {
//     try {
//       setLoading(true)
//       setError(null)
      
//       await usersApi.deleteUser(user.id)
      
//       setSuccess(true)
      
//       setTimeout(() => {
//         onSuccess()
//       }, 1500)
//     } catch (err: any) {
//       setError(err.message || "Erreur lors de la suppression")
//       console.error("Erreur:", err)
//     } finally {
//       setLoading(false)
//     }
//   }

//   return (
//     <div 
//       className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
//       onClick={(e) => {
//         if (e.target === e.currentTarget) onClose()
//       }}
//     >
//       <div className="bg-white rounded-lg p-6 w-full max-w-md">
//         <div className="flex justify-between items-start mb-4">
//           <div className="flex items-center gap-3">
//             <div className="p-2 bg-red-100 rounded-full">
//               <AlertTriangle className="h-6 w-6 text-red-600" />
//             </div>
//             <h2 className="text-xl font-bold text-secondary">Confirmer la Suppression</h2>
//           </div>
//           <Button
//             variant="ghost"
//             size="sm"
//             onClick={onClose}
//             disabled={loading}
//             className="h-8 w-8 p-0"
//           >
//             <X className="h-4 w-4" />
//           </Button>
//         </div>
        
//         {success && (
//           <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 flex items-center gap-2">
//             <CheckCircle className="h-5 w-5" />
//             <span>Utilisateur supprimé avec succès!</span>
//           </div>
//         )}
        
//         {error && (
//           <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
//             <strong className="font-bold">Erreur : </strong>
//             <span className="block sm:inline">{error}</span>
//           </div>
//         )}
        
//         {!success && (
//           <div className="mb-6">
//             <p className="text-gray-700 mb-2">
//               Êtes-vous sûr de vouloir supprimer l'accès de :
//             </p>
//             <p className="font-semibold text-lg text-secondary">
//               {user.username}
//             </p>
//             <p className="text-sm text-red-600 mt-3">
//               ⚠️ Cette action est irréversible et supprimera définitivement cet utilisateur.
//             </p>
//           </div>
//         )}
        
//         <div className="flex gap-3 justify-end">
//           <Button 
//             variant="outline" 
//             onClick={onClose}
//             disabled={loading || success}
//           >
//             Annuler
//           </Button>
//           <Button 
//             variant="destructive"
//             onClick={handleDelete}
//             disabled={loading || success}
//             className="bg-red-600 hover:bg-red-700 min-w-[120px]"
//           >
//             {loading ? (
//               <>
//                 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                 Suppression...
//               </>
//             ) : success ? (
//               "Supprimé ✓"
//             ) : (
//               "Supprimer"
//             )}
//           </Button>
//         </div>
//       </div>
//     </div>
//   )
// }
