import { executeMockUpiPayout } from "./mockUpiGateway";
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
}) {
  const { claimId, workerId, amount } = params;
  const notificationPrefs = await getWorkerNotificationPreferences(workerId);

  const txRow = await createPayoutTransaction({
      claim_id: claimId,
      worker_id: workerId,
      amount,
      status: "pending",
      gateway: "upi_simulator",
      channel: "UPI_SIM",
      retry_count: 0,
    });

  if (!txRow) {
    throw new Error("Failed to create payout transaction");
  }

  await updateClaimPayoutProcessing(claimId);

  const gateway = await executeMockUpiPayout({
    claimId,
    workerId,
    amount,
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
    channel: gateway.channel,
    processedAt: gateway.processedAt,
  };
}
