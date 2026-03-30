export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative left-1/2 w-screen -translate-x-1/2 -my-6 min-h-[100dvh] max-w-none overflow-x-hidden">
      {children}
    </div>
  );
}
