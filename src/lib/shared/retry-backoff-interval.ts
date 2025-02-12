export function retryBackoffInterval(
  milliseconds: number,
  retryCount: number,
): Promise<void> {
  return new Promise((resolve) =>
    setTimeout(resolve, milliseconds * 2 ** retryCount),
  );
}
