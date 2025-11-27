// This page exists only to demonstrate the error boundary.
// Visiting /error will throw and render app/(root)/error.tsx.
export default function Page() {
  throw new Error("Test error to trigger error boundary");
}