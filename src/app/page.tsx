import { HydrateClient } from "~/trpc/server";

export default async function Home() {
  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8">
          {"Hello world, I'm memo"}
        </div>
      </main>
    </HydrateClient>
  );
}
