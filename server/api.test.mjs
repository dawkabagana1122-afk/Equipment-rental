import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const waitForServer = async (url, timeoutMs = 10000) => {
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return response;
    } catch {
      // retry until the server is ready
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(`Timed out waiting for ${url}`);
};

describe('ops api', () => {
  it('serves a health endpoint and login session', async () => {
    const child = await import('node:child_process');
    const server = child.spawn('node', ['server/index.mjs'], {
      cwd: process.cwd(),
      stdio: 'pipe',
    });

    try {
      const health = await waitForServer('http://localhost:4000/api/health');
      const healthData = await health.json();
      assert.equal(healthData.status, 'ok');

      const loginResponse = await fetch('http://localhost:4000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'employee',
          phone: '99128044',
          code: '123456',
        }),
      });

      const loginData = await loginResponse.json();
      assert.equal(loginResponse.status, 200);
      assert.equal(loginData.user.role, 'employee');
      assert.ok(loginData.session.token);
    } finally {
      server.kill('SIGTERM');
    }
  });

  it('accepts renter login as a supported role', async () => {
    const child = await import('node:child_process');
    const server = child.spawn('node', ['server/index.mjs'], {
      cwd: process.cwd(),
      stdio: 'pipe',
    });

    try {
      await waitForServer('http://localhost:4000/api/health');

      const loginResponse = await fetch('http://localhost:4000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'renter',
          phone: '99128044',
          code: '123456',
        }),
      });

      const loginData = await loginResponse.json();
      assert.equal(loginResponse.status, 200);
      assert.equal(loginData.user.role, 'renter');
      assert.equal(loginData.session.role, 'renter');
    } finally {
      server.kill('SIGTERM');
    }
  });
});
