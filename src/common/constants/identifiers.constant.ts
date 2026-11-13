export const RESOURCE_IDENTIFIERS = {
  id: 1,
  publicId: '0199a000-0000-7000-8000-000000000001',
} as const;

export type IdentifierType = keyof typeof RESOURCE_IDENTIFIERS;
