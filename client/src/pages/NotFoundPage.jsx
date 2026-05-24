import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";

export default function NotFoundPage() {
  const { t } = useLanguage();

  return (
    <section className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="text-8xl font-display text-flamingo mb-4">404</div>
        <p className="text-xl text-gray-600 mb-8">
          {t("common.error_not_found")}
        </p>
        <Link
          to="/"
          className="px-6 py-3 bg-flamingo text-white rounded-full font-medium hover:bg-flamingo-dark transition-colors"
        >
          {t("common.back_home")}
        </Link>
      </div>
    </section>
  );
}
