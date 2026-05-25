const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeCollaboratorEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isValidCollaboratorEmail(email: string) {
  return EMAIL_PATTERN.test(normalizeCollaboratorEmail(email));
}
