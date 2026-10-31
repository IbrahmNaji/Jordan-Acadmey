import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Express, Request, RequestHandler, Response } from 'express';
import {
  createAdminRecoveryKeyGuard,
  isAdminRecoveryDiagnosticsEnabled,
  registerAdminRecoveryDiagnostics,
  toAdminRecoveryDiagnosticsResponse,
} from './adminRecoveryDiagnostics';
import { safePrismaErrorLogMessage } from '../../utils/safePrismaErrorLog';

type CapturedRouter = {
  stack: Array<{
    route?: { path: string; stack: Array<{ handle: RequestHandler }> };
  }>;
};

function registerAndCaptureHandlers(key: string, inspect: () => Promise<{
  userCount: number;
  adminAccounts: Array<{ email: string; role: string }>;
}>): RequestHandler[] {
  let mountedRouter: unknown;
  const app = {
    use: (_path: string, router: unknown) => {
      mountedRouter = router;
      return app;
    },
  } as unknown as Express;

  registerAdminRecoveryDiagnostics({ app, enabled: true, key, inspect });

  const route = (mountedRouter as CapturedRouter).stack
    .find((layer) => layer.route?.path === '/inspect')?.route;
  assert(route, 'diagnostics route should be mounted');
  return route.stack.map(({ handle }) => handle);
}

async function invokeHandlers(
  handlers: RequestHandler[],
  ip: string,
  recoveryKey: string,
): Promise<{ statusCode: number; body: unknown }> {
  return new Promise((resolve, reject) => {
    let statusCode = 200;
    let settled = false;
    let handlerIndex = 0;
    const requestHeaders: Record<string, string> = {
      'x-admin-recovery-key': recoveryKey,
    };
    const req = {
      ip,
      method: 'POST',
      path: '/inspect',
      originalUrl: '/api/_ops/admin-recovery/inspect',
      headers: requestHeaders,
      socket: { remoteAddress: ip },
      app: { get: () => false },
      get: (name: string) => requestHeaders[name.toLowerCase()],
    } as unknown as Request;
    const finish = (body: unknown) => {
      if (settled) return;
      settled = true;
      resolve({ statusCode, body });
    };
    const res = {
      statusCode,
      headersSent: false,
      status(code: number) {
        statusCode = code;
        return this;
      },
      setHeader() {
        return this;
      },
      json(body: unknown) {
        finish(body);
        return this;
      },
      send(body: unknown) {
        finish(body);
        return this;
      },
    } as unknown as Response;

    const next = (error?: unknown) => {
      if (error) {
        reject(error);
        return;
      }
      const handler = handlers[handlerIndex++];
      if (!handler) {
        finish(undefined);
        return;
      }
      try {
        Promise.resolve(handler(req, res, next)).catch(reject);
      } catch (error) {
        reject(error);
      }
    };

    next();
  });
}

test('diagnostics are disabled by default and the route is not mounted', () => {
  assert.equal(isAdminRecoveryDiagnosticsEnabled(undefined), false);
  assert.equal(isAdminRecoveryDiagnosticsEnabled(false), false);

  let useCalls = 0;
  const app = {
    use: () => {
      useCalls += 1;
      return app;
    },
  } as unknown as Express;

  registerAdminRecoveryDiagnostics({
    app,
    enabled: isAdminRecoveryDiagnosticsEnabled(undefined),
    key: 'temporary-test-key-that-is-long-enough-12345',
    inspect: async () => {
      throw new Error('Inspection must not run while diagnostics are disabled.');
    },
  });

  assert.equal(useCalls, 0);
});

test('enabled diagnostics require a sufficiently long key', () => {
  let useCalls = 0;
  const app = {
    use: () => {
      useCalls += 1;
      return app;
    },
  } as unknown as Express;

  assert.throws(
    () =>
      registerAdminRecoveryDiagnostics({
        app,
        enabled: true,
        inspect: async () => ({
          userCount: 0,
          adminAccounts: [],
        }),
      }),
    /key must be at least 32 bytes/,
  );
  assert.equal(useCalls, 0);
});

test('missing and incorrect keys are rejected before the request can proceed', () => {
  const guard = createAdminRecoveryKeyGuard(
    'expected-test-key-that-is-long-enough-123456',
  );

  for (const suppliedKey of [undefined, 'incorrect-key']) {
    let statusCode = 0;
    let responseBody: unknown;
    let nextCalls = 0;
    const req = {
      get: () => suppliedKey,
    } as unknown as Request;
    const res = {
      status(code: number) {
        statusCode = code;
        return this;
      },
      json(body: unknown) {
        responseBody = body;
        return this;
      },
    } as unknown as Response;

    guard(req, res, () => {
      nextCalls += 1;
    });

    assert.equal(statusCode, 401);
    assert.deepEqual(responseBody, { error: 'UNAUTHORIZED' });
    assert.equal(nextCalls, 0);
  }
});

test('response includes only total count and ADMIN email/role fields', () => {
  const result = {
    databaseName: 'should-not-be-returned',
    databaseHost: 'should-not-be-returned.render.com',
    userCount: 3,
    adminAccounts: [
      {
        email: 'admin@example.test',
        role: 'ADMIN',
        passwordHash: 'should-not-be-returned',
      },
    ],
  } as unknown as Parameters<typeof toAdminRecoveryDiagnosticsResponse>[0];

  const response = toAdminRecoveryDiagnosticsResponse(result);

  assert.deepEqual(response, {
    userCount: 3,
    adminAccounts: [{ email: 'admin@example.test', role: 'ADMIN' }],
  });
  assert.equal('databaseName' in response, false);
  assert.equal('databaseHost' in response, false);
  assert.equal('passwordHash' in response.adminAccounts[0], false);
});

test('sixth request in the window is rejected across route re-registration', async () => {
  const key = 'shared-rate-limit-test-key-with-sufficient-length';
  let inspectCalls = 0;
  const inspect = async () => {
    inspectCalls += 1;
    return { userCount: 1, adminAccounts: [{ email: 'admin@example.test', role: 'ADMIN' }] };
  };
  const handlersFirstRegistration = registerAndCaptureHandlers(key, inspect);
  const handlersSecondRegistration = registerAndCaptureHandlers(key, inspect);
  assert.equal(handlersFirstRegistration[0], handlersSecondRegistration[0]);

  for (let index = 0; index < 5; index += 1) {
    const handlers = index % 2 === 0
      ? handlersFirstRegistration
      : handlersSecondRegistration;
    const result = await invokeHandlers(handlers, '203.0.113.74', key);
    assert.equal(result.statusCode, 200);
  }

  const sixthResult = await invokeHandlers(
    handlersFirstRegistration,
    '203.0.113.74',
    key,
  );
  assert.equal(sixthResult.statusCode, 429);
  assert.deepEqual(sixthResult.body, { error: 'RATE_LIMITED' });
  assert.equal(inspectCalls, 5);
});

test('Prisma error logs omit raw engine details', () => {
  const message = safePrismaErrorLogMessage({
    message: 'sensitive connection details',
    target: 'postgres connector',
    connectionString: 'postgresql://user:secret@example.test/database',
  });

  assert.equal(
    message,
    'Prisma reported an error; database error details were suppressed.',
  );
  assert.equal(message.includes('secret'), false);
  assert.equal(message.includes('postgresql://'), false);
});
