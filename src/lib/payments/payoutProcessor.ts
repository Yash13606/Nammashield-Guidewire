import { executeMockPayout, type MockPayoutChannel } from "./mockUpiGateway";
import {
  createPayoutTransaction,
  insertPayoutLog,
  updatePayoutTransactionCompleted,
  updatePayoutTransactionFailed,
} from "@/lib/db/repositories/payoutRepository";
import {
  updateClaimPayoutCompleted,
  updateClaimPayoutFailed,
  updateClaimPayoutProcessing,
} from "@/lib/db/repositories/claimsRepository";
import {
  getWorkerWalletBalance,
  updateWorkerWalletBalance,
} from "@/lib/db/repositories/workersRepository";
import { createWorkerNotification, getWorkerNotificationPreferences } from "@/lib/db/repositories/notificationsRepository";

export async function processPayoutForClaim(params: {
  claimId: string;
  workerId: string;
  amount: number;
  channel?: MockPayoutChannel;
}) {
  const { claimId, workerId, amount, channel = "UPI_SIM" } = params;
  const notificationPrefs = await getWorkerNotificationPreferences(workerId);

  const gatewayByChannel: Record<MockPayoutChannel, "upi_simulator" | "razorpay_test" | "stripe_sandbox"> = {
    UPI_SIM: "upi_simulator",
    RAZORPAY_TEST: "razorpay_test",
    STRIPE_TEST: "stripe_sandbox",
  };

  const txRow = await createPayoutTransaction({
      claim_id: claimId,
      worker_id: workerId,
      amount,
      status: "pending",
      gateway: gatewayByChannel[channel],
      channel,
      retry_count: 0,
    });

  if (!txRow) {
    throw new Error("Failed to create payout transaction");
  }

  await updateClaimPayoutProcessing(claimId);

  const gateway = await executeMockPayout({
    claimId,
    workerId,
    amount,
    channel,
    maxAttempts: 3,
  });

  if (!gateway.success) {
    await updatePayoutTransactionFailed(txRow.id, {
      retry_count: gateway.attempts,
      failure_code: gateway.failureCode ?? null,
      failure_message: gateway.failureMessage ?? null,
      processed_at: gateway.processedAt,
    });

    const failureText =
      gateway.failureMessage ?? "Payout failed in mock gateway after retries";

    await updateClaimPayoutFailed(claimId, failureText, gateway.channel, gateway.processedAt);

    if (notificationPrefs?.payout_enabled !== false) {
      await createWorkerNotification({
        worker_id: workerId,
        category: "payout",
        title: "Payout failed",
        message: failureText,
        metadata: {
          claim_id: claimId,
          channel: gateway.channel,
          amount,
          failure_code: gateway.failureCode,
        },
      });
    }

    return {
      ok: false,
      failureCode: gateway.failureCode,
      failureMessage: failureText,
      channel: gateway.channel,
      processedAt: gateway.processedAt,
    };
  }

  const workerBalance = await getWorkerWalletBalance(workerId);
  const prev = Number(workerBalance?.wallet_balance ?? 0);
  const next = Math.round((prev + amount) * 100) / 100;

  await updateWorkerWalletBalance(workerId, next);

  await updateClaimPayoutCompleted(claimId, amount, gateway.channel, gateway.processedAt);

  await updatePayoutTransactionCompleted(txRow.id, {
    retry_count: gateway.attempts - 1,
    provider_ref: gateway.providerRef,
    processed_at: gateway.processedAt,
  });

  await insertPayoutLog({
    claim_id: claimId,
    worker_id: workerId,
    amount,
    wallet_balance_after: next,
    status: "completed",
  });

  if (notificationPrefs?.payout_enabled !== false) {
    await createWorkerNotification({
      worker_id: workerId,
      category: "payout",
      title: "Payout credited",
      message: `INR ${Math.round(amount).toLocaleString("en-IN")} was credited to your wallet.`,
      metadata: {
        claim_id: claimId,
        channel: gateway.channel,
        amount,
        wallet_balance_after: next,
      },
    });
  }

  return {
    ok: true,
    payoutAmount: amount,
    walletBalanceAfter: next,
    gateway: gateway.gateway,
    channel: gateway.channel,
    processedAt: gateway.processedAt,
  };
}
