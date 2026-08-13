import BehavioralDashboard from "./BehavioralDashboard";
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Brain, ShieldAlert, Target, Fingerprint, 
  ShieldCheck, HelpCircle,
  AlertTriangle, Clock, Users, FileDigit, Sparkles
} from 'lucide-react';

interface CognitiveProfileTabProps {
  personName: string;
}

export default function CognitiveProfileTab({ personName }: CognitiveProfileTabProps) {
  const [activeXAI, setActiveXAI] = useState<string | null>(null);

  const trustScore = 42; // Example
  const influenceScore = 88;

    const cognitiveTraits = [
    { name: "Стиль мислення", value: "Аналітичний / Стратегічний", confidence: 92, sources: ["Судові рішення", "Бізнес-зв'язки"] },
    { name: "Стиль прийняття рішень", value: "Обережний, заснований на даних", confidence: 85, sources: ["Декларації", "Історія компаній"] },
    { name: "Рівень імпульсивності", value: "Низький", confidence: 88, sources: ["Публічні повідомлення", "Часова активність"] },
    { name: "Рівень раціональності", value: "Високий", confidence: 94, sources: ["Фінансові операції", "Декларації"] },
    { name: "Схильність до ризику", value: "Помірна (Прорахована)", confidence: 79, sources: ["Фінансові операції"] },
    { name: "Рівень організованості", value: "Високий", confidence: 86, sources: ["Історія компаній", "Професійна діяльність"] },
    { name: "Дисциплінованість", value: "Висока", confidence: 82, sources: ["Часові патерни"] },
    { name: "Адаптивність", value: "Висока", confidence: 81, sources: ["Професійна діяльність"] },
    { name: "Консервативність", value: "Помірна", confidence: 73, sources: ["Соціальні мережі", "Інтерв'ю"] },
    { name: "Відкритість новому", value: "Низька", confidence: 68, sources: ["Соціальні мережі"] },
    { name: "Емоційна стабільність", value: "Висока", confidence: 91, sources: ["Публічні комунікації"] },
    { name: "Рівень стресостійкості", value: "Високий", confidence: 87, sources: ["Судові справи"] },
    { name: "Комунікаційний стиль", value: "Офіційний / Стриманий", confidence: 95, sources: ["Інтерв'ю", "Соціальні мережі"] },
    { name: "Стиль управління", value: "Авторитарний / Контролюючий", confidence: 89, sources: ["Бізнес-зв'язки"] },
    { name: "Стиль ведення переговорів", value: "Жорсткий, безкомпромісний", confidence: 84, sources: ["Партнери", "Судові справи"] },
    { name: "Схильність до конфліктів", value: "Уникає прямих конфліктів", confidence: 76, sources: ["Медійні події"] },
    { name: "Здатність працювати в команді", value: "Низька (Індивідуаліст)", confidence: 88, sources: ["Історія компаній"] },
    { name: "Рівень лідерства", value: "Тіньовий лідер (Сірий кардинал)", confidence: 96, sources: ["Соціальний граф"] },
  ];

  const risks = [
    { name: "Ризик афілійованості", probability: 85, severity: "Критичний", factor: "Спільні адреси реєстрації з PEP" },
    { name: "Репутаційні ризики", probability: 60, severity: "Середній", factor: "Згадки у негативному медіа-контексті (2022)" },
    { name: "Ризик шахрайства", probability: 15, severity: "Низький", factor: "Відсутність відкритих кримінальних проваджень" },
  ];

  return (
    <div className="space-y-6">
      <BehavioralDashboard personName={personName} />
      {/* Header stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-2 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Trust Score (Рейтинг Довіри)</span>
            <ShieldCheck className={`w-3.5 h-3.5 ${trustScore < 50 ? 'text-rose-400' : 'text-emerald-400'}`} />
          </div>
          <div className="flex items-end gap-2">
            <span className={`text-2xl font-bold font-mono ${trustScore < 50 ? 'text-rose-400' : 'text-emerald-400'}`}>{trustScore}</span>
            <span className="text-[10px] text-slate-500 mb-1">/ 100</span>
          </div>
          <div className="mt-2 text-[10px] text-slate-400">
            Вплив: <span className="text-rose-400">Судові рішення (-20)</span>, <span className="text-emerald-400">Стабільна діяльність (+15)</span>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-2 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Influence Score (Вплив)</span>
            <Target className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold font-mono text-blue-400">{influenceScore}</span>
            <span className="text-[10px] text-slate-500 mb-1">/ 100</span>
          </div>
          <div className="mt-2 text-[10px] text-slate-400">
            Домінує: <span className="text-blue-300">Бізнесовий (92%)</span>, Регіональний (85%)
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-2 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Digital Twin Status</span>
            <Fingerprint className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-xs font-bold text-purple-300 mt-1">Цифрову Модель Сформовано</div>
          <div className="mt-2 text-[10px] text-slate-400 flex flex-wrap gap-1">
            <span className="bg-slate-800/50 border border-slate-700/50 px-1 py-0.5 rounded">Behavioral Graph</span>
            <span className="bg-slate-800/50 border border-slate-700/50 px-1 py-0.5 rounded">Asset Graph</span>
            <span className="bg-slate-800/50 border border-slate-700/50 px-1 py-0.5 rounded">Social Graph</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Cognitive Profile */}
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-4">
          <div className="flex items-center gap-2 border-b border-slate-800/60 pb-2 mb-3">
            <Brain className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Когнітивний Профіль</h3>
          </div>
          
          <div className="space-y-3">
            {cognitiveTraits.map((trait, idx) => (
              <div key={idx} className="group relative">
                <div className="flex justify-between items-end mb-1">
                  <span className="text-[10px] text-slate-400 uppercase">{trait.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-200">{trait.value}</span>
                    <button 
                      onClick={() => setActiveXAI(activeXAI === trait.name ? null : trait.name)}
                      className="text-slate-500 hover:text-amber-400 transition-colors"
                    >
                      <HelpCircle className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                {/* Confidence Bar */}
                <div className="w-full bg-slate-800/50 h-1 rounded-full overflow-hidden flex">
                  <div className="bg-amber-500/80 h-full" style={{ width: `${trait.confidence}%` }}></div>
                </div>
                <div className="text-[9px] text-slate-500 mt-0.5 flex justify-between">
                  <span>Впевненість: {trait.confidence}%</span>
                  <span className="text-amber-500/50 font-mono">XAI EXPLAINABLE</span>
                </div>

                <AnimatePresence>
                  {activeXAI === trait.name && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2 bg-slate-950/80 border border-amber-500/20 p-2 rounded-xl text-[10px] text-slate-300"
                    >
                      <div className="font-bold text-amber-400 mb-1 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        AI Обґрунтування (XAI)
                      </div>
                      <div className="mb-1"><span className="text-slate-500">Джерела:</span> {trait.sources.join(", ")}</div>
                      <p className="leading-relaxed">
                        Модель класифікувала цей патерн на основі 14 ітерацій перевірки. Аномалій не виявлено. Альтернативні пояснення мають вагу &lt; 5%.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        {/* Psychological & Reputational Portrait */}
        <div className="space-y-4">
          <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-4">
            <div className="flex items-center gap-2 border-b border-slate-800/60 pb-2 mb-3">
              <FileDigit className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Психологічний Портрет</h3>
            </div>
            <div className="text-[11px] text-slate-300 leading-relaxed font-serif space-y-2">
              <p>
                <strong className="text-emerald-400 font-sans text-[10px] uppercase">Аналітична Оцінка:</strong><br/>
                Об'єкт демонструє стійку, прагматичну модель поведінки. Реакція на фінансовий тиск характеризується оптимізацією активів (передача часток пов'язаним особам). 
              </p>
              <p>
                У кризових комунікаціях переважає уникнення прямого конфлікту. Сильна сторона: здатність вибудовувати складні, непрямі корпоративні структури (оцінка базується на виявленому графі номіналів).
              </p>
              <div className="mt-3 p-2 bg-slate-950/50 border-l-2 border-emerald-500/50 text-[10px] text-slate-400 font-mono italic">
                * Це аналітична оцінка на основі цифрових слідів, а не медичний або юридичний факт.
              </div>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-4">
            <div className="flex items-center gap-2 border-b border-slate-800/60 pb-2 mb-3">
              <Users className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Соціальний Вплив & Репутація</h3>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="bg-slate-950/50 border border-slate-800 p-2 rounded-xl">
                <div className="text-slate-500 mb-1">Центральність у графі</div>
                <div className="text-xs font-bold text-cyan-400">Вузол-Концентратор (Hub)</div>
              </div>
              <div className="bg-slate-950/50 border border-slate-800 p-2 rounded-xl">
                <div className="text-slate-500 mb-1">Роль у мережі</div>
                <div className="text-xs font-bold text-slate-200">Тіньовий Бенефіціар</div>
              </div>
              <div className="bg-slate-950/50 border border-slate-800 p-2 rounded-xl">
                <div className="text-slate-500 mb-1">Медійний образ</div>
                <div className="text-xs font-bold text-rose-400">Токсичний (2021-2023)</div>
              </div>
              <div className="bg-slate-950/50 border border-slate-800 p-2 rounded-xl">
                <div className="text-slate-500 mb-1">Ключові партнери</div>
                <div className="text-xs font-bold text-slate-200">3 PEP, 2 Офшори</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Risk Prediction Engine */}
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-4">
          <div className="flex items-center gap-2 border-b border-slate-800/60 pb-2 mb-3">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Прогнозування Ризиків (Risk Engine)</h3>
          </div>
          <div className="space-y-3">
            {risks.map((risk, idx) => (
              <div key={idx} className="bg-slate-950/50 border border-slate-800 p-2.5 rounded-xl">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-bold text-slate-200">{risk.name}</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                    risk.probability > 75 ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                    risk.probability > 40 ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                    'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  }`}>
                    {risk.probability}%
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 flex items-start gap-1.5 mt-2 pt-2 border-t border-slate-800/50">
                  <AlertTriangle className="w-3 h-3 text-slate-500 mt-0.5 shrink-0" />
                  <span><strong className="text-slate-300">Фактор:</strong> {risk.factor}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline & Life Pattern */}
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-4">
          <div className="flex items-center gap-2 border-b border-slate-800/60 pb-2 mb-3">
            <Clock className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Патерни Життєвого Циклу</h3>
          </div>
          <div className="relative pl-4 border-l border-slate-800 space-y-4 my-4">
            <div className="relative">
              <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-slate-900"></div>
              <div className="text-[10px] font-mono text-slate-500 mb-0.5">2021-2022 (Цикл приховування)</div>
              <div className="text-xs text-slate-200">Масова зміна засновників компаній на осіб з реєстрацією на ТОТ.</div>
            </div>
            <div className="relative">
              <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-amber-500 border-2 border-slate-900"></div>
              <div className="text-[10px] font-mono text-slate-500 mb-0.5">Патерн Фінансів</div>
              <div className="text-xs text-slate-200">Регулярні транзакції (1-5 число місяця) на невідомі криптогаманці через P2P платформи.</div>
            </div>
            <div className="relative">
              <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-900"></div>
              <div className="text-[10px] font-mono text-slate-500 mb-0.5">Аномалія географії</div>
              <div className="text-xs text-slate-200">Незбіг місця реєстрації (Київ) та точок активності пристроїв (Одеса, Кіпр).</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
