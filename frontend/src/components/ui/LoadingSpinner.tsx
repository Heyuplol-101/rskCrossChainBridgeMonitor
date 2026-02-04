export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="relative">
        {/* Outer spinning ring - Rootstock purple/pink gradient */}
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-transparent bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 bg-[length:200%_100%] animate-[spin_1.5s_linear_infinite]" />
        {/* Inner pulsing dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-2 w-2 animate-pulse rounded-full bg-pink-400" />
        </div>
      </div>
    </div>
  );
}
