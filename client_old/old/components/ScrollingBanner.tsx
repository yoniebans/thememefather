import { useEffect, useRef } from 'react';
import type { Meme } from '@/types/meme';

interface ScrollingBannerProps {
    memes: Meme[] | undefined;
    isLoading: boolean;
}

export function ScrollingBanner({ memes, isLoading }: ScrollingBannerProps) {
    const primaryRef = useRef<HTMLDivElement>(null);
    const secondaryRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const primary = primaryRef.current;
        const secondary = secondaryRef.current;

        if (!primary || !secondary) return;

        // Position the secondary container initially
        secondary.style.transform = `translateX(${primary.offsetWidth}px)`;

        const checkPosition = () => {
            const primaryRect = primary.getBoundingClientRect();
            const secondaryRect = secondary.getBoundingClientRect();

            if (primaryRect.right <= 0) {
                primary.style.transform = `translateX(${secondary.offsetWidth}px)`;
            }
            if (secondaryRect.right <= 0) {
                secondary.style.transform = `translateX(${primary.offsetWidth}px)`;
            }
        };

        const animation = () => {
            checkPosition();
            requestAnimationFrame(animation);
        };

        requestAnimationFrame(animation);
    }, []);

    const content = memes?.length
        ? memes.map(meme => `${meme.ticker}`)
        : Array(10).fill("$THEMEMEFATHER");

    const renderContent = () => (
        <div className="flex">
            {content.map((item, index) => (
                <span
                    key={index}
                    className="text-2xl font-bold whitespace-nowrap text-[#EC4899] mx-12 [text-shadow:_-1px_-1px_0_#000,_1px_-1px_0_#000,_-1px_1px_0_#000,_1px_1px_0_#000]"
                >
                    {item}
                </span>
            ))}
        </div>
    );

    return (
        <div className="w-full overflow-hidden py-4 bg-black/10">
            <div className="relative flex">
                <div
                    ref={primaryRef}
                    className="animate-scroll-left"
                    style={{ willChange: 'transform' }}
                >
                    {renderContent()}
                </div>
                <div
                    ref={secondaryRef}
                    className="animate-scroll-left"
                    style={{ willChange: 'transform' }}
                >
                    {renderContent()}
                </div>
            </div>
        </div>
    );
}