type GatewayAttempt = {
  attempt: number;
  success: boolean;
  providerRef?: string;
  failureCode?: string;
  failureMessage?: string;
};

export type MockPayoutChannel = "UPI_SIM" | "RAZORPAY_TEST" | "STRIPE_TEST";

const CHANNEL_CONFIG: Record<
  MockPayoutChannel,
  {
    gateway: "upi_simulator" | "razorpay_test" | "stripe_sandbox";
    failRateEnv: string;
    failureCode: string;
    failureMessage: string;
    providerRefPrefix: string;
  }
> = {
  UPI_SIM: {
    gateway: "upi_simulator",
    failRateEnv: "MOCK_UPI_FAIL_RATE",
    failureCode: "UPI_SIM_GATEWAY_FAILURE",
    failureMessage: "Simulated UPI transfer failure from mock gateway",
    providerRefPrefix: "UPI_SIM",
  },
  RAZORPAY_TEST: {
    gateway: "razorpay_test",
    failRateEnv: "MOCK_RAZORPAY_FAIL_RATE",
    failureCode: "RAZORPAY_TEST_FAILURE",
    failureMessage: "Simulated Razorpay test payout failure",
    providerRefPrefix: "RZP_TEST",
  },
  STRIPE_TEST: {
    gateway: "stripe_sandbox",
    failRateEnv: "MOCK_STRIPE_FAIL_RATE",
    failureCode: "STRIPE_TEST_FAILURE",
    failureMessage: "Simulated Stripe sandbox payout failure",
    providerRefPrefix: "STRIPE_TEST",
  },
};

function hashUnit(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(h) / 0x7fffffff;
}

function simulateGatewayAttempt(input: {
  claimId: string;
  workerId: string;
  amount: number;
  attempt: number;
  channel: MockPayoutChannel;
}): GatewayAttempt {
  const cfg = CHANNEL_CONFIG[input.channel];
  const failRate = Number(process.env[cfg.failRateEnv] ?? 0.15);
  const seed = `${input.claimId}|${input.workerId}|${input.amount}|${input.attempt}|${input.channel}`;
  const u = hashUnit(seed);
  const success = u > failRate;
  if (success) {
    return {
      attempt: input.attempt,
      success: true,
      providerRef: `${cfg.providerRefPrefix}_${Date.now()}_${Math.floor(u * 1_000_000)}`,
    };
  }
  return {
    attempt: input.attempt,
    success: false,
    failureCode: cfg.failureCode,
    failureMessage: cfg.failureMessage,
  };
}

export async function executeMockPayout(params: {
  claimId: string;
  workerId: string;
  amount: number;
  channel?: MockPayoutChannel;
  maxAttempts?: number;
}): Promise<{
  success: boolean;
  attempts: number;
  providerRef?: string;
  failureCode?: string;
  failureMessage?: string;
  processedAt: string;
  channel: MockPayoutChannel;
  gateway: "upi_simulator" | "razorpay_test" | "stripe_sandbox";
}> {
  const channel = params.channel ?? "UPI_SIM";
  const cfg = CHANNEL_CONFIG[channel];
  const maxAttempts = Math.max(1, params.maxAttempts ?? 3);
  let attempts = 0;
  let lastFailureCode: string | undefined;
  let lastFailureMessage: string | undefined;

  for (let i = 1; i <= maxAttempts; i++) {
    attempts = i;
    const attempt = simulateGatewayAttempt({
      claimId: params.claimId,
      workerId: params.workerId,
      amount: params.amount,
      attempt: i,
      channel,
    });
    if (attempt.success) {
      return {
        success: true,
        attempts,
        providerRef: attempt.providerRef,
        processedAt: new Date().toISOString(),
        channel,
        gateway: cfg.gateway,
      };
    }
    lastFailureCode = attempt.failureCode;
    lastFailureMessage = attempt.failureMessage;
  }

  return {
    success: false,
    attempts,
    failureCode: lastFailureCode ?? `${channel}_UNKNOWN`,
    failureMessage: lastFailureMessage ?? "Unknown mock payout failure",
    processedAt: new Date().toISOString(),
    channel,
    gateway: cfg.gateway,
  };
}
