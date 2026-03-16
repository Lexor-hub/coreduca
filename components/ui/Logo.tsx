export function Logo({ className = "h-8" }: { className?: string }) {
    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <svg viewBox="0 0 100 100" className="h-full w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Top Red Half (Yang) */}
                <path d="M50 0C77.6142 0 100 22.3858 100 50C100 63.8071 94.4036 76.3071 85.3553 85.3553C76.3071 94.4036 63.8071 100 50 100L50 50C50 36.1929 38.8071 25 25 25C11.1929 25 0 36.1929 0 50C0 22.3858 22.3858 0 50 0Z" fill="#D9252A" />
                {/* Bottom Navy Half (Yin) */}
                <path d="M0 50C0 77.6142 22.3858 100 50 100C63.8071 100 76.3071 94.4036 85.3553 85.3553C94.4036 76.3071 100 63.8071 100 50L50 50C50 63.8071 38.8071 75 25 75C11.1929 75 0 63.8071 0 50Z" fill="#132034" />
                {/* Center line modification for the Taeguk wave - simpler stylized version */}
                <circle cx="50" cy="50" r="50" fill="none" />
                <path d="M 0 50 A 25 25 0 0 1 50 50 A 25 25 0 0 0 100 50 A 50 50 0 0 1 0 50 Z" fill="#D9252A" />
                <path d="M 100 50 A 25 25 0 0 1 50 50 A 25 25 0 0 0 0 50 A 50 50 0 0 1 100 50 Z" fill="#132034" />
            </svg>
            <span className="font-extrabold tracking-tight text-[var(--color-coreduca-blue)] text-xl dark:text-white">
                COREDUCA
            </span>
        </div>
    )
}
