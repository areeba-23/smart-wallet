// Integration tests: run the real Express app against a real MongoDB.
// Uses TEST_MONGO_URI if set, otherwise starts an in-memory MongoDB.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';

process.env.JWT_SECRET = 'test-secret';
const { createApp } = await import('../src/app.js');

let server, base, mem;

before(async () => {
  let uri = process.env.TEST_MONGO_URI;
  if (!uri) {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    mem = await MongoMemoryServer.create();
    uri = mem.getUri();
  }
  await mongoose.connect(uri, { dbName: `sw_test_${Date.now()}` });
  server = createApp().listen(0);
  base = `http://127.0.0.1:${server.address().port}/api`;
});

after(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  server?.close();
  await mem?.stop();
});

async function call(method, path, body, token) {
  const res = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json() };
}
const signup = async (name, email) =>
  (await call('POST', '/auth/register', { name, email, password: 'secret1' })).data;

test('register, duplicate email, login, me, bad token', async () => {
  const a = await signup('Areeba', 'a@test.com');
  assert.ok(a.token);
  assert.equal(a.user.email, 'a@test.com');
  assert.equal((await call('POST', '/auth/register', { name: 'X', email: 'a@test.com', password: 'secret1' })).status, 409);
  assert.equal((await call('POST', '/auth/register', { name: 'X', email: 'bad', password: 'secret1' })).status, 400);
  assert.equal((await call('POST', '/auth/login', { email: 'a@test.com', password: 'nope' })).status, 401);
  const l = await call('POST', '/auth/login', { email: 'a@test.com', password: 'secret1' });
  assert.equal(l.status, 200);
  assert.equal((await call('GET', '/auth/me', null, l.data.token)).data.user.name, 'Areeba');
  assert.equal((await call('GET', '/wallet')).status, 401);
  assert.equal((await call('GET', '/wallet', null, 'garbage')).status, 401);
});

test('income splits by rules, expense is blocked on overspend', async () => {
  const { token } = await signup('Zoha', 'z@test.com');
  const food = (await call('POST', '/buckets', { name: 'Food' }, token)).data.id;
  const save = (await call('POST', '/buckets', { name: 'Savings', target: 1000 }, token)).data.id;

  assert.equal((await call('PUT', '/rules', { rules: [{ bucketId: food, percent: 70 }, { bucketId: save, percent: 40 }] }, token)).status, 400);
  assert.equal((await call('PUT', '/rules', { rules: [{ bucketId: food, percent: 50 }, { bucketId: save, percent: 30 }] }, token)).status, 200);
  assert.equal((await call('POST', '/transactions/income', { amount: 1000, note: 'Pocket money' }, token)).status, 201);

  let w = (await call('GET', '/wallet', null, token)).data;
  assert.equal(w.unallocated, 200);
  assert.equal(w.buckets.find((b) => b.id === food).balance, 500);
  assert.equal(w.buckets.find((b) => b.id === save).balance, 300);
  assert.equal(w.buckets.find((b) => b.id === save).target, 1000);
  assert.equal(w.transactions[0].remainder, 200);

  assert.equal((await call('POST', '/transactions/expense', { bucketId: food, amount: 600 }, token)).status, 400);
  assert.equal((await call('POST', '/transactions/expense', { bucketId: food, amount: 120.5, category: 'Lunch' }, token)).status, 201);
  assert.equal((await call('POST', '/transactions/expense', { amount: 0 }, token)).status, 400);
  w = (await call('GET', '/wallet', null, token)).data;
  assert.equal(w.buckets.find((b) => b.id === food).balance, 379.5);
});

test('transfer, borrow, return loan, delete bucket', async () => {
  const { token } = await signup('Loan User', 'l@test.com');
  const a = (await call('POST', '/buckets', { name: 'A' }, token)).data.id;
  const b = (await call('POST', '/buckets', { name: 'B' }, token)).data.id;
  await call('POST', '/transactions/income', { amount: 500 }, token); // all to unallocated
  assert.equal((await call('POST', '/transactions/transfer', { fromId: 'wallet', toId: a, amount: 300 }, token)).status, 201);
  assert.equal((await call('POST', '/transactions/transfer', { fromId: 'wallet', toId: b, amount: 500, asLoan: true }, token)).status, 400);
  assert.equal((await call('POST', '/transactions/transfer', { fromId: a, toId: b, amount: 100, asLoan: true }, token)).status, 201);

  let w = (await call('GET', '/wallet', null, token)).data;
  assert.equal(w.loans.length, 1);
  assert.equal(w.loans[0].status, 'open');
  const loanId = w.loans[0].id;
  assert.equal(w.buckets.find((x) => x.id === b).balance, 100);

  assert.equal((await call('POST', `/loans/${loanId}/return`, null, token)).status, 200);
  assert.equal((await call('POST', `/loans/${loanId}/return`, null, token)).status, 400);
  w = (await call('GET', '/wallet', null, token)).data;
  assert.equal(w.buckets.find((x) => x.id === a).balance, 300);
  assert.equal(w.buckets.find((x) => x.id === b).balance, 0);

  assert.equal((await call('DELETE', `/buckets/${a}`, null, token)).status, 200);
  w = (await call('GET', '/wallet', null, token)).data;
  assert.equal(w.unallocated, 500);
  assert.equal(w.buckets.length, 1);
});

test('shared bucket: create by email, contribute, both see it, privacy', async () => {
  const p = await signup('Partner One', 'p1@test.com');
  const q = await signup('Partner Two', 'p2@test.com');
  const outsider = await signup('Outsider', 'out@test.com');
  await call('POST', '/transactions/income', { amount: 1000 }, p.token);
  await call('POST', '/transactions/income', { amount: 400 }, q.token);

  assert.equal((await call('POST', '/shared-buckets', { name: 'Trip', partnerEmail: 'nobody@test.com' }, p.token)).status, 404);
  assert.equal((await call('POST', '/shared-buckets', { name: 'Trip', partnerEmail: 'p1@test.com' }, p.token)).status, 400);
  const id = (await call('POST', '/shared-buckets', { name: 'Trip', partnerEmail: 'p2@test.com', target: 2000 }, p.token)).data.id;

  assert.equal((await call('POST', `/shared-buckets/${id}/contribute`, { amount: 600 }, p.token)).status, 201);
  assert.equal((await call('POST', `/shared-buckets/${id}/contribute`, { amount: 100 }, q.token)).status, 201);
  assert.equal((await call('POST', `/shared-buckets/${id}/contribute`, { amount: 9999 }, q.token)).status, 400);
  assert.equal((await call('POST', `/shared-buckets/${id}/contribute`, { amount: 10 }, outsider.token)).status, 403);

  const wp = (await call('GET', '/wallet', null, p.token)).data;
  const sb = wp.buckets.find((x) => x.id === id);
  assert.equal(sb.shared, true);
  assert.equal(sb.balance, 700);
  assert.equal(wp.unallocated, 400);
  assert.deepEqual(sb.contributions.map((c) => [c.name, c.total]).sort(), [['Partner Two', 100], ['You', 600]]);
  assert.ok(wp.transactions.some((t) => t.type === 'contribution' && t.userName === 'Partner Two'));

  const wq = (await call('GET', '/wallet', null, q.token)).data;
  assert.equal(wq.buckets.find((x) => x.id === id).contributions.find((c) => c.isMe).total, 100);
  assert.equal((await call('GET', '/wallet', null, outsider.token)).data.buckets.length, 0);

  assert.equal((await call('DELETE', `/buckets/${id}`, null, p.token)).status, 400); // not empty
  assert.equal((await call('DELETE', `/buckets/${id}`, null, q.token)).status, 404); // not the owner
});

test('users cannot touch each other\'s buckets', async () => {
  const u1 = await signup('U One', 'u1@test.com');
  const u2 = await signup('U Two', 'u2@test.com');
  const id = (await call('POST', '/buckets', { name: 'Mine' }, u1.token)).data.id;
  assert.equal((await call('PATCH', `/buckets/${id}`, { name: 'Hacked' }, u2.token)).status, 404);
  assert.equal((await call('DELETE', `/buckets/${id}`, null, u2.token)).status, 404);
  assert.equal((await call('POST', '/transactions/expense', { bucketId: id, amount: 1 }, u2.token)).status, 404);
  assert.equal((await call('PATCH', `/buckets/${id}`, { name: 'Renamed', target: 50 }, u1.token)).status, 200);
});
