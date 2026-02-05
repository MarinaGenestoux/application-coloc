import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  RefreshCcw,
  ChevronRight,
} from 'lucide-react';
import { useColocation } from '../context/ColocationContext';
import { useAuth } from '../context/AuthContext';
import { balanceApi } from '../api';
import {
  Card,
  CardHeader,
  Button,
  Avatar,
  Badge,
  Skeleton,
  SkeletonList,
} from '../components/ui';
import type { UserBalance, SimplifiedDebt } from '../types';

export function Balances() {
  const { user } = useAuth();
  const { currentColocation } = useColocation();
  const [balances, setBalances] = useState<UserBalance[]>([]);
  const [debts, setDebts] = useState<SimplifiedDebt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    if (!currentColocation) return;
    setIsLoading(true);
    try {
      const [balancesRes, debtsRes] = await Promise.all([
        balanceApi.getBalances(currentColocation.id),
        balanceApi.getSimplifiedDebts(currentColocation.id),
      ]);
      setBalances(balancesRes);
      setDebts(debtsRes);
    } catch (error) {
      console.error('Error fetching balances:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentColocation]);

  const positiveBalances = balances.filter((b) => b.net_balance > 0);
  const negativeBalances = balances.filter((b) => b.net_balance < 0);
  const userBalance = balances.find((b) => b.user_id === user?.id);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6 lg:space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Skeleton variant="text" width={120} height={32} />
            <Skeleton variant="text" width={300} />
          </div>
          <Skeleton variant="rectangular" width={140} height={48} />
        </div>

        <div className="bg-slate-100 rounded-2xl p-5 sm:p-6 lg:p-8 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="space-y-3">
              <Skeleton variant="text" width={100} />
              <Skeleton variant="text" width={180} height={48} />
              <Skeleton variant="text" width={150} />
            </div>
            <Skeleton variant="rectangular" width={80} height={80} className="rounded-2xl" />
          </div>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mt-6 pt-6 sm:mt-8 sm:pt-8 border-t border-slate-200">
            <div className="space-y-2">
              <Skeleton variant="text" width={80} />
              <Skeleton variant="text" width={120} height={28} />
            </div>
            <div className="space-y-2">
              <Skeleton variant="text" width={80} />
              <Skeleton variant="text" width={120} height={28} />
            </div>
          </div>
        </div>

        <Card elevation="flat" padding="md">
          <Skeleton variant="text" width={200} className="mb-6" />
          <SkeletonList count={3} />
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          <Card elevation="flat" padding="md">
            <Skeleton variant="text" width={120} className="mb-6" />
            <SkeletonList count={2} />
          </Card>
          <Card elevation="flat" padding="md">
            <Skeleton variant="text" width={120} className="mb-6" />
            <SkeletonList count={2} />
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-slate-800">Soldes</h1>
          <p className="text-sm sm:text-base lg:text-lg text-slate-500 mt-1">Vue d'ensemble des soldes de la colocation</p>
        </div>
        <Button size="lg" variant="secondary" leftIcon={<RefreshCcw className="w-5 h-5" />} onClick={fetchData} className="w-full sm:w-auto">
          Actualiser
        </Button>
      </div>

      {/* Your Balance Card */}
      {userBalance && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card
            elevation="elevated"
            padding="lg"
            className={`relative overflow-hidden ${
              userBalance.net_balance >= 0
                ? 'bg-linear-to-br from-emerald-50 to-teal-50'
                : 'bg-linear-to-br from-red-50 to-orange-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-2">Votre solde</p>
                <p
                  className={`text-3xl sm:text-4xl lg:text-5xl font-semibold ${
                    userBalance.net_balance >= 0 ? 'text-emerald-600' : 'text-red-500'
                  }`}
                >
                  {userBalance.net_balance >= 0 ? '+' : ''}
                  {userBalance.net_balance.toFixed(2)} €
                </p>
                <p className="text-base text-slate-400 mt-3">
                  {userBalance.net_balance >= 0 ? "On vous doit de l'argent" : "Vous devez de l'argent"}
                </p>
              </div>
              <div
                className={`w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-2xl flex items-center justify-center shadow-lg ${
                  userBalance.net_balance >= 0
                    ? 'bg-emerald-100 shadow-emerald-200/50'
                    : 'bg-red-100 shadow-red-200/50'
                }`}
              >
                {userBalance.net_balance >= 0 ? (
                  <TrendingUp className="w-10 h-10 text-emerald-600" />
                ) : (
                  <TrendingDown className="w-10 h-10 text-red-500" />
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mt-6 pt-6 sm:mt-8 sm:pt-8 border-t border-black/5">
              <div>
                <p className="text-sm text-slate-400 mb-1">Total payé</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-semibold text-slate-800">{userBalance.total_paid.toFixed(2)} €</p>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">Total dû</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-semibold text-slate-800">{userBalance.total_owed.toFixed(2)} €</p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Simplified Debts */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card elevation="flat" padding="md">
          <CardHeader title="Remboursements optimisés" subtitle="Algorithme de simplification des dettes" />
          {debts.length === 0 ? (
            <div className="text-center py-16 mt-4">
              <div className="w-20 h-20 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-6 shadow-sm">
                <TrendingUp className="w-10 h-10 text-emerald-500" />
              </div>
              <p className="text-xl font-medium text-slate-800">Tout est équilibré !</p>
              <p className="text-slate-400 mt-2 text-base">Aucun remboursement nécessaire</p>
            </div>
          ) : (
            <div className="space-y-3 mt-6">
              {debts.map((debt, index) => {
                const isUserDebtor = debt.from_user_id === user?.id;
                const isUserCreditor = debt.to_user_id === user?.id;

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.08 }}
                    className={`flex items-center gap-3 sm:gap-4 p-3.5 sm:p-4 lg:p-5 rounded-xl transition-all duration-200 ${
                      isUserDebtor
                        ? 'bg-red-50/60 hover:bg-red-50'
                        : isUserCreditor
                          ? 'bg-emerald-50/60 hover:bg-emerald-50'
                          : 'bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <Avatar
                      name={debt.from_user ? `${debt.from_user.prenom} ${debt.from_user.nom}` : 'Utilisateur'}
                      size="md"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-medium text-slate-800">
                          {debt.from_user?.prenom || 'Utilisateur'}
                          {isUserDebtor && (
                            <Badge variant="danger" size="sm" className="ml-2">
                              Vous
                            </Badge>
                          )}
                        </span>
                        <ArrowRight className="w-5 h-5 text-slate-400" />
                        <span className="font-medium text-slate-800">
                          {debt.to_user?.prenom || 'Utilisateur'}
                          {isUserCreditor && (
                            <Badge variant="success" size="sm" className="ml-2">
                              Vous
                            </Badge>
                          )}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 mt-1">
                        {isUserDebtor
                          ? 'Vous devez rembourser'
                          : isUserCreditor
                            ? 'Vous allez recevoir'
                            : 'Transaction entre colocataires'}
                      </p>
                    </div>
                    <p className="text-base sm:text-lg lg:text-xl font-semibold text-slate-800">{debt.amount.toFixed(2)} €</p>
                    {isUserDebtor && (
                      <Button>
                        Rembourser <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </Card>
      </motion.div>

      {/* All Balances */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card elevation="flat" padding="md">
            <CardHeader
              title="Créanciers"
              subtitle="Membres avec un solde positif"
              action={
                <div className="flex items-center gap-2 text-emerald-600">
                  <TrendingUp className="w-5 h-5" />
                  <span className="text-base font-semibold">
                    {positiveBalances.reduce((sum, b) => sum + b.net_balance, 0).toFixed(2)} €
                  </span>
                </div>
              }
            />
            {positiveBalances.length === 0 ? (
              <p className="text-slate-400 text-center py-10 text-base">Aucun créancier</p>
            ) : (
              <div className="space-y-3 mt-6">
                {positiveBalances.map((balance) => (
                  <div
                    key={balance.user_id}
                    className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-all duration-200"
                  >
                    <Avatar
                      name={balance.user ? `${balance.user.prenom} ${balance.user.nom}` : 'Utilisateur'}
                      size="md"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-slate-800">
                        {balance.user?.prenom} {balance.user?.nom}
                        {balance.user_id === user?.id && (
                          <Badge variant="primary" size="sm" className="ml-2">
                            Vous
                          </Badge>
                        )}
                      </p>
                      <p className="text-sm text-slate-400 mt-0.5">A payé {balance.total_paid.toFixed(2)} €</p>
                    </div>
                    <p className="text-lg font-semibold text-emerald-600">+{balance.net_balance.toFixed(2)} €</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card elevation="flat" padding="md">
            <CardHeader
              title="Débiteurs"
              subtitle="Membres avec un solde négatif"
              action={
                <div className="flex items-center gap-2 text-red-500">
                  <TrendingDown className="w-5 h-5" />
                  <span className="text-base font-semibold">
                    {negativeBalances.reduce((sum, b) => sum + b.net_balance, 0).toFixed(2)} €
                  </span>
                </div>
              }
            />
            {negativeBalances.length === 0 ? (
              <p className="text-slate-400 text-center py-10 text-base">Aucun débiteur</p>
            ) : (
              <div className="space-y-3 mt-6">
                {negativeBalances.map((balance) => (
                  <div
                    key={balance.user_id}
                    className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-all duration-200"
                  >
                    <Avatar
                      name={balance.user ? `${balance.user.prenom} ${balance.user.nom}` : 'Utilisateur'}
                      size="md"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-slate-800">
                        {balance.user?.prenom} {balance.user?.nom}
                        {balance.user_id === user?.id && (
                          <Badge variant="primary" size="sm" className="ml-2">
                            Vous
                          </Badge>
                        )}
                      </p>
                      <p className="text-sm text-slate-400 mt-0.5">Doit {balance.total_owed.toFixed(2)} €</p>
                    </div>
                    <p className="text-lg font-semibold text-red-500">{balance.net_balance.toFixed(2)} €</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
