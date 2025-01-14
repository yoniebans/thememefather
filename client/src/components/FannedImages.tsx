interface TokenCardProps {
  ticker: string;
  score: string;
  deployDate: string;
  image: string;
  tokenId: string;
  vaultUrl?: string;
}

interface FannedImagesProps {
  topToken: TokenCardProps;
  bottomToken: TokenCardProps;
}

export const FannedImages = ({ topToken, bottomToken }: FannedImagesProps) => {
  return (
    <div className="relative w-[200px] h-[280px]">
      {/* Bottom card */}
      <div
        className="absolute w-full h-full transform -rotate-15 origin-bottom-left"
        style={{ transform: "rotate(-15deg)" }}
      >
        <a
          href={
            bottomToken.vaultUrl
              ? `https://thememefather.com/vault/${bottomToken.vaultUrl}`
              : "#"
          }
          className="block w-full h-full"
        >
          <div className="w-full h-full bg-card rounded-xl overflow-hidden border shadow-lg">
            <div className="h-[60%]">
              <img
                src={bottomToken.image}
                alt={`${bottomToken.ticker} token`}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-4 h-[40%] space-y-2">
              <div className="flex justify-between items-center">
                <div className="text-sm font-mono">
                  <span className="text-primary">{bottomToken.score}</span> | $
                  {bottomToken.ticker}
                </div>
              </div>
              <div className="text-xs text-muted-foreground font-mono">
                by {bottomToken.tokenId}
              </div>
              <div className="text-xs text-muted-foreground">
                <span className="text-green-500">●</span> Deployed{" "}
                {bottomToken.deployDate}
              </div>
            </div>
          </div>
        </a>
      </div>

      {/* Top card */}
      <div
        className="absolute w-full h-full transform rotate-15 origin-bottom-left left-[70px] -top-[30px]"
        style={{ transform: "rotate(15deg)" }}
      >
        <a
          href={
            topToken.vaultUrl
              ? `https://thememefather.com/vault/${topToken.vaultUrl}`
              : "#"
          }
          className="block w-full h-full"
        >
          <div className="w-full h-full bg-card rounded-xl overflow-hidden border shadow-lg">
            <div className="h-[60%]">
              <img
                src={topToken.image}
                alt={`${topToken.ticker} token`}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-4 h-[40%] space-y-2">
              <div className="flex justify-between items-center">
                <div className="text-sm font-mono">
                  <span className="text-primary">{topToken.score}</span> | $
                  {topToken.ticker}
                </div>
              </div>
              <div className="text-xs text-muted-foreground font-mono">
                by {topToken.tokenId}
              </div>
              <div className="text-xs text-muted-foreground">
                <span className="text-green-500">●</span> Deployed{" "}
                {topToken.deployDate}
              </div>
            </div>
          </div>
        </a>
      </div>
    </div>
  );
};
