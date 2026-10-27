const authHeaders = (apiKey, merchantId) => ({
  "x-api-key": apiKey,
  id_merchant: merchantId,
});

const endpoint = (baseUrl, path) => `${String(baseUrl).replace(/\/+$/, "")}${path}`;

export function createMyPgTransaction({
  baseUrl,
  apiKey,
  merchantId,
  orderId,
  amount,
  description,
  fetchImpl = globalThis.fetch,
}) {
  return fetchImpl(endpoint(baseUrl, "/qrisv2/create"), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(apiKey, merchantId) },
    body: JSON.stringify({
      order_id: orderId,
      id_merchant: merchantId,
      amount,
      keterangan: description,
    }),
  });
}

export function getMyPgTransactionStatus({
  baseUrl,
  apiKey,
  merchantId,
  orderId,
  fetchImpl = globalThis.fetch,
}) {
  return fetchImpl(
    endpoint(
      baseUrl,
      `/qrisv2/status/${encodeURIComponent(merchantId)}/${encodeURIComponent(orderId)}`,
    ),
    { method: "GET", headers: authHeaders(apiKey, merchantId) },
  );
}
