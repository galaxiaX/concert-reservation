// Provide env the AppModule reads at import time so the e2e smoke test boots
// without a real environment. The DB is mocked separately (see app.e2e-spec.ts),
// so DATABASE_URL only needs to be a syntactically valid placeholder.
process.env.JWT_SECRET ||= 'test-secret';
process.env.DATABASE_URL ||= 'postgresql://test:test@localhost:5432/test?schema=public';
