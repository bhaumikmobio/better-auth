export function unknownToMessage(error: unknown, fallback: string) {
  if (!error) return fallback;
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }
  return fallback;
}

export function getResultErrorMessage(
  result: unknown,
  fallback: string,
): string | null {
  if (typeof result !== "object" || result === null) return null;
  if (!("error" in result)) return null;

  const error = (result as { error?: unknown }).error;
  if (!error) return null;

  return unknownToMessage(error, fallback);
}

