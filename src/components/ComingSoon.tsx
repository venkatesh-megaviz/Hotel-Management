interface ComingSoonProps {
  title: string;
  subtitle: string;
}

/** Placeholder for modules that are not live yet. APIs remain available for later. */
export default function ComingSoon({ title, subtitle }: ComingSoonProps) {
  return (
    <div
      className="coming-soon-page relative -mx-4 -my-6 flex min-h-[calc(100vh-3.5rem)] flex-col sm:-mx-8"
      style={{
        backgroundColor: "#f3f4f6",
        backgroundImage: "url(/c1.png)",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center center",
        backgroundSize: "contain",
      }}
    >
      <div className="relative z-10 px-4 pt-6 sm:px-8">
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
}
