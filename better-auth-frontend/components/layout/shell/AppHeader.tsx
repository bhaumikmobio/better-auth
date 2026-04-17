type AppHeaderProps = {
  title: string;
  description: string;
};

export function AppHeader({ title, description }: AppHeaderProps) {
  return (
    <header className="border-b border-cyan-200/80 bg-white/70 px-4 py-4 backdrop-blur sm:px-6">
      <div className="w-full">
        <h2 className="text-2xl font-bold tracking-tight text-sky-900">{title}</h2>
        <p className="mt-1 text-sm text-sky-800/80">{description}</p>
      </div>
    </header>
  );
}
