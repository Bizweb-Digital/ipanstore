import test from "node:test";
import assert from "node:assert/strict";
import { createMyPgTransaction, getMyPgTransactionStatus } from "../lib/myPg.js";

test("create uses the MY PG v2 contract and returns the native Response", async () => {
  let call;
  const expected = new Response(JSON.stringify({ status: true }), { status: 201 });
  const response = await createMyPgTransaction({
    baseUrl: "https://klikqris.com/api///",
    apiKey: "test-only-api-key",
    merchantId: "merchant/id",
    orderId: "order 1",
    amount: 1200,
    description: "IPAN STORE order",
    fetchImpl: async (...args) => {
      call = args;
      return expected;
    },
  });

  assert.equal(call[0], "https://klikqris.com/api/qrisv2/create");
  assert.equal(call[1].method, "POST");
  assert.equal(call[1].headers["Content-Type"], "application/json");
  assert.equal(call[1].headers["x-api-key"], "test-only-api-key");
  assert.equal(call[1].headers.id_merchant, "merchant/id");
  assert.deepEqual(JSON.parse(call[1].body), {
    order_id: "order 1",
    id_merchant: "merchant/id",
    amount: 1200,
    keterangan: "IPAN STORE order",
  });
  assert.equal("callback_url" in JSON.parse(call[1].body), false);
  assert.equal(response, expected);
  assert.equal(response.status, 201);
});

test("status encodes merchant and order IDs and returns provider errors unchanged", async () => {
  let call;
  const expected = new Response("provider failure", { status: 503 });
  const response = await getMyPgTransactionStatus({
    baseUrl: "https://klikqris.com/api/",
    apiKey: "test-only-api-key",
    merchantId: "merchant/id ?",
    orderId: "order/one ?",
    fetchImpl: async (...args) => {
      call = args;
      return expected;
    },
  });

  assert.equal(
    call[0],
    "https://klikqris.com/api/qrisv2/status/merchant%2Fid%20%3F/order%2Fone%20%3F",
  );
  assert.equal(call[1].method, "GET");
  assert.equal(call[1].headers["x-api-key"], "test-only-api-key");
  assert.equal(call[1].headers.id_merchant, "merchant/id ?");
  assert.equal(response, expected);
  assert.equal(response.status, 503);
  assert.equal(await response.text(), "provider failure");
});
