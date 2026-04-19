import { Navbar } from "@/components/navbar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#fdfaf6] pb-20 md:pb-0 md:pt-16">
      <Navbar />
      <main className="max-w-5xl mx-auto w-full">{children}</main>
    </div>
  );
}
