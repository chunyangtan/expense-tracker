import { TabBar } from "@/app/(tabs)/tab-bar";

// Pages with the bottom tab bar. The padding keeps content clear of the fixed bar.
export default function TabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="flex-1 flex flex-col pb-[calc(4rem+env(safe-area-inset-bottom))]">{children}</div>
      <TabBar />
    </>
  );
}
