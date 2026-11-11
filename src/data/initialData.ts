export interface BudgetAdjustment {
  id: string;
  type: 'add' | 'subtract';
  amount: number;
  dateISO: string;
  note: string;
  createdAt: string;
}

export interface BudgetItem {
  id: string;
  name: string;
  initialAmount: number;
  color: string;
  icon: string;
  adjustments: BudgetAdjustment[];
}

export interface BillItem {
  id: string;
  name: string;
  amount: number;
  category: 'online' | 'offline_debt';
  paid: boolean;
  paidDate?: string;
  note?: string;
  icon: string;
  budgetId?: string; // Budget auquel cette charge fixe est affectée
}

export interface DailyExpenseEntry {
  id: string;
  label: string;
  amount: number;
  time: string;
  budgetId?: string; // Budget auquel cette dépense est imputée
}

export interface DayRecord {
  dayIndex: number; // 1 to 30
  dateISO: string; // YYYY-MM-DD
  dateLabel: string; // e.g. "20/11/2026"
  weekday: string; // e.g. "vendredi"
  spent: number;
  note: string;
  entries: DailyExpenseEntry[];
}

export interface BudgetCycle {
  id: string;
  label: string; // e.g. "Cycle Nov - Déc 2026"
  startDateISO: string; // e.g. "2026-11-20"
  cycleDays: number; // 30
  salary: number; // 79800
  bills: BillItem[];
  days: DayRecord[];
  budgets?: BudgetItem[];
  archivedAt?: string;
}

const WEEKDAYS_FR = [
  'dimanche',
  'lundi',
  'mardi',
  'mercredi',
  'jeudi',
  'vendredi',
  'samedi',
];

export function getTodayISO(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function generateCycleDays(startDateISO: string, count = 30): DayRecord[] {
  const [y, m, d] = startDateISO.split('-').map(Number);
  const start = new Date(y, m - 1, d);
  const days: DayRecord[] = [];

  for (let i = 0; i < count; i++) {
    const cur = new Date(start);
    cur.setDate(start.getDate() + i);
    const yyyy = cur.getFullYear();
    const mm = String(cur.getMonth() + 1).padStart(2, '0');
    const dd = String(cur.getDate()).padStart(2, '0');
    const dayNum = cur.getDate();
    const monthNum = cur.getMonth() + 1;

    days.push({
      dayIndex: i + 1,
      dateISO: `${yyyy}-${mm}-${dd}`,
      dateLabel: `${dayNum}/${String(monthNum).padStart(2, '0')}/${yyyy}`,
      weekday: WEEKDAYS_FR[cur.getDay()],
      spent: 0,
      note: '',
      entries: [],
    });
  }
  return days;
}

export const DEFAULT_PRESET_LABELS: string[] = [
  'Courses / Supérette',
  'Boulangerie / Pain',
  'Fruits & Légumes',
  'Boucherie / Viande & Poulet',
  'Café / Resto / Déjeuner',
  'Pharmacie & Santé',
  'Transport / Taxi / Essence',
  'Maison & Entretien',
  'Imprévu / Divers',
];

export const DEFAULT_BUDGETS: BudgetItem[] = [
  {
    id: 'budget-food',
    name: 'Alimentation & Courses',
    initialAmount: 40000,
    color: '#10B981',
    icon: 'Utensils',
    adjustments: [],
  },
  {
    id: 'budget-charges',
    name: 'Logement & Charges',
    initialAmount: 10000,
    color: '#3B82F6',
    icon: 'Home',
    adjustments: [],
  },
  {
    id: 'budget-transport',
    name: 'Transport & Auto',
    initialAmount: 20000,
    color: '#F5B841',
    icon: 'Car',
    adjustments: [],
  },
  {
    id: 'budget-divers',
    name: 'Loisirs & Dépenses Perso',
    initialAmount: 9800,
    color: '#8B5CF6',
    icon: 'Sparkles',
    adjustments: [],
  },
];

export const INITIAL_BILLS: BillItem[] = [
  // Online (Dahabia)
  {
    id: 'bill-tel-net',
    name: 'Téléphone & internet',
    amount: 2500,
    category: 'online',
    paid: true,
    note: 'Idoom Fibre / 4G',
    icon: 'Wifi',
    budgetId: 'budget-charges',
  },
  {
    id: 'bill-flixi',
    name: 'Flixi',
    amount: 1000,
    category: 'online',
    paid: true,
    note: 'Forfait mobile mensuel',
    icon: 'Smartphone',
    budgetId: 'budget-charges',
  },
  {
    id: 'bill-sonelgaz-seaal',
    name: 'Gaz & électricité & Eau',
    amount: 2000,
    category: 'online',
    paid: false,
    note: 'Provision mensuelle Sonelgaz / SEAAL',
    icon: 'Zap',
    budgetId: 'budget-charges',
  },
  {
    id: 'bill-aadl',
    name: 'Charge aadl',
    amount: 2550,
    category: 'online',
    paid: false,
    note: 'Mensualité & charges Gest-Immo AADL',
    icon: 'Building2',
    budgetId: 'budget-charges',
  },
  {
    id: 'bill-essence',
    name: 'Essence',
    amount: 8000,
    category: 'online',
    paid: false,
    note: 'Carburant mensuel (Naftal / Carte)',
    icon: 'Fuel',
    budgetId: 'budget-transport',
  },
  {
    id: 'bill-maint-auto',
    name: 'Maintenance voiture',
    amount: 4000,
    category: 'online',
    paid: false,
    note: 'Épargne entretien périodique (Kia KX1)',
    icon: 'Wrench',
    budgetId: 'budget-transport',
  },
  // Charges Fixes (incluant Dettes RTA & Véhicule)
  {
    id: 'debt-rta',
    name: 'RTA DEBT',
    amount: 14166.67,
    category: 'online',
    paid: false,
    note: 'Mensualité RTA (170 000 / 12)',
    icon: 'Landmark',
    budgetId: 'budget-charges',
  },
  {
    id: 'debt-car',
    name: 'CAR DEBT',
    amount: 5583.33,
    category: 'online',
    paid: false,
    note: 'Mensualité crédit véhicule',
    icon: 'Car',
    budgetId: 'budget-transport',
  },
];

export const INITIAL_CURRENT_CYCLE: BudgetCycle = {
  id: 'cycle-nov-dec-2026',
  label: 'Cycle Nov – Déc 2026 (30J)',
  startDateISO: '2026-11-20',
  cycleDays: 30,
  salary: 79800,
  bills: INITIAL_BILLS,
  budgets: DEFAULT_BUDGETS,
  days: generateCycleDays('2026-11-20', 30),
};

const prevDays = generateCycleDays('2026-10-21', 30).map((d, idx) => {
  const sampleSpends = [
    1200, 950, 1800, 1100, 1400, 2100, 800,
    1350, 1200, 1600, 900, 1500, 1750, 1100,
    1300, 1450, 1000, 1900, 1250, 1150, 1600,
    850, 1400, 1300, 1700, 1100, 1250, 1500,
    1000, 1200,
  ];
  const s = sampleSpends[idx] ?? 1300;
  return {
    ...d,
    spent: s,
    note: idx % 4 === 0 ? 'Courses / Supérette' : idx % 3 === 0 ? 'Boulangerie / Pain' : 'Dépenses diverses',
    entries: [
      {
        id: `hist-${idx}`,
        label: idx % 4 === 0 ? 'Courses / Supérette' : 'Achats du jour',
        amount: s,
        time: '18:30',
      },
    ],
  };
});

export const INITIAL_HISTORY_CYCLES: BudgetCycle[] = [
  {
    id: 'cycle-oct-nov-2026',
    label: 'Cycle Oct – Nov 2026 (30J)',
    startDateISO: '2026-10-21',
    cycleDays: 30,
    salary: 79800,
    bills: INITIAL_BILLS.map((b) => ({ ...b, paid: true })),
    budgets: DEFAULT_BUDGETS,
    days: prevDays,
    archivedAt: '2026-11-19',
  },
];

export interface ComputedBudgetMetrics {
  id: string;
  name: string;
  initialAmount: number;
  color: string;
  icon: string;
  fixedChargesTotal: number;
  totalAdded: number;
  totalSubtracted: number;
  dailySpent: number;
  balance: number;
  adjustments: BudgetAdjustment[];
}

export interface ComputedCycleMetrics {
  salary: number;
  totalOnline: number;
  paidOnline: number;
  totalOfflineDebt: number;
  paidOfflineDebt: number;
  foodAndHouseBudget: number; // (Salary - Total Dahabia) - Total Offline Debt = 40,000 DA
  totalOffline: number; // Food & House + Offline Debts = 59,750 DA
  dailyBudget: number; // Food & House / 30 = 1,333.33 DA
  totalSpentDaily: number;
  remainingFoodAndHouse: number;
  daysWithCumulative: Array<
    DayRecord & {
      dailyBudget: number;
      dailyDelta: number; // dailyBudget - spent
      cumulativeBalance: number; // J(n-1) + H(n) - I(n)
      isToday: boolean;
    }
  >;
  budgetMetrics: Record<string, ComputedBudgetMetrics>;
  budgetList: ComputedBudgetMetrics[];
}

export function computeCycleMetrics(cycle: BudgetCycle): ComputedCycleMetrics {
  // Toutes les factures et dettes sont désormais des Charges Fixes
  const totalFixed = cycle.bills.reduce((acc, b) => acc + b.amount, 0);
  const paidFixed = cycle.bills.filter((b) => b.paid).reduce((acc, b) => acc + b.amount, 0);

  // Budget global restant après charges fixes
  const foodAndHouseBudget = Math.max(0, cycle.salary - totalFixed);
  // Budget quotidien : Total disponible ÷ 30 jours
  const daysCount = cycle.cycleDays > 0 ? cycle.cycleDays : 30;
  const dailyBudget = foodAndHouseBudget / daysCount;

  // Calcul par Budget individuel
  const budgets = cycle.budgets && cycle.budgets.length > 0 ? cycle.budgets : DEFAULT_BUDGETS;
  const budgetList: ComputedBudgetMetrics[] = budgets.map((b) => {
    // 1. Charges fixes affectées à ce budget (automatiquement soustraites)
    const assignedBills = cycle.bills.filter((bill) => bill.budgetId === b.id);
    const fixedChargesTotal = assignedBills.reduce((acc, bill) => acc + bill.amount, 0);

    // 2. Ajustements d'argent (+ ajouter, - soustraire)
    const adjs = b.adjustments || [];
    const totalAdded = adjs
      .filter((a) => a.type === 'add')
      .reduce((acc, a) => acc + a.amount, 0);
    const totalSubtracted = adjs
      .filter((a) => a.type === 'subtract')
      .reduce((acc, a) => acc + a.amount, 0);

    // 3. Dépenses quotidiennes imputées sur ce budget
    let dailySpent = 0;
    cycle.days.forEach((day) => {
      day.entries.forEach((entry) => {
        if (entry.budgetId === b.id) {
          dailySpent += entry.amount;
        }
      });
    });

    const balance = b.initialAmount - fixedChargesTotal + totalAdded - totalSubtracted - dailySpent;

    return {
      id: b.id,
      name: b.name,
      initialAmount: b.initialAmount,
      color: b.color || '#F5B841',
      icon: b.icon || 'Wallet',
      fixedChargesTotal,
      totalAdded,
      totalSubtracted,
      dailySpent,
      balance,
      adjustments: adjs,
    };
  });

  const budgetMetrics: Record<string, ComputedBudgetMetrics> = {};
  budgetList.forEach((bm) => {
    budgetMetrics[bm.id] = bm;
  });

  const todayISO = getTodayISO();
  let runningCumulative = 0;
  let totalSpentDaily = 0;

  const daysWithCumulative = cycle.days.map((d) => {
    const dailyDelta = dailyBudget - d.spent;
    runningCumulative = runningCumulative + dailyBudget - d.spent;
    totalSpentDaily += d.spent;
    return {
      ...d,
      dailyBudget,
      dailyDelta,
      cumulativeBalance: runningCumulative,
      isToday: d.dateISO === todayISO,
    };
  });

  return {
    salary: cycle.salary,
    totalOnline: totalFixed,
    paidOnline: paidFixed,
    totalOfflineDebt: 0,
    paidOfflineDebt: 0,
    foodAndHouseBudget,
    totalOffline: totalFixed,
    dailyBudget,
    totalSpentDaily,
    remainingFoodAndHouse: foodAndHouseBudget - totalSpentDaily,
    daysWithCumulative,
    budgetMetrics,
    budgetList,
  };
}

export function formatDA(value: number, decimals = 2): string {
  return (
    value.toLocaleString('fr-FR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }) + ' DA'
  );
}
