import { useI18n } from "../../lib/i18n";
import { Languages } from "lucide-react";

export default function LanguageSwitcher() {
  const { language, setLanguage } = useI18n();

  return (
    <button
      onClick={() => setLanguage(language === "uk" ? "en" : "uk")}
      aria-label={`Switch to ${language === "uk" ? "English" : "Ukrainian"} language`}
      aria-pressed={language === "en"}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/50 hover:bg-slate-700/80 border border-slate-700/50 text-slate-300 hover:text-white rounded-lg text-xs font-semibold transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-slate-900"
      title={language === "uk" ? "Switch to English" : "Перейти на українську"}
    >
      <Languages className="w-4 h-4 text-blue-400" aria-hidden="true" />
      <span className="font-medium">{language === "uk" ? "UA" : "EN"}</span>
    </button>
  );
}
