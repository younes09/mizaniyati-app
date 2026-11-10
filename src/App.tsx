import React, { useState, useEffect, useMemo } from 'react';
import {
  Wallet,
  Calendar,
  Receipt,
  TrendingUp,
  Smartphone,
  Plus,
  Check,
  Trash2,
  RotateCcw,
  Download,
  Upload,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  CreditCard,
  Banknote,
  Edit3,
  Archive,
  CheckCircle2,
  Tag,
  Clock,
} from 'lucide-react';
import {
  BudgetCycle,
  BillItem,
  DEFAULT_PRESET_LABELS,
  INITIAL_CURRENT_CYCLE,
  INITIAL_HISTORY_CYCLES,
  computeCycleMetrics,
  formatDA,
  generateCycleDays,
  getTodayISO,
} from './data/initialData';

const STORAGE_KEY_CURRENT = 'lifecost_current_cycle_v2';
const STORAGE_KEY_HISTORY = 'lifecost_history_cycles_v2';
const STORAGE_KEY_LABELS = 'lifecost_custom_labels_v2';

type ActiveTab = 'daily' | 'bills' | 'history' | 'settings';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('daily');

  const [currentCycle, setCurrentCycle] = useState<BudgetCycle>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CURRENT);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_CURRENT_CYCLE;
  });

  const [historyCycles, setHistoryCycles] = useState<BudgetCycle[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_HISTORY_CYCLES;
  });

  // Persistent preset & custom labels for the dropdown
  const [availableLabels, setAvailableLabels] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LABELS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEFAULT_PRESET_LABELS;
  });

  // Determine initial day selection: automatic according to today's date
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(() => {
    const today = getTodayISO();
    const idx = currentCycle.days.findIndex((d) => d.dateISO === today);
    return idx !== -1 ? idx : 0;
  });

  // Expense form state
  const [selectedPresetLabel, setSelectedPresetLabel] = useState<string>(
    availableLabels[0] || 'Courses / Supérette'
  );
  const [customLabelInput, setCustomLabelInput] = useState<string>('');
  const [isFreeTypeLabel, setIsFreeTypeLabel] = useState<boolean>(false);
  const [expenseAmountInput, setExpenseAmountInput] = useState<string>('');

  // Modals / Editing state
  const [editingSalary, setEditingSalary] = useState<boolean>(false);
  const [salaryInput, setSalaryInput] = useState<string>(String(currentCycle.salary));

  const [showAddBillModal, setShowAddBillModal] = useState<boolean>(false);
  const [newBillName, setNewBillName] = useState<string>('');
  const [newBillAmount, setNewBillAmount] = useState<string>('');
  const [newBillCategory, setNewBillCategory] = useState<'online' | 'offline_debt'>('online');
  const [newBillNote, setNewBillNote] = useState<string>('');

  const [showNewCycleModal, setShowNewCycleModal] = useState<boolean>(false);
  const [newCycleLabel, setNewCycleLabel] = useState<string>('Cycle Déc 2026 – Jan 2027 (30J)');
  const [newCycleStartDate, setNewCycleStartDate] = useState<string>('2026-12-20');

  const [newCustomLabelToAdd, setNewCustomLabelToAdd] = useState<string>('');
  const [showManageLabels, setShowManageLabels] = useState<boolean>(false);

  const [viewingHistoryCycleId, setViewingHistoryCycleId] = useState<string | null>(null);

  // Persistence effects
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CURRENT, JSON.stringify(currentCycle));
    } catch {
      // ignore
    }
  }, [currentCycle]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(historyCycles));
    } catch {
      // ignore
    }
  }, [historyCycles]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LABELS, JSON.stringify(availableLabels));
    } catch {
      // ignore
    }
  }, [availableLabels]);

  // Automatic day selection when cycle changes
  useEffect(() => {
    const today = getTodayISO();
    const todayIdx = currentCycle.days.findIndex((d) => d.dateISO === today);
    if (todayIdx !== -1) {
      setSelectedDayIdx(todayIdx);
    }
  }, [currentCycle.startDateISO]);

  const metrics = useMemo(() => computeCycleMetrics(currentCycle), [currentCycle]);

  const selectedDay =
    metrics.daysWithCumulative[selectedDayIdx] ?? metrics.daysWithCumulative[0];

  const todayIndexInCycle = useMemo(() => {
    const today = getTodayISO();
    return currentCycle.days.findIndex((d) => d.dateISO === today);
  }, [currentCycle.days]);

  // Jump to today helper
  const handleJumpToToday = () => {
    if (todayIndexInCycle !== -1) {
      setSelectedDayIdx(todayIndexInCycle);
    }
  };

  // Add expense entry to selected day
  const handleAddExpense = (amountValue?: number, overrideLabel?: string) => {
    const rawAmount =
      amountValue !== undefined ? amountValue : parseFloat(expenseAmountInput.replace(',', '.'));
    if (isNaN(rawAmount) || rawAmount <= 0) return;

    let finalLabel = overrideLabel;
    if (!finalLabel) {
      if (isFreeTypeLabel) {
        finalLabel = customLabelInput.trim() || `Dépense J${selectedDay.dayIndex}`;
      } else {
        finalLabel = selectedPresetLabel;
      }
    }

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    setCurrentCycle((prev) => {
      const updatedDays = prev.days.map((d, idx) => {
        if (idx !== selectedDayIdx) return d;
        const newEntry = {
          id: `exp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          label: finalLabel!,
          amount: rawAmount,
          time: timeStr,
        };
        const updatedEntries = [...(d.entries || []), newEntry];
        const totalSpent = updatedEntries.reduce((s, e) => s + e.amount, 0);
        return {
          ...d,
          spent: totalSpent,
          note: updatedEntries.map((e) => e.label).join(', '),
          entries: updatedEntries,
        };
      });
      return { ...prev, days: updatedDays };
    });

    if (amountValue === undefined) {
      setExpenseAmountInput('');
      if (isFreeTypeLabel) setCustomLabelInput('');
    }
  };

  // Save new custom label to the persistent dropdown list
  const handleSaveCustomLabelToPresets = (labelToSave?: string) => {
    const text = (labelToSave || customLabelInput || newCustomLabelToAdd).trim();
    if (!text) return;
    if (!availableLabels.includes(text)) {
      setAvailableLabels((prev) => [...prev, text]);
    }
    setSelectedPresetLabel(text);
    setIsFreeTypeLabel(false);
    setNewCustomLabelToAdd('');
    setCustomLabelInput('');
  };

  const handleRemoveCustomLabel = (labelToRemove: string) => {
    setAvailableLabels((prev) => prev.filter((l) => l !== labelToRemove));
    if (selectedPresetLabel === labelToRemove) {
      setSelectedPresetLabel(availableLabels[0] || 'Dépense');
    }
  };

  const handleSetDayDirectTotal = (idx: number, newTotal: number) => {
    const clean = Math.max(0, isNaN(newTotal) ? 0 : newTotal);
    setCurrentCycle((prev) => {
      const updatedDays = prev.days.map((d, i) => {
        if (i !== idx) return d;
        return {
          ...d,
          spent: clean,
          entries:
            clean > 0
              ? [
                  {
                    id: `direct-${Date.now()}`,
                    label: d.note || 'Total journée',
                    amount: clean,
                    time: '--:--',
                  },
                ]
              : [],
        };
      });
      return { ...prev, days: updatedDays };
    });
  };

  const handleDeleteExpenseEntry = (dayIdx: number, entryId: string) => {
    setCurrentCycle((prev) => {
      const updatedDays = prev.days.map((d, i) => {
        if (i !== dayIdx) return d;
        const updatedEntries = (d.entries || []).filter((e) => e.id !== entryId);
        const totalSpent = updatedEntries.reduce((s, e) => s + e.amount, 0);
        return {
          ...d,
          spent: totalSpent,
          note: updatedEntries.map((e) => e.label).join(', '),
          entries: updatedEntries,
        };
      });
      return { ...prev, days: updatedDays };
    });
  };

  const toggleBillPaid = (billId: string) => {
    setCurrentCycle((prev) => ({
      ...prev,
      bills: prev.bills.map((b) => (b.id === billId ? { ...b, paid: !b.paid } : b)),
    }));
  };

  const handleDeleteBill = (billId: string) => {
    setCurrentCycle((prev) => ({
      ...prev,
      bills: prev.bills.filter((b) => b.id !== billId),
    }));
  };

  const handleAddBill = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(newBillAmount.replace(',', '.'));
    if (!newBillName.trim() || isNaN(amt) || amt <= 0) return;

    const newItem: BillItem = {
      id: `bill-${Date.now()}`,
      name: newBillName.trim(),
      amount: amt,
      category: 'online',
      paid: false,
      note: newBillNote.trim() || 'Charge Fixe',
      icon: 'CreditCard',
    };

    setCurrentCycle((prev) => ({
      ...prev,
      bills: [...prev.bills, newItem],
    }));
    setNewBillName('');
    setNewBillAmount('');
    setNewBillNote('');
    setShowAddBillModal(false);
  };

  const handleSaveSalary = () => {
    const val = parseFloat(salaryInput.replace(',', '.'));
    if (!isNaN(val) && val > 0) {
      setCurrentCycle((prev) => ({ ...prev, salary: val }));
    }
    setEditingSalary(false);
  };

  const handleArchiveAndStartNewCycle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCycleStartDate) return;

    const archivedCopy: BudgetCycle = {
      ...currentCycle,
      id: `${currentCycle.id}-${Date.now()}`,
      archivedAt: new Date().toISOString().slice(0, 10),
    };

    setHistoryCycles((prev) => [archivedCopy, ...prev]);

    const nextCycle: BudgetCycle = {
      id: `cycle-${Date.now()}`,
      label: newCycleLabel.trim() || `Cycle ${newCycleStartDate} (30J)`,
      startDateISO: newCycleStartDate,
      cycleDays: 30,
      salary: currentCycle.salary,
      bills: currentCycle.bills.map((b) => ({ ...b, paid: false })),
      days: generateCycleDays(newCycleStartDate, 30),
    };

    setCurrentCycle(nextCycle);
    setSelectedDayIdx(0);
    setShowNewCycleModal(false);
  };

  const handleResetToSheetDefaults = () => {
    setCurrentCycle(INITIAL_CURRENT_CYCLE);
    setHistoryCycles(INITIAL_HISTORY_CYCLES);
    setAvailableLabels(DEFAULT_PRESET_LABELS);
    setSelectedDayIdx(0);
  };

  const handleExportJSON = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      currentCycle,
      historyCycles,
      availableLabels,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mizaniyati-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(String(ev.target?.result));
        if (parsed.currentCycle) setCurrentCycle(parsed.currentCycle);
        if (parsed.historyCycles) setHistoryCycles(parsed.historyCycles);
        if (parsed.availableLabels) setAvailableLabels(parsed.availableLabels);
      } catch {
        // ignore invalid json
      }
    };
    reader.readAsText(file);
  };

  const fixedBills = currentCycle.bills;
  const fixedProgressPct =
    metrics.totalOnline > 0
      ? Math.min(100, Math.round((metrics.paidOnline / metrics.totalOnline) * 100))
      : 0;

  return (
    <div className="app-shell">
      {/* Sticky Top Header */}
      <header className="top-header">
        <div className="brand-group">
          <div className="brand-badge">
            <Wallet size={20} />
          </div>
          <div>
            <div className="brand-title">
              Mizaniyati
              <span className="cycle-pill">Cycle 30J</span>
            </div>
            <div className="brand-subtitle">
              Salaire: {formatDA(metrics.salary, 0)} • Budget: {formatDA(metrics.dailyBudget, 0)}/jr
            </div>
          </div>
        </div>
        <div className="header-actions">
          {todayIndexInCycle !== -1 && (
            <button
              className="btn-secondary"
              style={{
                padding: '5px 9px',
                fontSize: '0.72rem',
                gap: 4,
                borderColor: selectedDay.isToday ? '#10B981' : undefined,
                color: selectedDay.isToday ? '#10B981' : undefined,
              }}
              onClick={handleJumpToToday}
              title="Sélectionner la date d'aujourd'hui"
            >
              <Clock size={13} />
              Aujourd'hui
            </button>
          )}
          <button
            className="icon-btn"
            title="Nouveau cycle 30 jours"
            onClick={() => setShowNewCycleModal(true)}
          >
            <Archive size={17} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {activeTab === 'daily' && (
          <>
            {/* Hero Cumulative Balance Vault Card */}
            <section className="vault-card">
              <div className="vault-top-row">
                <span className="vault-label">
                  <Sparkles size={14} color="#F5B841" />
                  Solde Cumulé (Jour {selectedDay.dayIndex}/30)
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <button
                    className="icon-btn"
                    style={{ width: 26, height: 26, borderRadius: 7 }}
                    onClick={() => setSelectedDayIdx((i) => Math.max(0, i - 1))}
                    disabled={selectedDayIdx === 0}
                    title="Jour précédent"
                  >
                    <ChevronLeft size={15} />
                  </button>
                  <span className="day-selector-chip">
                    {selectedDay.weekday} {selectedDay.dateLabel.slice(0, 5)}
                    {selectedDay.isToday && <span className="today-pill">Auj.</span>}
                  </span>
                  <button
                    className="icon-btn"
                    style={{ width: 26, height: 26, borderRadius: 7 }}
                    onClick={() =>
                      setSelectedDayIdx((i) =>
                        Math.min(metrics.daysWithCumulative.length - 1, i + 1)
                      )
                    }
                    disabled={selectedDayIdx === metrics.daysWithCumulative.length - 1}
                    title="Jour suivant"
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>

              <div
                className={`vault-balance ${
                  selectedDay.cumulativeBalance >= 0 ? 'positive' : 'negative'
                }`}
              >
                {selectedDay.cumulativeBalance >= 0 ? '+' : ''}
                {formatDA(selectedDay.cumulativeBalance)}
              </div>

              <div className="vault-formula-hint">
                <span>
                  Solde J{selectedDay.dayIndex - 1} +{' '}
                  <strong>{formatDA(metrics.dailyBudget, 2)}</strong> (Budget/30J) − Dépense J
                  {selectedDay.dayIndex} (<strong>{formatDA(selectedDay.spent, 0)}</strong>)
                </span>
              </div>

              {/* Food & House (Calculé auto) — Affiché uniquement sur la première page */}
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.22)',
                  borderRadius: 'var(--radius-md)',
                  padding: '9px 12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 10,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: '0.68rem',
                      color: '#10B981',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Food & House (Calculé auto)
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                    Salaire − Charges Fixes (30J)
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      color: '#10B981',
                      fontSize: '0.95rem',
                    }}
                  >
                    {formatDA(metrics.foodAndHouseBudget, 0)}
                  </div>
                  <div style={{ fontSize: '0.70rem', color: 'var(--text-muted)' }}>
                    soit {formatDA(metrics.dailyBudget, 0)} / jour
                  </div>
                </div>
              </div>

              <div className="vault-metrics-grid">
                <div className="vault-mini-stat">
                  <div className="vault-mini-label">Budget / Jour (30J)</div>
                  <div className="vault-mini-val" style={{ color: '#F5B841' }}>
                    {formatDA(metrics.dailyBudget, 0)}
                  </div>
                </div>
                <div className="vault-mini-stat">
                  <div className="vault-mini-label">Dépensé (30j)</div>
                  <div className="vault-mini-val" style={{ color: '#F8FAFC' }}>
                    {formatDA(metrics.totalSpentDaily, 0)}
                  </div>
                </div>
                <div className="vault-mini-stat">
                  <div className="vault-mini-label">Reste Food&House</div>
                  <div
                    className="vault-mini-val"
                    style={{
                      color: metrics.remainingFoodAndHouse >= 0 ? '#10B981' : '#F43F5E',
                    }}
                  >
                    {formatDA(metrics.remainingFoodAndHouse, 0)}
                  </div>
                </div>
              </div>
            </section>

            {/* Quick Expense Entry for Selected Day */}
            <section className="section-card">
              <div className="section-header">
                <div className="section-title">
                  <Plus size={17} color="#F5B841" />
                  Saisie Dépense — {selectedDay.weekday} {selectedDay.dateLabel}
                  {selectedDay.isToday && <span className="today-pill">Aujourd'hui</span>}
                </div>
                <span
                  className={`badge-tag ${
                    selectedDay.dailyDelta >= 0 ? 'emerald' : 'coral'
                  }`}
                >
                  {selectedDay.dailyDelta >= 0 ? 'Économie ' : 'Dépassement '}
                  {selectedDay.dailyDelta >= 0 ? '+' : ''}
                  {Math.round(selectedDay.dailyDelta)} DA
                </span>
              </div>

              {/* 1-Tap Quick Chips */}
              <div className="quick-chips-row">
                {[100, 250, 500, 1000, 1333].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    className="quick-chip"
                    onClick={() => handleAddExpense(amt, isFreeTypeLabel ? customLabelInput : selectedPresetLabel)}
                  >
                    +{amt} DA
                  </button>
                ))}
              </div>

              {/* Dropdown Menu for Labels + Custom addition */}
              <div className="expense-input-group">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      Libellé de la dépense :
                    </label>
                    <button
                      type="button"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--gold-primary)',
                        fontSize: '0.72rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                      onClick={() => setShowManageLabels(!showManageLabels)}
                    >
                      <Tag size={12} />
                      {showManageLabels ? 'Fermer la liste' : 'Gérer les libellés'}
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <select
                      className="select-field"
                      value={isFreeTypeLabel ? '__custom__' : selectedPresetLabel}
                      onChange={(e) => {
                        if (e.target.value === '__custom__') {
                          setIsFreeTypeLabel(true);
                        } else {
                          setIsFreeTypeLabel(false);
                          setSelectedPresetLabel(e.target.value);
                        }
                      }}
                      style={{ flex: 1 }}
                    >
                      <optgroup label="📋 Libellés pré-remplis">
                        {availableLabels.map((lbl) => (
                          <option key={lbl} value={lbl}>
                            {lbl}
                          </option>
                        ))}
                      </optgroup>
                      <option value="__custom__">➕ Nouveau libellé (saisie libre)...</option>
                    </select>
                  </div>

                  {/* Free-typing field when + Nouveau libellé is chosen */}
                  {isFreeTypeLabel && (
                    <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="Tape ton nouveau libellé..."
                        value={customLabelInput}
                        onChange={(e) => setCustomLabelInput(e.target.value)}
                        autoFocus
                      />
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ whiteSpace: 'nowrap', fontSize: '0.75rem', padding: '8px 10px' }}
                        onClick={() => handleSaveCustomLabelToPresets()}
                        title="Sauvegarder dans la liste déroulante"
                      >
                        + Mémoriser
                      </button>
                    </div>
                  )}

                  {/* Drawer for Managing / Adding Custom Labels */}
                  {showManageLabels && (
                    <div
                      style={{
                        background: 'var(--bg-obsidian)',
                        border: '1px solid var(--border-gold)',
                        borderRadius: 10,
                        padding: 10,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                        marginTop: 4,
                      }}
                    >
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#F5B841' }}>
                        Ajouter / Supprimer des libellés de la liste :
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <input
                          type="text"
                          className="input-field"
                          placeholder="Nouveau libellé (ex: Salle de sport, Café...)"
                          value={newCustomLabelToAdd}
                          onChange={(e) => setNewCustomLabelToAdd(e.target.value)}
                        />
                        <button
                          type="button"
                          className="btn-primary"
                          style={{ padding: '8px 12px', fontSize: '0.75rem' }}
                          onClick={() => handleSaveCustomLabelToPresets(newCustomLabelToAdd)}
                        >
                          Ajouter
                        </button>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 120, overflowY: 'auto' }}>
                        {availableLabels.map((lbl) => (
                          <span
                            key={lbl}
                            style={{
                              background: 'var(--bg-elevated)',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: 6,
                              padding: '3px 8px',
                              fontSize: '0.72rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                            }}
                          >
                            {lbl}
                            <button
                              type="button"
                              onClick={() => handleRemoveCustomLabel(lbl)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#F43F5E',
                                cursor: 'pointer',
                                padding: 0,
                              }}
                              title="Supprimer ce libellé"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Amount input & Submit */}
                <div className="input-row">
                  <input
                    type="number"
                    inputMode="decimal"
                    className="input-field mono"
                    placeholder="Montant en DA (ex: 650)"
                    value={expenseAmountInput}
                    onChange={(e) => setExpenseAmountInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddExpense();
                    }}
                    style={{ flex: '1.2' }}
                  />
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => handleAddExpense()}
                    style={{ flex: '0.8' }}
                  >
                    Ajouter
                  </button>
                </div>

                {/* Selected Day Entries List or Direct Override */}
                {selectedDay.entries && selectedDay.entries.length > 0 ? (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                      marginTop: 6,
                      paddingTop: 8,
                      borderTop: '1px solid var(--border-subtle)',
                    }}
                  >
                    {selectedDay.entries.map((entry) => (
                      <div
                        key={entry.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '0.8rem',
                          background: 'var(--bg-obsidian)',
                          padding: '7px 10px',
                          borderRadius: 8,
                        }}
                      >
                        <div>
                          <span style={{ fontWeight: 600 }}>{entry.label}</span>
                          <span
                            style={{
                              color: 'var(--text-muted)',
                              fontSize: '0.7rem',
                              marginLeft: 8,
                            }}
                          >
                            {entry.time}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontWeight: 700,
                              color: '#F43F5E',
                            }}
                          >
                            -{formatDA(entry.amount, 0)}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteExpenseEntry(selectedDayIdx, entry.id)
                            }
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                            }}
                            title="Supprimer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: 2,
                      }}
                    >
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        Total dépensé J{selectedDay.dayIndex} :{' '}
                        <strong>{formatDA(selectedDay.spent, 0)}</strong>
                      </span>
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ padding: '4px 9px', fontSize: '0.72rem' }}
                        onClick={() => handleSetDayDirectTotal(selectedDayIdx, 0)}
                      >
                        Remettre à 0 DA
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                      textAlign: 'center',
                      padding: '4px 0',
                    }}
                  >
                    Aucune dépense enregistrée pour ce jour (+{formatDA(metrics.dailyBudget, 2)}{' '}
                    ajoutés au solde cumulé).
                  </div>
                )}
              </div>
            </section>

            {/* Full 30-Day Calendar List */}
            <section className="section-card">
              <div className="section-header">
                <div className="section-title">
                  <Calendar size={17} color="#10B981" />
                  Calendrier du Cycle (30 Jours)
                </div>
                {todayIndexInCycle !== -1 && (
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                    onClick={handleJumpToToday}
                  >
                    📍 Voir Aujourd'hui
                  </button>
                )}
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.2fr 0.9fr 1.1fr',
                  padding: '0 12px 6px',
                  fontSize: '0.69rem',
                  color: 'var(--text-muted)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                }}
              >
                <span>Date / Jour</span>
                <span style={{ textAlign: 'right' }}>Dépense</span>
                <span style={{ textAlign: 'right' }}>Solde Cumulé</span>
              </div>

              <div className="days-list">
                {metrics.daysWithCumulative.map((d, idx) => {
                  const isSelected = idx === selectedDayIdx;
                  return (
                    <div
                      key={d.dayIndex}
                      className={`day-row ${isSelected ? 'selected' : ''} ${
                        d.isToday ? 'is-today' : ''
                      }`}
                      onClick={() => setSelectedDayIdx(idx)}
                    >
                      <div className="day-row-left">
                        <div className="day-badge">J{d.dayIndex}</div>
                        <div>
                          <div className="day-date-text">
                            {d.dateLabel}
                            {d.isToday && <span className="today-pill" style={{ marginLeft: 6 }}>Auj.</span>}
                          </div>
                          <div className="day-weekday-text">
                            {d.weekday}
                            {d.note ? ` • ${d.note.slice(0, 16)}` : ''}
                          </div>
                        </div>
                      </div>

                      <div
                        className="day-spent-col"
                        style={{
                          color:
                            d.spent === 0
                              ? 'var(--text-muted)'
                              : d.spent > d.dailyBudget
                              ? 'var(--coral)'
                              : 'var(--text-primary)',
                        }}
                      >
                        {d.spent > 0 ? `-${formatDA(d.spent, 0)}` : '0 DA'}
                      </div>

                      <div
                        className="day-cumul-col"
                        style={{
                          color:
                            d.cumulativeBalance >= 0 ? 'var(--emerald)' : 'var(--coral)',
                        }}
                      >
                        {formatDA(d.cumulativeBalance, 2)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}

        {activeTab === 'bills' && (
          <>
            {/* Salary & Waterfall Formula Card */}
            <section className="waterfall-banner">
              <div className="section-header" style={{ marginBottom: 0 }}>
                <div className="section-title">
                  <Banknote size={18} color="#F5B841" />
                  Salaire & Répartition Automatique (30J)
                </div>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setSalaryInput(String(currentCycle.salary));
                    setEditingSalary(!editingSalary);
                  }}
                >
                  <Edit3 size={13} />
                  Modifier Salaire
                </button>
              </div>

              {editingSalary && (
                <div className="input-row" style={{ marginTop: 4 }}>
                  <input
                    type="number"
                    className="input-field mono"
                    value={salaryInput}
                    onChange={(e) => setSalaryInput(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handleSaveSalary}
                  >
                    OK
                  </button>
                </div>
              )}

              <div className="waterfall-formula-box">
                <div className="formula-line">
                  <span style={{ color: 'var(--text-secondary)' }}>
                    Salaire
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                    {formatDA(metrics.salary)}
                  </span>
                </div>
                <div className="formula-line">
                  <span style={{ color: 'var(--text-secondary)' }}>
                    − Charges Fixes ({fixedBills.length})
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--gold-primary)',
                    }}
                  >
                    − {formatDA(metrics.totalOnline)}
                  </span>
                </div>
                <div className="formula-line total">
                  <span>Payé sur charges fixes</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--emerald)' }}>
                    {formatDA(metrics.paidOnline)}
                  </span>
                </div>
              </div>
            </section>

            {/* Charges Fixes (Section unique conservée) */}
            <section className="section-card">
              <div className="section-header">
                <div>
                  <div className="section-title">
                    <CreditCard size={17} color="#F5B841" />
                    Charges Fixes
                  </div>
                  <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                    Payé : {formatDA(metrics.paidOnline, 0)} / {formatDA(metrics.totalOnline, 0)} (
                    {fixedProgressPct}%)
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ padding: '7px 11px', fontSize: '0.78rem' }}
                  onClick={() => setShowAddBillModal(true)}
                >
                  <Plus size={14} /> Charge Fixe
                </button>
              </div>

              <div className="progress-track" style={{ marginBottom: 12 }}>
                <div
                  className="progress-fill"
                  style={{
                    width: `${fixedProgressPct}%`,
                    background: 'linear-gradient(90deg, #F5B841, #10B981)',
                  }}
                />
              </div>

              <div className="bill-list">
                {fixedBills.map((bill) => (
                  <div
                    key={bill.id}
                    className={`bill-item ${bill.paid ? 'paid' : ''}`}
                    onClick={() => toggleBillPaid(bill.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="bill-left">
                      <button
                        type="button"
                        className="check-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleBillPaid(bill.id);
                        }}
                      >
                        <Check size={15} strokeWidth={3} />
                      </button>
                      <div className="bill-info">
                        <div className="bill-name">{bill.name}</div>
                        <div className="bill-note">
                          {bill.paid ? '✓ Réglé' : bill.note || 'En attente de règlement'}
                        </div>
                      </div>
                    </div>

                    <div className="bill-right">
                      <span
                        className="bill-amount"
                        style={{ color: bill.paid ? 'var(--emerald)' : 'var(--gold-primary)' }}
                      >
                        {formatDA(bill.amount)}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteBill(bill.id);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: 4,
                        }}
                        title="Supprimer cette charge"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {activeTab === 'history' && (
          <>
            {/* Interactive Evolution Chart of Cumulative Balance */}
            <section className="section-card">
              <div className="section-header">
                <div>
                  <div className="section-title">
                    <TrendingUp size={17} color="#10B981" />
                    Courbe du Solde Cumulé (30 Jours)
                  </div>
                  <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                    Vert = Solde cumulé réel • Pointillés = Cumul théorique sans dépense
                  </div>
                </div>
              </div>

              <div className="chart-svg-wrap">
                {(() => {
                  const maxVal = Math.max(
                    metrics.foodAndHouseBudget,
                    ...metrics.daysWithCumulative.map((d) => Math.abs(d.cumulativeBalance)),
                    10000
                  );
                  const w = 380;
                  const h = 165;
                  const padLeft = 38;
                  const padRight = 12;
                  const padTop = 12;
                  const padBottom = 24;
                  const plotW = w - padLeft - padRight;
                  const plotH = h - padTop - padBottom;

                  const xFor = (i: number) =>
                    padLeft + (i / Math.max(1, metrics.daysWithCumulative.length - 1)) * plotW;
                  const yFor = (val: number) =>
                    padTop + plotH - Math.max(0, Math.min(1, val / maxVal)) * plotH;

                  const actualPoints = metrics.daysWithCumulative
                    .map((d, i) => `${xFor(i).toFixed(1)},${yFor(d.cumulativeBalance).toFixed(1)}`)
                    .join(' ');

                  const idealPoints = metrics.daysWithCumulative
                    .map(
                      (d, i) =>
                        `${xFor(i).toFixed(1)},${yFor((i + 1) * d.dailyBudget).toFixed(1)}`
                    )
                    .join(' ');

                  return (
                    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 'auto' }}>
                      {/* Grid lines */}
                      {[0, 0.25, 0.5, 0.75, 1].map((t) => {
                        const y = padTop + plotH * (1 - t);
                        const labelVal = Math.round((maxVal * t) / 1000) + 'k';
                        return (
                          <g key={t}>
                            <line
                              x1={padLeft}
                              y1={y}
                              x2={w - padRight}
                              y2={y}
                              stroke="rgba(148,163,184,0.12)"
                              strokeDasharray="3 3"
                            />
                            <text
                              x={padLeft - 6}
                              y={y + 3}
                              textAnchor="end"
                              fill="#64748B"
                              fontSize="9"
                              fontFamily="JetBrains Mono"
                            >
                              {labelVal}
                            </text>
                          </g>
                        );
                      })}

                      {/* Ideal line (0 expense) */}
                      <polyline
                        fill="none"
                        stroke="rgba(245, 184, 65, 0.45)"
                        strokeWidth="1.8"
                        strokeDasharray="4 4"
                        points={idealPoints}
                      />

                      {/* Actual Cumulative Balance Line */}
                      <polyline
                        fill="none"
                        stroke="#10B981"
                        strokeWidth="2.6"
                        points={actualPoints}
                      />

                      {/* Daily Spend Bars at bottom */}
                      {metrics.daysWithCumulative.map((d, i) => {
                        const barH = Math.min(plotH, (d.spent / maxVal) * plotH * 3.5);
                        return (
                          <rect
                            key={d.dayIndex}
                            x={xFor(i) - 3}
                            y={padTop + plotH - barH}
                            width={6}
                            height={Math.max(0, barH)}
                            rx={2}
                            fill={d.spent > d.dailyBudget ? '#F43F5E' : '#F5B841'}
                            opacity={0.75}
                          />
                        );
                      })}

                      {/* X Axis Labels */}
                      {[0, 7, 14, 21, 29].map((idx) => {
                        const dayObj = metrics.daysWithCumulative[idx];
                        if (!dayObj) return null;
                        return (
                          <text
                            key={idx}
                            x={xFor(idx)}
                            y={h - 6}
                            textAnchor="middle"
                            fill="#94A3B8"
                            fontSize="9"
                            fontFamily="JetBrains Mono"
                          >
                            J{dayObj.dayIndex} ({dayObj.dateLabel.slice(0, 5)})
                          </text>
                        );
                      })}
                    </svg>
                  );
                })()}
              </div>
            </section>

            {/* Salary Breakdown Visualization */}
            <section className="section-card">
              <div className="section-header">
                <div className="section-title">Répartition du Salaire ({formatDA(metrics.salary, 0)})</div>
              </div>
              {(() => {
                const pFixed = Math.min(100, Math.round((metrics.totalOnline / metrics.salary) * 100));
                const pFood = Math.max(0, 100 - pFixed);
                return (
                  <>
                    <div
                      style={{
                        display: 'flex',
                        height: 14,
                        borderRadius: 999,
                        overflow: 'hidden',
                        gap: 3,
                        marginBottom: 12,
                      }}
                    >
                      <div style={{ width: `${pFixed}%`, background: '#F5B841' }} />
                      <div style={{ width: `${pFood}%`, background: '#10B981' }} />
                    </div>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: 8,
                        fontSize: '0.75rem',
                      }}
                    >
                      <div className="vault-mini-stat">
                        <div style={{ color: '#F5B841', fontWeight: 700 }}>Charges Fixes ({pFixed}%)</div>
                        <div className="vault-mini-val">{formatDA(metrics.totalOnline, 0)}</div>
                      </div>
                      <div className="vault-mini-stat">
                        <div style={{ color: '#10B981', fontWeight: 700 }}>Budget Quotidien ({pFood}%)</div>
                        <div className="vault-mini-val">{formatDA(metrics.foodAndHouseBudget, 0)}</div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </section>

            {/* Archived Cycles History */}
            <section className="section-card">
              <div className="section-header">
                <div className="section-title">
                  <Archive size={17} color="#F5B841" />
                  Historique des Cycles (30 Jours)
                </div>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ padding: '6px 11px', fontSize: '0.76rem' }}
                  onClick={() => setShowNewCycleModal(true)}
                >
                  + Nouveau Cycle
                </button>
              </div>

              <div className="bill-list">
                {historyCycles.map((hCycle) => {
                  const hMetrics = computeCycleMetrics(hCycle);
                  const finalCumul =
                    hMetrics.daysWithCumulative[hMetrics.daysWithCumulative.length - 1]
                      ?.cumulativeBalance ?? 0;
                  const isExpanded = viewingHistoryCycleId === hCycle.id;

                  return (
                    <div
                      key={hCycle.id}
                      style={{
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 12,
                        padding: 12,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          cursor: 'pointer',
                        }}
                        onClick={() =>
                          setViewingHistoryCycleId(isExpanded ? null : hCycle.id)
                        }
                      >
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                            {hCycle.label}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                            Début : {hCycle.startDateISO} • Dépensé :{' '}
                            {formatDA(hMetrics.totalSpentDaily, 0)} /{' '}
                            {formatDA(hMetrics.foodAndHouseBudget, 0)}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span
                            className={`badge-tag ${
                              finalCumul >= 0 ? 'emerald' : 'coral'
                            }`}
                          >
                            Bilan: {finalCumul >= 0 ? '+' : ''}
                            {formatDA(finalCumul, 0)}
                          </span>
                        </div>
                      </div>

                      {isExpanded && (
                        <div
                          style={{
                            marginTop: 10,
                            paddingTop: 10,
                            borderTop: '1px solid var(--border-subtle)',
                            fontSize: '0.76rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 6,
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Moyenne dépensée / jour :</span>
                            <strong style={{ fontFamily: 'var(--font-mono)' }}>
                              {formatDA(hMetrics.totalSpentDaily / 30, 0)} / jr
                            </strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Économie nette fin de cycle :</span>
                            <strong
                              style={{
                                fontFamily: 'var(--font-mono)',
                                color: finalCumul >= 0 ? '#10B981' : '#F43F5E',
                              }}
                            >
                              {formatDA(finalCumul)}
                            </strong>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}

        {activeTab === 'settings' && (
          <>
            <section className="section-card">
              <div className="section-header">
                <div className="section-title">
                  <Smartphone size={17} color="#F5B841" />
                  Application Android & Données Autonomes
                </div>
              </div>
              <p
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5,
                  marginBottom: 14,
                }}
              >
                Toutes tes modifications (dépenses du jour, libellés personnalisés, statut Payé/Non payé des factures
                Dahabia, dettes et historique) sont sauvegardées automatiquement hors-ligne sur ton
                appareil.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center', padding: 12 }}
                  onClick={handleExportJSON}
                >
                  <Download size={16} />
                  Exporter une sauvegarde (.JSON)
                </button>

                <label
                  className="btn-secondary"
                  style={{ width: '100%', justifyContent: 'center', padding: 11 }}
                >
                  <Upload size={16} />
                  Importer une sauvegarde (.JSON)
                  <input
                    type="file"
                    accept="application/json"
                    onChange={handleImportJSON}
                    style={{ display: 'none' }}
                  />
                </label>

                <button
                  type="button"
                  className="btn-secondary"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    padding: 11,
                    color: '#F43F5E',
                    borderColor: 'rgba(244, 63, 94, 0.3)',
                  }}
                  onClick={handleResetToSheetDefaults}
                >
                  <RotateCcw size={16} />
                  Réinitialiser avec les valeurs du Google Sheet
                </button>
              </div>
            </section>

            <section className="section-card">
              <div className="section-header">
                <div className="section-title">
                  <CheckCircle2 size={17} color="#10B981" />
                  Paramètres Actifs du Cycle
                </div>
              </div>
              <div
                style={{
                  fontSize: '0.77rem',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <div>• Durée du cycle : <strong>30 jours</strong></div>
                <div>• Budget journalier : <strong>{formatDA(metrics.dailyBudget, 2)} / jr</strong> (40 000 DA ÷ 30)</div>
                <div>• Salaire configuré : <strong>{formatDA(metrics.salary, 0)}</strong></div>
                <div>• Charges Fixes ({fixedBills.length}) : <strong>{formatDA(metrics.totalOnline, 0)}</strong></div>
                <div>• Budget Food & House (30J) : <strong>{formatDA(metrics.foodAndHouseBudget, 0)}</strong></div>
                <div>• Sélection du jour : <strong>Automatique sur Aujourd'hui</strong> + <strong>Manuelle</strong></div>
              </div>
            </section>
          </>
        )}
      </main>

      {/* Modal: Add Bill or Debt */}
      {showAddBillModal && (
        <div className="modal-backdrop" onClick={() => setShowAddBillModal(false)}>
          <form
            className="modal-sheet"
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleAddBill}
          >
            <div className="section-title">
              <Plus size={18} color="#F5B841" />
              Ajouter une Charge Fixe
            </div>

            <input
              type="text"
              className="input-field"
              placeholder="Nom (ex: Assurance, Netflix, Abonnement...)"
              value={newBillName}
              onChange={(e) => setNewBillName(e.target.value)}
              required
            />

            <input
              type="number"
              step="0.01"
              className="input-field mono"
              placeholder="Montant en DA (ex: 3000)"
              value={newBillAmount}
              onChange={(e) => setNewBillAmount(e.target.value)}
              required
            />

            <input
              type="text"
              className="input-field"
              placeholder="Note optionnelle"
              value={newBillNote}
              onChange={(e) => setNewBillNote(e.target.value)}
            />

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowAddBillModal(false)}
              >
                Annuler
              </button>
              <button type="submit" className="btn-primary">
                Enregistrer
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Archive & Start New 30-Day Cycle */}
      {showNewCycleModal && (
        <div className="modal-backdrop" onClick={() => setShowNewCycleModal(false)}>
          <form
            className="modal-sheet"
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleArchiveAndStartNewCycle}
          >
            <div className="section-title">
              <Archive size={18} color="#F5B841" />
              Démarrer un Nouveau Cycle de 30 Jours
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Le cycle actuel (<strong>{currentCycle.label}</strong>) sera sauvegardé dans
              l'historique et un nouveau calendrier de 30 jours sera généré.
            </p>

            <input
              type="text"
              className="input-field"
              placeholder="Nom du cycle (ex: Cycle Déc - Jan)"
              value={newCycleLabel}
              onChange={(e) => setNewCycleLabel(e.target.value)}
              required
            />

            <div>
              <label
                style={{
                  fontSize: '0.74rem',
                  color: 'var(--text-secondary)',
                  display: 'block',
                  marginBottom: 4,
                }}
              >
                Date du Jour 1 (départ du cycle 30j) :
              </label>
              <input
                type="date"
                className="input-field mono"
                value={newCycleStartDate}
                onChange={(e) => setNewCycleStartDate(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowNewCycleModal(false)}
              >
                Annuler
              </button>
              <button type="submit" className="btn-primary">
                Archiver & Démarrer (30J)
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bottom Mobile Navigation */}
      <nav className="bottom-nav">
        <button
          type="button"
          className={`nav-item ${activeTab === 'daily' ? 'active' : ''}`}
          onClick={() => setActiveTab('daily')}
        >
          <Calendar size={20} />
          <span>Budget 30J</span>
        </button>

        <button
          type="button"
          className={`nav-item ${activeTab === 'bills' ? 'active' : ''}`}
          onClick={() => setActiveTab('bills')}
        >
          <Receipt size={20} />
          <span>Charges Fixes</span>
        </button>

        <button
          type="button"
          className={`nav-item ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <TrendingUp size={20} />
          <span>Évolution</span>
        </button>

        <button
          type="button"
          className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <Smartphone size={20} />
          <span>Android / Data</span>
        </button>
      </nav>
    </div>
  );
}
