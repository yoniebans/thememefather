interface FooterProps {
    nextScan: string;
    nextLaunch: string;
}

export function Footer({ nextScan, nextLaunch }: FooterProps) {
    return (
        <div className="fixed bottom-0 w-full py-2 font-mono text-xs font-bold bg-black/10 backdrop-blur-sm">
            <div className="container mx-auto px-4" style={{ marginRight: 0 }}>
                <div className="flex justify-end">
                    <div className="flex flex-col gap-2 text-[#EC4899] text-right">
                        <div className="flex items-center justify-end gap-2">
                            <div className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse" />
                            <div>
                                next scan: {nextScan.split(' ')[0]}
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-2">
                            <div className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse" />
                            <div>
                                next launch: {nextLaunch.split(' ')[0]}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}