export default function FilmStrip({ position = 'top' }: { position?: 'top' | 'bottom' | 'both' }) {
  const strip = (
    <div className="w-full h-12 opacity-40 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjMWExYTFhIi8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIGZpbGw9IiMwYTBhMGEiLz48L3N2Zz4=')] drop-shadow-2xl mix-blend-screen pointer-events-none"></div>
  );

  return (
    <>
      {(position === 'top' || position === 'both') && (
        <div className="absolute top-24 left-0 w-full z-0">
          {strip}
        </div>
      )}
      {(position === 'bottom' || position === 'both') && (
        <div className="absolute bottom-0 left-0 w-full z-0">
          {strip}
        </div>
      )}
    </>
  );
}
