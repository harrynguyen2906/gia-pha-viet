import useSWR from "swr";
import type { SubscriptionTier } from "@/generated/prisma";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useTiers() {
  const { data, error, mutate, isLoading } = useSWR<SubscriptionTier[]>("/api/admin/tiers", fetcher);

  return {
    tiers: data,
    isLoading,
    isError: error,
    mutate,
  };
}
