type GatewayAttempt = {
  attempt: number;
  success: boolean;
  providerRef?: string;
  failureCode?: string;
  failureMessage?: string;
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
}): GatewayAttempt {
  const failRate = Number(process.env.MOCK_UPI_FAIL_RATE ?? 0.15);
  const seed = `${input.claimId}|${input.workerId}|${input.amount}|${input.attempt}`;
  const u = hashUnit(seed);
  const success = u > failRate;
  if (success) {
    return {
      attempt: input.attempt,
      success: true,
      providerRef: `UPI_SIM_${Date.now()}_${Math.floor(u * 1_000_000)}`,
    };
  }
  return {
    attempt: input.attempt,
    success: false,
    failureCode: "UPI_SIM_GATEWAY_FAILURE",
    failureMessage: "Simulated UPI transfer failure from mock gateway",
  };
}

export async function executeMockUpiPayout(params: {
  claimId: string;
  workerId: string;
  amount: number;
  maxAttempts?: number;
}): Promise<{
  success: boolean;
  attempts: number;
  providerRef?: string;
  failureCode?: string;
  failureMessage?: string;
  processedAt: string;
  channel: "UPI_SIM";
  gateway: "upi_simulator";
}> {
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
    });
    if (attempt.success) {
      return {
        success: true,
        attempts,
        providerRef: attempt.providerRef,
        processedAt: new Date().toISOString(),
        channel: "UPI_SIM",
        gateway: "upi_simulator",
      };
    }
    lastFailureCode = attempt.failureCode;
    lastFailureMessage = attempt.failureMessage;
  }

  return {
    success: false,
    attempts,
    failureCode: lastFailureCode ?? "UPI_SIM_UNKNOWN",
    failureMessage: lastFailureMessage ?? "Unknown mock payout failure",
    processedAt: new Date().toISOString(),
    channel: "UPI_SIM",
    gateway: "upi_simulator",
  };
}
