import { useQuery } from "@tanstack/react-query";
import { useAuth, type AccountType } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export function useAccountType() {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id;
  const profile = useQuery({
    queryKey: ["account-type", userId],
    enabled: !authLoading && Boolean(userId),
    staleTime: 0,
    gcTime: 0,
    retry: false,
    queryFn: async (): Promise<AccountType> => {
      if (!supabase || !userId) throw new Error("Account information is unavailable.");
      const { data, error } = await supabase
        .from("profiles")
        .select("account_type")
        .eq("id", userId)
        .maybeSingle();
      if (error) throw new Error("We couldn't verify your account. Please try again.");
      if (data?.account_type !== "user" && data?.account_type !== "creator") {
        throw new Error("Your account type is unavailable. Please retry or contact support.");
      }
      return data.account_type;
    },
  });
  const loading = authLoading || Boolean(userId && (profile.isPending || profile.isFetching));
  return {
    userId,
    loading,
    accountType: !loading && !profile.isError && userId ? profile.data : undefined,
    error: profile.error,
    retry: profile.refetch,
  };
}
