import Link from "next/link";

export default function HealthPage() {
  return (
    <main>
      <p>
        <Link href="/">Monuments</Link>
      </p>
      <h1>System health</h1>
      <p>Web application is running.</p>
      <p>
        <Link href="/api/health">View machine-readable health status</Link>
      </p>
    </main>
  );
}
