import type React from 'react';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Receipt,
  Users,
  Wallet,
  ArrowRight,
  Plus,
  Calendar,
  Copy,
  RefreshCcw,
  KeyRound,
  LogIn,
  Check,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useColocation } from '../context/ColocationContext';
import { useBalanceRefresh } from '../context/BalanceRefreshContext';
import { useAuth } from '../context/AuthContext';
import { expenseApi, balanceApi, categoryApi, colocationApi } from '../api';
import {
  Card,
  CardHeader,
  StatCard,
  Avatar,
  Badge,
  Button,
  Modal,
  Input,
  SkeletonStat,
  SkeletonChart,
  SkeletonList,
  EmptyState,
} from '../components/ui';
import type { Expense, UserBalance, CategoryStat, SimplifiedDebt } from '../types';

export function Dashboard() {
  const { user } = useAuth();
  const { currentColocation, refreshColocations, refreshCurrentColocation } = useColocation();
  const { refreshKey } = useBalanceRefresh();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [totalExpensesAmount, setTotalExpensesAmount] = useState(0);
  const [balances, setBalances] = useState<UserBalance[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([]);
  const [debts, setDebts] = useState<SimplifiedDebt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createForm, setCreateForm] = useState({ name: '', description: '', address: '' });
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joinSuccess, setJoinSuccess] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const inviteCode =
    currentColocation?.invite_code ??
    (currentColocation && 'inviteCode' in currentColocation
      ? (currentColocation as { inviteCode?: string }).inviteCode ?? ''
      : '');
  const displayInviteCode = inviteCode ? inviteCode.toUpperCase() : '';
  const canCopyInviteCode = Boolean(inviteCode);
  const [isRegeneratingCode, setIsRegeneratingCode] = useState(false);

  const colocationId = currentColocation?.id;

  useEffect(() => {
    const fetchData = async () => {
      if (!colocationId) return;
      setIsLoading(true);
      try {
        // Fetch recent expenses, all expenses for chart, and category stats
        const [recentRes, allRes, statsRes] = await Promise.all([
          expenseApi.list({ colocation_id: colocationId, page_size: 5 }),
          expenseApi.list({ colocation_id: colocationId, page_size: 1000 }),
          categoryApi.getStats({ colocation_id: colocationId }),
        ]);
        setExpenses(recentRes.expenses);
        setAllExpenses(allRes.expenses);
        setTotalExpensesAmount(allRes.totalAmount);
        setCategoryStats(statsRes);

        // Try to fetch balances (may fail if payments table missing)
        try {
          const [balancesRes, debtsRes] = await Promise.all([
            balanceApi.getBalances(colocationId),
            balanceApi.getSimplifiedDebts(colocationId),
          ]);
          setBalances(balancesRes);
          setDebts(debtsRes);
        } catch {
          // Silently ignore balance errors (table may not exist)
          setBalances([]);
          setDebts([]);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [colocationId, refreshKey]);

  const userBalance = balances.find((b) => b.user_id === user?.id);

  // Calculate monthly expenses from all data (last 6 months)
  const monthlyData = (() => {
    const now = new Date();
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    const data = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = months[date.getMonth()];
      const monthExpenses = allExpenses.filter(expense => {
        const expenseDate = new Date(expense.expense_date);
        return expenseDate.getMonth() === date.getMonth() &&
               expenseDate.getFullYear() === date.getFullYear();
      });
      const totalAmount = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
      data.push({ month: monthName, amount: Math.round(totalAmount * 100) / 100 });
    }

    return data;
  })();

  const COLORS = ['#5682F2', '#F1C086', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  const handleCreateColocation = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!createForm.name.trim()) {
      setCreateError('Le nom est obligatoire');
      return;
    }
    setIsCreating(true);
    setCreateError('');
    try {
      await colocationApi.create({
        name: createForm.name.trim(),
        description: createForm.description.trim() || undefined,
        address: createForm.address.trim() || undefined,
      });
      setIsCreateModalOpen(false);
      setCreateForm({ name: '', description: '', address: '' });
      await refreshColocations();
    } catch (error) {
      console.error(error);
      setCreateError("Impossible de créer la colocation. Réessayez.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinCodeChange = (value: string) => {
    const normalized = value.replace(/\s+/g, '').toUpperCase();
    setJoinCode(normalized);
    setJoinError('');
    setJoinSuccess(false);
  };

  const handleJoinColocation = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!joinCode.trim()) {
      setJoinError('Le code est obligatoire');
      return;
    }
    setIsJoining(true);
    setJoinError('');
    setJoinSuccess(false);
    try {
      await colocationApi.join(joinCode.trim().toLowerCase());
      setJoinCode('');
      setJoinSuccess(true);
      setTimeout(() => setJoinSuccess(false), 3000);
      await refreshColocations();
    } catch (error) {
      console.error('Erreur lors de la tentative de rejoindre la colocation:', error);
      setJoinError('Code invalide ou invitation expirée.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleCopyInviteCode = async () => {
    if (!inviteCode) return;
    const code = inviteCode;
    try {
      let copied = false;
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
        copied = true;
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = code;
        textArea.setAttribute('readonly', '');
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        copied = document.execCommand('copy');
        document.body.removeChild(textArea);
      }

      if (!copied) {
        throw new Error('copy command failed');
      }

      setCopyStatus('success');
      setTimeout(() => setCopyStatus('idle'), 2500);
    } catch (error) {
      console.error('Impossible de copier le code:', error);
      setCopyStatus('error');
      setTimeout(() => setCopyStatus('idle'), 4000);
    }
  };

  const handleRegenerateInviteCode = async () => {
    if (!currentColocation) return;
    setIsRegeneratingCode(true);
    try {
      await colocationApi.regenerateInviteCode(currentColocation.id);
      await refreshCurrentColocation();
      setCopyStatus('idle');
    } catch (error) {
      console.error('Impossible de regenerer le code:', error);
    } finally {
      setIsRegeneratingCode(false);
    }
  };

  // No colocation state
  if (!currentColocation) {
    return (
      <>
        <EmptyState
          icon={<Users className="w-10 h-10" />}
          title="Aucune colocation"
          description="Créez ou rejoignez une colocation pour commencer à gérer vos dépenses partagées."
          action={{
            label: 'Créer une colocation',
            onClick: () => setIsCreateModalOpen(true),
            icon: <Plus className="w-5 h-5" />,
          }}
        />

        <Card padding="lg" elevation="flat" className="max-w-md mx-auto w-full mt-4">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <p className="text-base sm:text-lg font-semibold text-slate-800">Rejoindre une colocation</p>
                <p className="text-sm text-slate-500">
                  Utilisez le code partagé par vos colocataires pour les rejoindre.
                </p>
              </div>
            </div>
            <form className="space-y-4" onSubmit={handleJoinColocation}>
              <Input
                label="Code d'invitation"
                placeholder="Ex : ABCD1234"
                value={joinCode}
                onChange={(e) => handleJoinCodeChange(e.target.value)}
                error={joinError}
                autoComplete="off"
              />
              {joinSuccess && (
                <p className="text-sm text-emerald-600 flex items-center gap-1">
                  <Check className="w-4 h-4" />
                  Rejoint avec succès !
                </p>
              )}
              <div className="flex justify-end">
                <Button type="submit" leftIcon={<LogIn className="w-4 h-4" />} isLoading={isJoining}>
                  Rejoindre la colocation
                </Button>
              </div>
            </form>
          </div>
        </Card>

        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => { setIsCreateModalOpen(false); setCreateError(''); }}
          title="Nouvelle colocation"
          size="md"
        >
          <form className="space-y-4" onSubmit={handleCreateColocation}>
            <Input
              label="Nom de la colocation"
              value={createForm.name}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
            <Input
              label="Description"
              value={createForm.description}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Ex : Appartement rue de la Paix"
            />
            <Input
              label="Adresse"
              value={createForm.address}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, address: e.target.value }))}
              placeholder="Adresse (optionnel)"
            />
            {createError && <p className="text-sm text-red-500">{createError}</p>}
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" isLoading={isCreating}>
                Créer
              </Button>
            </div>
          </form>
        </Modal>
      </>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6 lg:space-y-8 xl:space-y-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-slate-200 rounded-lg animate-shimmer" />
            <div className="h-5 w-72 bg-slate-200 rounded-lg animate-shimmer" />
          </div>
          <div className="h-12 w-44 bg-slate-200 rounded-xl animate-shimmer" />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {[...Array(4)].map((_, i) => (
            <SkeletonStat key={i} />
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          <SkeletonChart className="xl:col-span-2" />
          <SkeletonChart />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          <Card elevation="flat" padding="md">
            <div className="h-6 w-40 bg-slate-200 rounded animate-shimmer mb-6" />
            <SkeletonList count={4} />
          </Card>
          <Card elevation="flat" padding="md">
            <div className="h-6 w-48 bg-slate-200 rounded animate-shimmer mb-6" />
            <SkeletonList count={3} />
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-8 xl:space-y-10">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xl sm:text-2xl lg:text-3xl font-semibold text-slate-800 mb-1 sm:mb-3"
          >
            Bonjour, {user?.prenom} !
          </motion.h1>
          <p className="text-sm sm:text-base lg:text-lg text-slate-500">
            Voici un aperçu de votre colocation {currentColocation.name}
          </p>
        </div>
      </div>

      <Card padding="md" elevation="flat" className="bg-primary/5 border border-primary/10">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white border border-primary/20 text-primary flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-primary">Code d'invitation</p>
                <p className="text-sm text-slate-500">Partagez ce code pour inviter de nouveaux colocataires.</p>
              </div>
            </div>
            <Input
              label="Code actuel"
              value={displayInviteCode}
              readOnly
              placeholder="Code en cours de génération"
              onFocus={(e) => e.target.select()}
              className="font-mono tracking-[0.35em] uppercase"
            />
            {copyStatus === 'success' && (
              <p className="text-sm text-emerald-600 flex items-center gap-1">
                <Check className="w-4 h-4" />
                Code copié !
              </p>
            )}
            {copyStatus === 'error' && (
              <p className="text-sm text-red-500">
                Impossible de copier automatiquement. Sélectionnez le code et faites Ctrl+C.
              </p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="secondary"
              leftIcon={<Copy className="w-4 h-4" />}
              onClick={handleCopyInviteCode}
              disabled={!canCopyInviteCode}
            >
              {copyStatus === 'success' ? 'Code copié' : 'Copier le code'}
            </Button>
            <Button
              variant="ghost"
              leftIcon={<RefreshCcw className="w-4 h-4" />}
              onClick={handleRegenerateInviteCode}
              isLoading={isRegeneratingCode}
              disabled={!currentColocation}
            >
              Régénérer
            </Button>
          </div>
        </div>
      </Card>

      <Card padding="md" elevation="flat" className="border border-primary/10">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <LogIn className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Rejoindre une autre colocation</p>
              <p className="text-sm text-slate-500">
                Collez ci-dessous un code reçu pour accéder instantanément à une nouvelle coloc.
              </p>
            </div>
          </div>
          <form className="flex flex-col sm:flex-row gap-3 w-full md:max-w-md" onSubmit={handleJoinColocation}>
            <div className="flex-1">
              <Input
                label="Code d'invitation"
                placeholder="Ex : ABCD1234"
                value={joinCode}
                onChange={(e) => handleJoinCodeChange(e.target.value)}
                error={joinError}
                autoComplete="off"
              />
              {joinSuccess && (
                <p className="text-sm text-emerald-600 flex items-center gap-1 mt-2">
                  <Check className="w-4 h-4" />
                  Rejoint avec succès !
                </p>
              )}
            </div>
            <div className="sm:self-end">
              <Button
                type="submit"
                leftIcon={<LogIn className="w-4 h-4" />}
                isLoading={isJoining}
                disabled={!joinCode || isJoining}
              >
                Rejoindre
              </Button>
            </div>
          </form>
        </div>
      </Card>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8"
      >
        <StatCard
          label="Votre solde"
          value={`${(userBalance?.net_balance || 0) >= 0 ? '+' : ''}${(userBalance?.net_balance || 0).toFixed(2)} €`}
          icon={<Wallet className="w-6 h-6" />}
          color={(userBalance?.net_balance || 0) >= 0 ? 'success' : 'danger'}
        />
        <StatCard
          label="Total des dépenses"
          value={`${totalExpensesAmount.toFixed(2)} €`}
          icon={<Receipt className="w-6 h-6" />}
          color="primary"
          change={{ value: 12, isPositive: false }}
        />
        <StatCard
          label="Colocataires"
          value={currentColocation.members?.length || 0}
          icon={<Users className="w-6 h-6" />}
          color="accent"
        />
        <StatCard
          label="Dépenses ce mois"
          value={expenses.length}
          icon={<Calendar className="w-6 h-6" />}
          color="warning"
        />
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="xl:col-span-2"
        >
          <Card elevation="elevated" padding="md">
            <CardHeader title="Évolution des dépenses" subtitle="6 derniers mois" />
            <div className="h-72 mt-6">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#5682F2" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#5682F2" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="month"
                    stroke="#94a3b8"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) => `${v}€`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    }}
                    formatter={(value) => [`${value} €`, 'Dépenses']}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#5682F2"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorAmount)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card elevation="elevated" padding="md" className="h-full">
            <CardHeader title="Par catégorie" />
            <div className="h-52 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryStats.length > 0 ? categoryStats : [{ name: 'Aucune', value: 1 }]}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    dataKey="total_amount"
                    nameKey="category.name"
                    paddingAngle={2}
                  >
                    {categoryStats.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                    }}
                    formatter={(value) => [`${Number(value).toFixed(2)} €`]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 mt-6">
              {categoryStats.slice(0, 4).map((stat, index) => (
                <Badge key={stat.category?.id || index} variant="default">
                  <span
                    className="w-2.5 h-2.5 rounded-full mr-2"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  {stat.category?.name}
                </Badge>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
        {/* Recent Expenses */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card elevation="flat" padding="md">
            <CardHeader
              title="Dernières dépenses"
              action={
                <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Voir tout
                </Button>
              }
            />
            <div className="space-y-2 mt-6">
              {expenses.length === 0 ? (
                <p className="text-slate-400 text-center py-12">Aucune dépense pour le moment</p>
              ) : (
                expenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl hover:bg-slate-50 transition-all duration-200 cursor-pointer"
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                      style={{
                        backgroundColor: expense.category?.color
                          ? `${expense.category.color}15`
                          : '#EEF2FF',
                        color: expense.category?.color || '#5682F2',
                      }}
                    >
                      <Receipt className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{expense.title}</p>
                      <p className="text-sm text-slate-400">
                        Payé par {expense.payer?.prenom || 'Inconnu'}
                      </p>
                    </div>
                    <span className="text-base font-semibold text-slate-800">
                      {expense.amount.toFixed(2)} €
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </motion.div>

        {/* Debts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card elevation="flat" padding="md">
            <CardHeader
              title="Remboursements suggérés"
              subtitle="Dettes simplifiées"
              action={
                <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Voir tout
                </Button>
              }
            />
            <div className="space-y-2 mt-6">
              {debts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-7 h-7 text-emerald-500" />
                  </div>
                  <p className="text-slate-400 text-lg">Tous les comptes sont équilibrés !</p>
                </div>
              ) : (
                debts.map((debt, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-slate-50/80 hover:bg-slate-100 transition-all duration-200"
                  >
                    <Avatar
                      name={debt.from_user ? `${debt.from_user.prenom} ${debt.from_user.nom}` : 'Utilisateur'}
                      size="md"
                    />
                    <div className="flex-1 flex items-center gap-3">
                      <span className="text-sm font-medium text-slate-700">
                        {debt.from_user?.prenom || 'Utilisateur'}
                      </span>
                      <ArrowRight className="w-4 h-4 text-slate-300" />
                      <span className="text-sm font-medium text-slate-700">
                        {debt.to_user?.prenom || 'Utilisateur'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-base font-semibold text-red-500">
                        {debt.amount.toFixed(2)} €
                      </span>
                      <Button size="sm" variant="secondary">
                        Payer
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
