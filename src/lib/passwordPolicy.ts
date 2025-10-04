import { z } from "zod";

export interface PasswordRule {
  validate: (password: string) => boolean;
  message: string;
}

export const PASSWORD_POLICY_CONFIG = {
  minimumLength: 8,
  requireLowercase: true,
  requireUppercase: true,
  requireNumber: true,
  requireSymbol: true,
};

const defaultRules: PasswordRule[] = [
  {
    validate: (password) => password.length >= PASSWORD_POLICY_CONFIG.minimumLength,
    message: "Password must be at least " + PASSWORD_POLICY_CONFIG.minimumLength + " characters long",
  },
  {
    validate: (password) => !PASSWORD_POLICY_CONFIG.requireLowercase || /[a-z]/.test(password),
    message: "Password must include at least one lowercase letter",
  },
  {
    validate: (password) => !PASSWORD_POLICY_CONFIG.requireUppercase || /[A-Z]/.test(password),
    message: "Password must include at least one uppercase letter",
  },
  {
    validate: (password) => !PASSWORD_POLICY_CONFIG.requireNumber || /[0-9]/.test(password),
    message: "Password must include at least one number",
  },
  {
    validate: (password) =>
      !PASSWORD_POLICY_CONFIG.requireSymbol || /[^A-Za-z0-9]/.test(password),
    message: "Password must include at least one symbol",
  },
];

export const passwordPolicySchema = z
  .string()
  .refine((password) => defaultRules.every((rule) => rule.validate(password)), {
    message: defaultRules.map((rule) => rule.message).join("\n"),
  });

export function validatePassword(password: string, rules: PasswordRule[] = defaultRules) {
  const failures = rules.filter((rule) => !rule.validate(password));
  return {
    valid: failures.length === 0,
    messages: failures.map((rule) => rule.message),
  };
}

export function assertPasswordPolicy(password: string, rules: PasswordRule[] = defaultRules) {
  const result = validatePassword(password, rules);
  if (!result.valid) {
    throw new Error(result.messages.join("\n"));
  }
}

export function getDefaultPasswordRules(): PasswordRule[] {
  return [...defaultRules];
}
