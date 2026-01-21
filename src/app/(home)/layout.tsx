import React from "react";

export default function HomeLayout(props: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white p-4 text-neutral-900">
      <main className="text-center">{props.children}</main>
    </div>
  );
}
