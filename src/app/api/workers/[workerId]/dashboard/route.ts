import { NextResponse } from "next/server";
import {
  getWorkerById,
} from "@/lib/db/repositories/workers";
import { getLatestActivePolicyForWorker } from "@/lib/db/repositories/policiesRepository";

type Params = { params: { workerId: string } | Promise<{ workerId: string }> };

export async function GET(_: Request, { params }: Params) {
  try {
    const { workerId } = await params;

    const [worker, policy] = await Promise.all([
      getWorkerById(workerId),
      getLatestActivePolicyForWorker(workerId),
    ]);

    return NextResponse.json({ worker: worker ?? null, policy: policy ?? null });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
