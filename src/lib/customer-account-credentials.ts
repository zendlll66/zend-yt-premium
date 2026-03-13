export const CUSTOMER_ACCOUNT_EMAIL_KEY = "__customer_account_email__";
export const CUSTOMER_ACCOUNT_PASSWORD_KEY = "__customer_account_password__";

export type ModifierEntry = { modifierName: string; price: number };

export function appendCustomerAccountCredentialsModifiers(
  modifiers: ModifierEntry[],
  email: string,
  password: string
): ModifierEntry[] {
  return [
    ...modifiers,
    { modifierName: `${CUSTOMER_ACCOUNT_EMAIL_KEY}${email}`, price: 0 },
    { modifierName: `${CUSTOMER_ACCOUNT_PASSWORD_KEY}${password}`, price: 0 },
  ];
}

export function extractCustomerAccountCredentials(modifiers: ModifierEntry[]): {
  email: string | null;
  password: string | null;
} {
  const emailEntry = modifiers.find((m) => m.modifierName.startsWith(CUSTOMER_ACCOUNT_EMAIL_KEY));
  const passwordEntry = modifiers.find((m) =>
    m.modifierName.startsWith(CUSTOMER_ACCOUNT_PASSWORD_KEY)
  );
  return {
    email: emailEntry ? emailEntry.modifierName.slice(CUSTOMER_ACCOUNT_EMAIL_KEY.length) : null,
    password: passwordEntry
      ? passwordEntry.modifierName.slice(CUSTOMER_ACCOUNT_PASSWORD_KEY.length)
      : null,
  };
}

export function isHiddenSystemModifier(name: string): boolean {
  return (
    name.startsWith(CUSTOMER_ACCOUNT_EMAIL_KEY) ||
    name.startsWith(CUSTOMER_ACCOUNT_PASSWORD_KEY)
  );
}

export function getVisibleModifiers(modifiers: ModifierEntry[]): ModifierEntry[] {
  return modifiers.filter((m) => !isHiddenSystemModifier(m.modifierName));
}

