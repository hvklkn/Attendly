import "server-only";

type SendPasswordResetEmailInput = {
  email: string;
  resetUrl: string;
  expiresAt: Date;
};

export async function sendPasswordResetEmail(
  input: SendPasswordResetEmailInput,
) {
  void input;
  const provider = process.env.PASSWORD_RESET_EMAIL_PROVIDER?.trim();

  if (!provider) {
    return {
      delivered: false,
      provider: "not_configured",
    };
  }

  return {
    delivered: false,
    provider,
  };
}
