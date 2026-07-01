import { AppShell } from "@/components/AppShell";
import { getSupabaseFoodDataResult } from "@/lib/data/supabaseFoodData";

export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const dataResult =
    process.env.NODE_ENV === "development" ? await getSupabaseFoodDataResult() : null;
  const showDataFallbackWarning = dataResult?.fallbackReason === "read_failed";

  return <AppShell showDataFallbackWarning={showDataFallbackWarning}>{children}</AppShell>;
}
