import { Sidebar } from './Sidebar'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-3 sm:p-6">{children}</main>
    </div>
  )
}
