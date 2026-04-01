/**
 * Upload a file to the server media endpoint.
 * Returns the resulting URL on success, or null on failure.
 */
export async function uploadFileToServer(file: File): Promise<string | null> {
  const formData = new FormData();
  formData.append('file', file);
  const token = localStorage.getItem('accessToken');
  const res = await fetch('/api/media/assets', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  const json = await res.json();
  return json.success && json.data?.url ? json.data.url : null;
}
