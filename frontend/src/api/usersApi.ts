export const DEFAULT_PROFILE_IMAGE = '/assets/default_profile/perfil_default.webp'

export interface StoreProfile {
  id: string
  userId: string
  nickname: string
  address: string
  shippingCost: number
  imageUrl: string
  active: boolean
  productCount?: number
}

export interface CustomerAddress {
  id: string
  label: string
  address: string
  details: string
}

export interface CurrentUser {
  id: string
  name: string
  email: string
  role: string
  addresses: CustomerAddress[]
  selectedAddressId: string | null
}

async function request<T>(
  path: string,
  accessToken: string,
  method = 'GET',
  body?: unknown,
): Promise<T> {
  const response = await fetch(path, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const result = await response.json().catch(() => null) as
    | { message?: string | string[] }
    | T
    | null
  if (!response.ok) {
    const message =
      result && typeof result === 'object' && 'message' in result
        ? result.message
        : undefined
    throw new Error(
      Array.isArray(message)
        ? message.join(' ')
        : message || 'No se pudo completar la solicitud.',
    )
  }
  return result as T
}

export function listStoreProfiles(): Promise<StoreProfile[]> {
  return fetch('/api/users/profiles').then(async (response) => {
    if (!response.ok) throw new Error('No se pudieron cargar las tiendas.')
    return response.json() as Promise<StoreProfile[]>
  })
}

export function getMyProfile(accessToken: string): Promise<StoreProfile> {
  return request('/api/users/profiles/me', accessToken)
}

export function updateMyProfile(
  accessToken: string,
  input: Partial<Pick<StoreProfile, 'nickname' | 'address' | 'shippingCost' | 'imageUrl'>>,
): Promise<StoreProfile> {
  return request('/api/users/profiles/me', accessToken, 'PATCH', input)
}

export function getCurrentUser(accessToken: string): Promise<CurrentUser> {
  return request('/api/users/me', accessToken)
}

export function addCustomerAddress(
  accessToken: string,
  input: Omit<CustomerAddress, 'id'>,
): Promise<{ addresses: CustomerAddress[]; selectedAddressId: string | null }> {
  return request('/api/users/me/addresses', accessToken, 'POST', input)
}

export function selectCustomerAddress(
  accessToken: string,
  id: string,
): Promise<{ addresses: CustomerAddress[]; selectedAddressId: string | null }> {
  return request(
    `/api/users/me/addresses/${encodeURIComponent(id)}/select`,
    accessToken,
    'PATCH',
  )
}

export function deleteCustomerAddress(
  accessToken: string,
  id: string,
): Promise<{ addresses: CustomerAddress[]; selectedAddressId: string | null }> {
  return request(
    `/api/users/me/addresses/${encodeURIComponent(id)}`,
    accessToken,
    'DELETE',
  )
}

export function listProfilesForManagement(accessToken: string): Promise<StoreProfile[]> {
  return request('/api/users/profiles/manage', accessToken)
}

export function setProfileStatus(
  accessToken: string,
  id: string,
  active: boolean,
): Promise<StoreProfile> {
  return request(
    `/api/users/profiles/${encodeURIComponent(id)}/status`,
    accessToken,
    'PATCH',
    { active },
  )
}
