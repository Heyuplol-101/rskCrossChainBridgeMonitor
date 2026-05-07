export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="relative">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-transparent bg-linear-to-r from-purple-500 via-pink-500 to-purple-500 bg-[length:200%_100%] animate-[spin_1.5s_linear_infinite]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-2 w-2 animate-pulse rounded-full bg-pink-400" />
        </div>
      </div>
      <span className="sr-only">Loading...</span>
    </div>
  );
}
