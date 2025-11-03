/**
 * Utility functions for handling ID-like values
 */

export type IDLike = { id: string } | string | null | undefined;

/**
 * Extracts an ID from various ID-like formats
 * @param x - Can be an object with id property, a string, null, or undefined
 * @returns The extracted ID as string or undefined
 */
export const getId = (x: IDLike): string | undefined =>
  (x && typeof x === "object" ? (x as any).id : x) ?? undefined;

/**
 * Ensures the extracted ID is a string, throws error if not found
 * @param x - ID-like value
 * @param fieldName - Name of the field for error messaging
 * @returns The ID as string
 * @throws Error if ID cannot be extracted
 */
export const requireId = (x: IDLike, fieldName: string): string => {
  const id = getId(x);
  if (!id) {
    throw new Error(`Missing required ID for ${fieldName}`);
  }
  return id;
};