"use client";

// Asks before deleting. The change history keeps a copy of the row either way.
export function DeleteButton({ action, summary }: { action: () => Promise<void>; summary: string }) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(`Delete ${summary}? The change history keeps a copy.`)) e.preventDefault();
      }}
      className="mt-8 flex justify-center"
    >
      <button className="min-h-11 px-4 text-sm font-medium text-red-700 dark:text-red-400 hover:underline">Delete entry</button>
    </form>
  );
}
