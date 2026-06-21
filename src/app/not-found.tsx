import Link from "next/link";
import { BrandMark } from "@/presentation/components/ui/BrandMark";

export default function NotFound() {
  return (
    <main className="login-wrap">
      <section className="login-card text-center">
        <BrandMark className="mx-auto mb-4" />
        <h1 className="text-xl font-bold m-0 mb-2">Sayfa bulunamadı</h1>
        <p className="text-sm text-[var(--muted)] mb-5">
          Aradığınız sayfa taşınmış veya silinmiş olabilir.
        </p>
        <Link href="/" className="btn btn-primary justify-center">
          Ana sayfaya dön
        </Link>
      </section>
    </main>
  );
}
