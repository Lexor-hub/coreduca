export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-[var(--color-coreduca-blue)]/5 via-white to-[var(--color-coreduca-purple)]/5 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {children}
            </div>
        </div>
    )
}
