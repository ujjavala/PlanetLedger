export async function extractCsvFromRequest(request: Request): Promise<string> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      throw new Error("CSV file is required under 'file' field.");
    }
    return file.text();
  }

  const body = (await request.json()) as { csv?: string };
  return body.csv ?? "";
}
