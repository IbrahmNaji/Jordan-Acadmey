import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Express, Request, RequestHandler, Response } from 'express';
import type { Prisma } from '@prisma/client';
import {
  AdminBootstrapConflictError,
  createAdminInEmptyDatabase,
} from './adminBootstrap.service';
import { registerAdminBootstrapRoute } from './adminBootstrap.routes';

type CapturedRouter = {
  stack: Array<{
    route?: { path: string; stack: Array<{ handle: RequestHandler }> };
  }>;
};

const key = 'admin-bootstrap-test-key-with-at-least-32-bytes';

function captureHandlers(enabled: boolean, createAdmin: (input: {
  email: string;
  password: string;
}) => Promise<{ email: string; role: string }>): RequestHandler[] | undefined {
  let mountedRouter: unknown;
  const app = {
    use: (_path: string, router: unknown) => {
      mountedRouter = router;
      return app;
    },
  } as unknown as Express;

  registerAdminBootstrapRoute({ app, enabled, key, createAdmin });
  if (!mountedRouter) return undefined;
  const route = (mountedRouter as CapturedRouter).stack
    .find((layer) => layer.route?.path === '/create-admin')?.route;
  assert(route, 'bootstrap route should be mounted');
  return route.stack.map(({ handle }) => handle);
}

async function invoke(
  handlers: RequestHandler[],
  ip: string,
  suppliedKey: string | undefined,
  body: unknown = { email: ' Admin@Example.test ', password: 'Asecurepass123' },
): Promise<{ statusCode: number; body: unknown }> {
  return new Promise((resolve, reject) => {
    let statusCode = 200;
    let settled = false;
    let handlerIndex = 0;
    const headers: Record<string, string> = {};
    if (suppliedKey !== undefined) headers['x-admin-bootstrap-key'] = suppliedKey;
    const req = {
      ip,
      body,
      method: 'POST',
      path: '/create-admin',
      originalUrl: '/api/_ops/admin-bootstrap/create-admin',
      headers,
      socket: { remoteAddress: ip },
      app: { get: () => false },
      get: (name: string) => headers[name.toLowerCase()],
    } as unknown as Request;
    const finish = (responseBody: unknown) => {
      if (settled) return;
      settled = true;
      resolve({ statusCode, body: responseBody });
    };
    const res = {
      statusCode,
      setHeader() { return this; },
      status(code: number) { statusCode = code; return this; },
      json(responseBody: unknown) { finish(responseBody); return this; },
      send(responseBody: unknown) { finish(responseBody); return this; },
    } as unknown as Response;
    const next = (error?: unknown) => {
      if (error) return reject(error);
      const handler = handlers[handlerIndex++];
      if (!handler) return finish(undefined);
      try {
        Promise.resolve(handler(req, res, next)).catch(reject);
      } catch (error) {
        reject(error);
      }
    };
    next();
  });
}

test('bootstrap route is not registered by default', () => {
  let calls = 0;
  const handlers = captureHandlers(false, async () => {
    calls += 1;
    throw new Error('must not run');
  });
  assert.equal(handlers, undefined);
  assert.equal(calls, 0);
});

test('invalid bootstrap key is rejected before account creation', async () => {
  let calls = 0;
  const handlers = captureHandlers(true, async () => {
    calls += 1;
    return { email: 'admin@example.test', role: 'ADMIN' };
  });
  assert(handlers);

  for (const suppliedKey of [undefined, 'incorrect-key']) {
    const result = await invoke(handlers, `203.0.113.${suppliedKey ? '31' : '32'}`, suppliedKey);
    assert.equal(result.statusCode, 401);
    assert.deepEqual(result.body, { error: 'UNAUTHORIZED' });
  }
  assert.equal(calls, 0);
});

test('successful bootstrap response contains no password or hash', async () => {
  let received: { email: string; password: string } | undefined;
  const handlers = captureHandlers(true, async (input) => {
    received = input;
    return { email: input.email, role: 'ADMIN' };
  });
  assert(handlers);

  const result = await invoke(handlers, '203.0.113.33', key);
  assert.equal(result.statusCode, 201);
  assert.deepEqual(received, {
    email: 'admin@example.test',
    password: 'Asecurepass123',
  });
  assert.deepEqual(result.body, {
    status: 'created',
    email: 'admin@example.test',
    role: 'ADMIN',
  });
});

test('bootstrap route requires a long temporary key when enabled', () => {
  const app = { use: () => app } as unknown as Express;
  assert.throws(
    () => registerAdminBootstrapRoute({
      app,
      enabled: true,
      key: 'short',
      createAdmin: async () => ({ email: 'admin@example.test', role: 'ADMIN' }),
    }),
    /at least 32 bytes/,
  );
});

test('empty database permits one ADMIN; subsequent or duplicate creation is refused', async () => {
  let userCount = 0;
  let account: { email: string; role: string; passwordHash: string } | undefined;
  let createCalls = 0;
  const tx = {
    user: {
      findUnique: async ({ where }: { where: { email: string } }) =>
        account?.email === where.email ? { id: 'user-1' } : null,
      count: async () => userCount,
      create: async ({ data, select }: {
        data: { email: string; role: string; passwordHash: string; fullName: string };
        select: { email: true; role: true };
      }) => {
        createCalls += 1;
        userCount += 1;
        account = data;
        assert.deepEqual(select, { email: true, role: true });
        return { email: data.email, role: data.role };
      },
    },
  } as unknown as Prisma.TransactionClient;

  const result = await createAdminInEmptyDatabase(tx, ' Admin@Example.test ', 'bcrypt-hash');
  assert.deepEqual(result, { email: 'admin@example.test', role: 'ADMIN' });
  assert.equal(account?.passwordHash, 'bcrypt-hash');
  assert.equal(account?.role, 'ADMIN');
  await assert.rejects(
    createAdminInEmptyDatabase(tx, 'admin@example.test', 'another-hash'),
    AdminBootstrapConflictError,
  );
  await assert.rejects(
    createAdminInEmptyDatabase(tx, 'other@example.test', 'another-hash'),
    AdminBootstrapConflictError,
  );
  assert.equal(createCalls, 1);
});
