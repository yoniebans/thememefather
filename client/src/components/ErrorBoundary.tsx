import { useRouteError } from "react-router-dom";

export function ErrorBoundary() {
  const error = useRouteError() as Error;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md p-8 rounded-lg bg-card border">
        <h1 className="text-xl font-bold mb-4">Oops! Something went wrong</h1>
        <p className="text-muted-foreground mb-4">
          {error?.message || "An unexpected error occurred"}
        </p>
        <button
          onClick={() => window.location.href = '/'}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
        >
          Return Home
        </button>
      </div>
    </div>
  );
}