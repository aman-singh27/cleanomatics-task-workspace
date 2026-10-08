export function createShutdownHandler({
  server,
  exit = process.exit,
  timeoutMs = 10_000,
}) {
  let shuttingDown = false;
  let finished = false;
  return () => {
    if (shuttingDown) return;
    shuttingDown = true;
    const deadline = setTimeout(() => {
      finished = true;
      server.closeAllConnections();
      exit(1);
    }, timeoutMs);
    deadline.unref();
    server.close((error) => {
      if (finished) return;
      finished = true;
      clearTimeout(deadline);
      exit(error ? 1 : 0);
    });
  };
}
