import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useLanguage } from "../i18n/LanguageContext";
import { useUserAuth } from "../auth/UserAuthContext";

export default function AccountPage() {
  const { t, localizedValue } = useLanguage();
  const { user, ready, isAuthenticated, logout, toggleFavorite, openAuth } =
    useUserAuth();

  if (ready && !isAuthenticated) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 pt-24">
        <div className="relative z-10 max-w-md text-center">
          <div className="text-6xl">🦩</div>
          <h1 className="mt-4 font-display text-4xl text-gray-900">
            {t("account.guest_title")}
          </h1>
          <p className="mt-2 text-gray-600">{t("account.guest_text")}</p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={() => openAuth("register")}
              className="rounded-full bg-flamingo px-6 py-3 font-semibold text-white shadow-lg shadow-flamingo/30 transition hover:bg-flamingo-dark"
            >
              {t("auth.create_account")}
            </button>
            <button
              onClick={() => openAuth("login")}
              className="rounded-full border-2 border-flamingo/40 px-6 py-3 font-semibold text-flamingo transition hover:bg-flamingo/5"
            >
              {t("auth.login")}
            </button>
          </div>
          <Link
            to="/"
            className="mt-6 inline-block text-sm text-gray-500 hover:text-flamingo"
          >
            {t("common.back_home")}
          </Link>
        </div>
      </div>
    );
  }

  const favorites = user?.favorites || [];

  return (
    <div className="relative min-h-screen overflow-hidden pb-24 pt-28">
      <div className="relative z-10 mx-auto max-w-6xl px-6">
        {/* Profile header */}
        <div className="flex flex-col items-center gap-4 rounded-3xl bg-gradient-to-br from-flamingo via-flamingo-dark to-tropical-orange p-8 text-center text-white shadow-xl sm:flex-row sm:text-start">
          <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-white/20 text-4xl backdrop-blur">
            {(user?.name || user?.email || "🦩").slice(0, 1).toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="font-display text-4xl tracking-wide">
              {user?.name || t("account.title")}
            </h1>
            <p className="text-white/80" dir="ltr">
              {user?.email}
            </p>
          </div>
          <button
            onClick={logout}
            className="rounded-full bg-white/15 px-5 py-2 text-sm font-semibold backdrop-blur transition hover:bg-white/25"
          >
            {t("account.logout")}
          </button>
        </div>

        {/* Favorites / last picks */}
        <div className="mt-12">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="font-display text-3xl text-gray-900">
                {t("account.favorites_title")}
              </h2>
              <p className="text-gray-500">{t("account.favorites_subtitle")}</p>
            </div>
            <Link
              to="/carte"
              className="hidden rounded-full bg-flamingo/10 px-4 py-2 text-sm font-semibold text-flamingo-dark transition hover:bg-flamingo/20 sm:inline-block"
            >
              {t("menu.view_all")} →
            </Link>
          </div>

          {favorites.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-flamingo/30 bg-white/60 p-12 text-center">
              <div className="text-5xl">🍽️</div>
              <p className="mt-3 text-gray-600">{t("account.empty")}</p>
              <Link
                to="/carte"
                className="mt-5 inline-block rounded-full bg-flamingo px-6 py-3 font-semibold text-white shadow-lg shadow-flamingo/30 transition hover:bg-flamingo-dark"
              >
                {t("account.discover_menu")}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {favorites.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="group relative flex gap-4 rounded-2xl border border-flamingo/10 bg-white/80 p-4 shadow-sm backdrop-blur"
                >
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={localizedValue(item.name)}
                      className="h-20 w-20 shrink-0 rounded-xl object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="grid h-20 w-20 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-flamingo/20 to-tropical-orange/20 text-3xl">
                      🍹
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold text-gray-800">
                      {localizedValue(item.name)}
                    </h3>
                    {item.priceStandard != null && (
                      <span className="font-bold text-flamingo" dir="ltr">
                        {Number(item.priceStandard).toFixed(0)}{" "}
                        {t("common.currency")}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => toggleFavorite(item)}
                    className="absolute end-3 top-3 text-flamingo transition hover:scale-110"
                    aria-label={t("account.remove")}
                    title={t("account.remove")}
                  >
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
