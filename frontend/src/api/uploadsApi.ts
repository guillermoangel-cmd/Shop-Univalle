async function uploadImage(
  path: string,
  accessToken: string,
  file: File,
): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  const response = await fetch(path, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: formData,
  })
  const result = await response.json().catch(() => null) as
    | { imageUrl?: string; message?: string | string[] }
    | null
  if (!response.ok) {
    const message = result?.message
    throw new Error(Array.isArray(message)
      ? message.join(' ')
      : message || 'No se pudo subir la imagen.')
  }
  if (!result?.imageUrl) throw new Error('El servidor no devolvió la imagen cargada.')
  return result.imageUrl
}

export function uploadProductImage(accessToken: string, file: File) {
  return uploadImage('/api/uploads/products', accessToken, file)
}

export function uploadProfileImage(accessToken: string, file: File) {
  return uploadImage('/api/uploads/profile', accessToken, file)
}

export async function deleteProductImage(
  accessToken: string,
  productId: string,
  imageUrl: string,
): Promise<boolean> {
  return deleteImage(
    `/api/uploads/products/${encodeURIComponent(productId)}`,
    accessToken,
    imageUrl,
  )
}

export async function deleteProfileImage(
  accessToken: string,
  imageUrl: string,
): Promise<boolean> {
  return deleteImage('/api/uploads/profile', accessToken, imageUrl)
}

async function deleteImage(path: string, accessToken: string, imageUrl: string): Promise<boolean> {
  const response = await fetch(path, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ imageUrl }),
  })
  if (!response.ok) {
    const result = await response.json().catch(() => null) as
      | { message?: string | string[] }
      | null
    const message = result?.message
    throw new Error(Array.isArray(message)
      ? message.join(' ')
      : message || 'No se pudo eliminar la imagen anterior.')
  }
  const result = await response.json() as { deleted?: boolean }
  return result.deleted === true
}
