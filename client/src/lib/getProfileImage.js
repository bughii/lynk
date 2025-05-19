import { getAvatar } from "./utils";

/**
 * Gets the URL to display for a user’s picture.
 * - If `image` is a truthy string (full S3 URL, http(s), data URI, etc.) return it.
 * - Otherwise fall back to the numeric avatar sprite.
 */

export function getProfileImage(image, avatarIndex) {
  if (image) return image;
  return getAvatar(avatarIndex ?? 0);
}
