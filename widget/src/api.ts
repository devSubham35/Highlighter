export async function uploadScreenshot(apiBaseUrl: string, projectKey: string, blob: Blob) {
  const response = await fetch(`${apiBaseUrl}/api/upload`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contentType: "image/png", projectKey }),
  });
  if (!response.ok) throw new Error("Upload URL request failed");
  const { uploadUrl, publicUrl } = (await response.json()) as { uploadUrl: string; publicUrl: string };
  await fetch(uploadUrl, { method: "PUT", body: blob, headers: { "Content-Type": "image/png" } });
  return publicUrl;
}

export async function submitReport(apiBaseUrl: string, payload: Record<string, unknown>) {
  const response = await fetch(`${apiBaseUrl}/api/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("Report submission failed");
  return response.json();
}
