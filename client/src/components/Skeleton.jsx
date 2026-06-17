export function SkeletonLine({ className = "" }) {
  return (
    <div className={`rounded-full bg-gray-200/80 animate-pulse ${className}`} />
  );
}

export function SkeletonBox({ className = "", style }) {
  return (
    <div
      className={`rounded-2xl bg-gray-200/80 animate-pulse ${className}`}
      style={style}
    />
  );
}

export function MenuTeaserSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-6 animate-pulse">
      <div className="flex flex-col items-center mb-16">
        <SkeletonLine className="h-3 w-24 mb-4" />
        <SkeletonLine className="h-10 w-48" />
      </div>
      <div className="flex justify-center gap-3 mb-12">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonLine key={i} className="h-10 w-24" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex gap-4 p-4 rounded-2xl border border-gray-100"
          >
            <SkeletonBox className="w-20 h-20 flex-shrink-0 rounded-xl" />
            <div className="flex-1 space-y-3 py-1">
              <SkeletonLine className="h-4 w-3/4" />
              <SkeletonLine className="h-3 w-full" />
              <SkeletonLine className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SpacesTeaserSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-6 animate-pulse">
      <div className="flex flex-col items-center mb-16">
        <SkeletonLine className="h-3 w-24 mb-4" />
        <SkeletonLine className="h-10 w-48" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-3xl overflow-hidden border border-gray-100"
          >
            <SkeletonBox className="h-56 w-full rounded-none" />
            <div className="p-6 space-y-3">
              <SkeletonLine className="h-6 w-2/3" />
              <SkeletonLine className="h-3 w-full" />
              <SkeletonLine className="h-4 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function GalleryTeaserSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-6 animate-pulse">
      <div className="flex flex-col items-center mb-16">
        <SkeletonLine className="h-3 w-24 mb-4" />
        <SkeletonLine className="h-10 w-48" />
      </div>
      <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
        {[180, 240, 160, 200, 220, 180, 260, 190].map((h, i) => (
          <div key={i} className="break-inside-avoid">
            <SkeletonBox className="w-full rounded-2xl" style={{ height: h }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function MenuPageSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-6 animate-pulse">
      <div className="flex flex-col items-center mb-12">
        <SkeletonLine className="h-3 w-16 mb-4" />
        <SkeletonLine className="h-12 w-40 mb-4" />
        <SkeletonLine className="h-4 w-64" />
      </div>
      <div className="flex justify-center gap-3 mb-10">
        {[1, 2, 3, 4, 5].map((i) => (
          <SkeletonLine key={i} className="h-10 w-24" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="flex gap-4 p-4 rounded-2xl border border-gray-100"
          >
            <SkeletonBox className="w-20 h-20 flex-shrink-0 rounded-xl" />
            <div className="flex-1 space-y-3 py-1">
              <SkeletonLine className="h-4 w-3/4" />
              <SkeletonLine className="h-3 w-full" />
              <SkeletonLine className="h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SpacesPageSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-6 animate-pulse">
      <div className="flex flex-col items-center mb-12">
        <SkeletonLine className="h-3 w-16 mb-4" />
        <SkeletonLine className="h-12 w-40 mb-4" />
        <SkeletonLine className="h-4 w-64" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="rounded-3xl overflow-hidden border border-gray-100"
          >
            <SkeletonBox className="h-56 w-full rounded-none" />
            <div className="p-6 space-y-3">
              <SkeletonLine className="h-6 w-2/3" />
              <SkeletonLine className="h-3 w-full" />
              <SkeletonLine className="h-4 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function GalleryPageSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-6 animate-pulse">
      <div className="flex flex-col items-center mb-12">
        <SkeletonLine className="h-3 w-16 mb-4" />
        <SkeletonLine className="h-12 w-40 mb-4" />
        <SkeletonLine className="h-4 w-64" />
      </div>
      <div className="flex justify-center gap-3 mb-10">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonLine key={i} className="h-8 w-20" />
        ))}
      </div>
      <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
        {[200, 280, 180, 240, 220, 260, 190, 210, 250, 170, 230, 200].map(
          (h, i) => (
            <div key={i} className="break-inside-avoid">
              <SkeletonBox
                className="w-full rounded-2xl"
                style={{ height: h }}
              />
            </div>
          ),
        )}
      </div>
    </div>
  );
}
