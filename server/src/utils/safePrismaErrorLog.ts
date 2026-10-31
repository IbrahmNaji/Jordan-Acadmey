export function safePrismaErrorLogMessage(_event?: unknown): string {
  return 'Prisma reported an error; database error details were suppressed.';
}
