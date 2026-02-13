import React, { useState, useRef } from "react";
import { useExamples } from "../../contexts/ExamplesContext";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function ImageGallery() {
  const { products, isLoading } = useExamples();
  const [startIndex, setStartIndex] = useState(0);
  const visibleCount = 8;
  const scrollAccumulator = useRef(0);
  const scrollThreshold = 50; // Pixels of scroll needed to trigger shift

  // Calculate the images to display based on current start index
  const displayImages = products.slice(startIndex, startIndex + visibleCount);

  const canScrollLeft = startIndex > 0;
  const canScrollRight = startIndex + visibleCount < products.length;

  const scrollLeft = () => {
    setStartIndex((prev) => Math.max(0, prev - 1));
  };

  const scrollRight = () => {
    setStartIndex((prev) =>
      Math.min(products.length - visibleCount, prev + 1)
    );
  };

  // Handle horizontal scroll gesture
  const handleWheel = (e: React.WheelEvent) => {
    // Use deltaX for horizontal scroll, or deltaY if shift is held or if it's a trackpad horizontal gesture
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;

    scrollAccumulator.current += delta;

    if (scrollAccumulator.current > scrollThreshold && canScrollRight) {
      scrollRight();
      scrollAccumulator.current = 0;
    } else if (scrollAccumulator.current < -scrollThreshold && canScrollLeft) {
      scrollLeft();
      scrollAccumulator.current = 0;
    }
  };

  if (isLoading) {
    return (
      <section className="w-full flex flex-col items-center justify-start py-12">
        <div className="flex items-center gap-2 h-[400px] w-full max-w-5xl mt-10 px-4">
          {[...Array(8)].map((_, idx) => (
            <div
              key={idx}
              className="relative flex-grow w-56 rounded-lg overflow-hidden h-[400px] bg-zinc-800 animate-pulse"
            />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="w-full flex flex-col items-center justify-start py-12">
      <div className="max-w-3xl text-center px-4">
        <h2 className="text-3xl font-semibold text-white">Our Latest Creations</h2>
        <p className="text-sm text-zinc-400 mt-2">
          A visual collection of our most recent works – each piece crafted
          with intention, emotion, and style.
        </p>
      </div>

      <div
        className="relative w-full max-w-5xl mt-10 px-4"
        onWheel={handleWheel}
      >
        {/* Left navigation arrow */}
        {canScrollLeft && (
          <button
            onClick={scrollLeft}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition-colors"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Gallery container */}
        <div className="group/gallery flex items-center justify-center gap-2 h-[500px] w-full">
          {displayImages.map((img, idx) => (
            <div
              key={img.id}
              className="relative group flex-1 basis-16 min-w-8 rounded-lg overflow-visible h-[280px] transition-all duration-500 ease-out hover:flex-[7] hover:h-[420px] hover:z-20 hover:shadow-2xl hover:shadow-black/50"
            >
              <picture className="w-full h-full">
                {img.webpUrl && <source srcSet={img.webpUrl} type="image/webp" />}
                <img
                  className="h-full w-full object-cover object-center rounded-lg transition-all duration-500 group-hover:object-contain"
                  src={img.url}
                  alt={img.name || `image-${idx}`}
                />
              </picture>
            </div>
          ))}
        </div>

        {/* Right navigation arrow */}
        {canScrollRight && (
          <button
            onClick={scrollRight}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition-colors"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        {/* Pagination indicator */}
        {products.length > visibleCount && (
          <div className="flex justify-center gap-1.5 mt-4">
            {Array.from({ length: products.length - visibleCount + 1 }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setStartIndex(idx)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  idx === startIndex ? "bg-white" : "bg-zinc-600 hover:bg-zinc-500"
                }`}
                aria-label={`Go to position ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
