import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  Receipt,
  Calendar,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useColocation } from '../context/ColocationContext';
import { useBalanceRefresh } from '../context/BalanceRefreshContext';
import { expenseApi, categoryApi } from '../api';
import {
  Card,
  Button,
  Input,
  Badge,
  Avatar,
  Modal,
  Select,
  Skeleton,
  SkeletonList,
  EmptyState,
} from '../components/ui';
import type { Expense, Category, SplitType } from '../types';

const getInitialExpenseForm = () => ({
  title: '',
  amount: '',
  category_id: '',
  split_type: 'equal' as SplitType,
  expense_date: new Date().toISOString().split('T')[0],
  description: '',
});

const normalizeDateValue = (value: string) => {
  if (!value) {
    return new Date().toISOString().split('T')[0];
  }
  return value.includes('T') ? value.split('T')[0] : value;
};

export function Expenses() {
  const { currentColocation } = useColocation();
  const { triggerRefresh, refreshKey } = useBalanceRefresh();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingExpense, setIsSavingExpense] = useState(false);
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null);
  const isSavingExpenseRef = useRef(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const perPage = 20;
  const [showNewExpenseModal, setShowNewExpenseModal] = useState(false);
  const [categoryFieldError, setCategoryFieldError] = useState('');
  const [newExpense, setNewExpense] = useState(getInitialExpenseForm);
  const [showEditExpenseModal, setShowEditExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editExpense, setEditExpense] = useState(getInitialExpenseForm);
  const [editCategoryFieldError, setEditCategoryFieldError] = useState('');
  const [isUpdatingExpense, setIsUpdatingExpense] = useState(false);

  const resetExpenseForm = () => {
    setNewExpense(getInitialExpenseForm());
    setCategoryFieldError('');
  };

  const resetEditExpenseForm = () => {
    setEditExpense(getInitialExpenseForm());
    setEditingExpense(null);
    setEditCategoryFieldError('');
  };

  const loadCategories = useCallback(async () => {
    const colocationId = currentColocation?.id;
    if (!colocationId) return;
    try {
      const result = await categoryApi.list(colocationId);
      setCategories(result);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, [currentColocation?.id]);

  const loadExpenses = useCallback(async () => {
    const colocationId = currentColocation?.id;
    if (!colocationId) return;
    setIsLoading(true);
    try {
      const result = await expenseApi.list({
        colocation_id: colocationId,
        page: currentPage,
        page_size: perPage,
        category_id: selectedCategory || undefined,
      });
      setExpenses(result.expenses);
      setTotalExpenses(result.total);
      setTotalAmount(result.totalAmount);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentColocation?.id, currentPage, selectedCategory]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses, refreshKey]);

  // Search is client-side on current page, category filter is server-side
  const filteredExpenses = expenses.filter((expense) => {
    return expense.title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const totalPages = Math.ceil(totalExpenses / perPage);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentColocation || isSavingExpenseRef.current) return;
    if (!newExpense.category_id) {
      setCategoryFieldError('La catégorie est obligatoire');
      return;
    }

    isSavingExpenseRef.current = true;
    setIsSavingExpense(true);
    try {
      const expense = await expenseApi.create({
        colocation_id: currentColocation.id,
        title: newExpense.title,
        amount: parseFloat(newExpense.amount),
        category_id: newExpense.category_id,
        split_type: newExpense.split_type,
        expense_date: newExpense.expense_date,
        description: newExpense.description || undefined,
      });
      setCategoryFieldError('');
      setExpenses((prev) => {
        const remaining = prev.filter((existing) => existing.id !== expense.id);
        return [expense, ...remaining];
      });
      triggerRefresh();
      setShowNewExpenseModal(false);
      resetExpenseForm();
    } catch (error) {
      console.error('Error creating expense:', error);
    } finally {
      isSavingExpenseRef.current = false;
      setIsSavingExpense(false);
    }
  };

  const handleEditExpenseClick = (expense: Expense) => {
    setEditingExpense(expense);
    setEditExpense({
      title: expense.title,
      amount: expense.amount.toString(),
      category_id: expense.category_id,
      split_type: expense.split_type,
      expense_date: normalizeDateValue(expense.expense_date),
      description: expense.description || '',
    });
    setEditCategoryFieldError('');
    setShowEditExpenseModal(true);
  };

  const handleUpdateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentColocation || !editingExpense || isUpdatingExpense) return;
    if (!editExpense.category_id) {
      setEditCategoryFieldError('La catégorie est obligatoire');
      return;
    }

    setIsUpdatingExpense(true);
    try {
      const updatedExpense = await expenseApi.update(currentColocation.id, editingExpense.id, {
        title: editExpense.title,
        amount: parseFloat(editExpense.amount),
        category_id: editExpense.category_id,
        split_type: editExpense.split_type,
        expense_date: editExpense.expense_date,
        description: editExpense.description || undefined,
      });

      setExpenses((prev) => prev.map((exp) => (exp.id === updatedExpense.id ? updatedExpense : exp)));
      triggerRefresh();
      setShowEditExpenseModal(false);
      resetEditExpenseForm();
    } catch (error) {
      console.error('Error updating expense:', error);
    } finally {
      setIsUpdatingExpense(false);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!currentColocation || deletingExpenseId) return;
    setDeletingExpenseId(expenseId);
    try {
      await expenseApi.delete(currentColocation.id, expenseId);
      setExpenses((prev) => prev.filter((expense) => expense.id !== expenseId));
      triggerRefresh();
    } catch (error) {
      console.error('Error deleting expense:', error);
    } finally {
      setDeletingExpenseId(null);
    }
  };

  const getSplitTypeLabel = (type: SplitType) => {
    switch (type) {
      case 'equal':
        return 'Égal';
      case 'percentage':
        return 'Pourcentage';
      case 'custom':
        return 'Personnalisé';
      case 'payer_only':
        return 'Solo';
    }
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    setCurrentPage(1);
  };

  const categoryOptions = [
    { value: '', label: 'Toutes les catégories' },
    ...categories.map((cat) => ({ value: cat.id, label: cat.name })),
  ];

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6 lg:space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Skeleton variant="text" width={150} height={32} />
            <Skeleton variant="text" width={280} />
          </div>
          <Skeleton variant="rectangular" width={180} height={48} />
        </div>

        <Card elevation="elevated" padding="sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <Skeleton variant="rectangular" className="flex-1" height={48} />
            <Skeleton variant="rectangular" width={140} height={48} />
          </div>
        </Card>

        <div className="flex items-center gap-6 sm:gap-10 px-4 py-4 sm:px-6 sm:py-5 rounded-2xl bg-slate-100 animate-pulse">
          <div className="space-y-2">
            <Skeleton variant="text" width={60} />
            <Skeleton variant="text" width={100} height={28} />
          </div>
          <div className="w-px h-12 bg-slate-200" />
          <div className="space-y-2">
            <Skeleton variant="text" width={120} />
            <Skeleton variant="text" width={40} height={28} />
          </div>
        </div>

        <Card elevation="flat" padding="none">
          <SkeletonList count={5} className="p-6" />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-slate-800">Dépenses</h1>
          <p className="text-sm sm:text-base lg:text-lg text-slate-500 mt-1">Gérez les dépenses de votre colocation</p>
        </div>
        <Button size="lg" leftIcon={<Plus className="w-5 h-5" />} onClick={() => setShowNewExpenseModal(true)} className="w-full sm:w-auto">
          Nouvelle dépense
        </Button>
      </div>

      {/* Filters */}
      <Card elevation="elevated" padding="sm">
        <div className="flex flex-col gap-3 p-1 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex-1">
            <Input
              placeholder="Rechercher une dépense..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-5 h-5" />}
            />
          </div>
          <div className="w-full sm:w-56">
            <Select
              options={categoryOptions}
              value={selectedCategory}
              onChange={handleCategoryChange}
              leftIcon={<Filter className="w-4 h-4" />}
              placeholder="Catégorie"
            />
          </div>
        </div>
      </Card>

      {/* Stats bar */}
      <div className="flex items-center gap-6 sm:gap-10 px-4 py-4 sm:px-6 sm:py-5 rounded-2xl bg-linear-to-r from-primary/5 to-primary/10 border border-primary/10 shadow-sm">
        <div>
          <p className="text-sm text-primary font-medium mb-1">Total</p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-semibold text-primary">{totalAmount.toFixed(2)} €</p>
        </div>
        <div className="w-px h-12 bg-primary/20" />
        <div>
          <p className="text-sm text-primary font-medium mb-1">Nombre de dépenses</p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-semibold text-primary">{totalExpenses}</p>
        </div>
      </div>

      {/* Expenses List */}
      <Card elevation="flat" padding="none" className="overflow-hidden">
        <div className="divide-y divide-slate-100">
          <AnimatePresence>
            {filteredExpenses.length === 0 ? (
              <EmptyState
                icon={<Receipt className="w-10 h-10" />}
                title="Aucune dépense trouvée"
                description="Commencez par ajouter une dépense pour suivre les frais de votre colocation."
                action={{
                  label: 'Nouvelle dépense',
                  onClick: () => setShowNewExpenseModal(true),
                  icon: <Plus className="w-5 h-5" />,
                }}
              />
            ) : (
              filteredExpenses.map((expense, index) => (
                <motion.div
                  key={expense.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.03 }}
                  className="flex items-center gap-3 sm:gap-4 px-4 py-3.5 sm:px-5 sm:py-4 hover:bg-slate-50/80 transition-all duration-200 cursor-pointer"
                >
                  <div
                    className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                    style={{
                      backgroundColor: expense.category?.color ? `${expense.category.color}12` : '#f1f5f9',
                    }}
                  >
                    <span className="text-xl">{expense.category?.icon || '💰'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <p className="font-medium text-slate-800 truncate text-base">{expense.title}</p>
                      <Badge variant="default" size="sm">
                        {getSplitTypeLabel(expense.split_type)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1.5 text-sm text-slate-400">
                      <span className="flex items-center gap-2">
                        <Avatar
                          name={expense.payer ? `${expense.payer.prenom} ${expense.payer.nom}` : 'Utilisateur'}
                          size="sm"
                          className="w-5 h-5 text-[9px]"
                        />
                        {expense.payer?.prenom || 'Inconnu'}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        {new Date(expense.expense_date).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-slate-800">{expense.amount.toFixed(2)} €</p>
                    {expense.splits && expense.splits.length > 0 && (
                      <p className="text-sm text-slate-400 mt-0.5">
                        {(expense.amount / expense.splits.length).toFixed(2)} €/pers
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-0.5 sm:gap-1">
                    <button
                      className="p-2 sm:p-3 rounded-lg sm:rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all duration-200"
                      onClick={() => handleEditExpenseClick(expense)}
                      type="button"
                    >
                      <Edit2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    <button
                      className="p-2 sm:p-3 rounded-lg sm:rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => handleDeleteExpense(expense.id)}
                      disabled={deletingExpenseId === expense.id}
                    >
                      <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-slate-500">
            Page {currentPage} sur {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
              Précédent
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Suivant
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* New Expense Modal */}
      <Modal
        isOpen={showNewExpenseModal}
        onClose={() => {
          setShowNewExpenseModal(false);
          resetExpenseForm();
        }}
        title="Nouvelle dépense"
        size="lg"
      >
        <form onSubmit={handleCreateExpense} className="space-y-4">
          <Input
            label="Titre"
            placeholder="Ex: Courses Carrefour"
            value={newExpense.title}
            onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })}
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Montant (€)"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={newExpense.amount}
              onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
              required
            />
            <Select
              label="Catégorie"
              options={categories.map((cat) => ({
                value: cat.id,
                label: cat.name,
              }))}
              value={newExpense.category_id}
              onChange={(value) => {
                setNewExpense({ ...newExpense, category_id: value });
                setCategoryFieldError('');
              }}
              placeholder="Sélectionner..."
              error={categoryFieldError}
              disabled={categories.length === 0}
              hint={categories.length === 0 ? 'Aucune catégorie disponible pour le moment.' : undefined}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Date"
              type="date"
              value={newExpense.expense_date}
              onChange={(e) => setNewExpense({ ...newExpense, expense_date: e.target.value })}
              required
            />
            <Select
              label="Mode de partage"
              options={[
                { value: 'equal', label: 'Égal entre tous' },
                { value: 'percentage', label: 'Par pourcentage' },
                { value: 'custom', label: 'Montants personnalisés' },
                { value: 'payer_only', label: 'Je paie seul (pas de partage)' },
              ]}
              value={newExpense.split_type}
              onChange={(value) => setNewExpense({ ...newExpense, split_type: value as SplitType })}
            />
          </div>
          {newExpense.split_type === 'payer_only' && (
            <p className="text-xs text-slate-500 -mt-2">
              Cette dépense ne crée aucune dette pour les autres membres et réduit uniquement votre propre solde.
            </p>
          )}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Description (optionnel)</label>
            <textarea
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 outline-none shadow-sm hover:shadow-md hover:border-slate-300 focus:border-primary focus:ring-4 focus:ring-primary/10 focus:shadow-md transition-all duration-200 resize-none"
              rows={3}
              placeholder="Ajouter une description..."
              value={newExpense.description}
              onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowNewExpenseModal(false);
                resetExpenseForm();
              }}
            >
              Annuler
            </Button>
            <Button type="submit" isLoading={isSavingExpense} disabled={isSavingExpense}>
              Créer la dépense
            </Button>
          </div>
        </form>
      </Modal>
      <Modal
        isOpen={showEditExpenseModal}
        onClose={() => {
          setShowEditExpenseModal(false);
          resetEditExpenseForm();
        }}
        title="Modifier la dépense"
        size="lg"
      >
        <form onSubmit={handleUpdateExpense} className="space-y-4">
          <Input
            label="Titre"
            placeholder="Ex: Courses Carrefour"
            value={editExpense.title}
            onChange={(e) => setEditExpense({ ...editExpense, title: e.target.value })}
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Montant (€)"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={editExpense.amount}
              onChange={(e) => setEditExpense({ ...editExpense, amount: e.target.value })}
              required
            />
            <Select
              label="Catégorie"
              options={categories.map((cat) => ({
                value: cat.id,
                label: cat.name,
              }))}
              value={editExpense.category_id}
              onChange={(value) => {
                setEditExpense({ ...editExpense, category_id: value });
                setEditCategoryFieldError('');
              }}
              placeholder="Sélectionner..."
              error={editCategoryFieldError}
              disabled={categories.length === 0}
              hint={categories.length === 0 ? 'Aucune catégorie disponible pour le moment.' : undefined}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Date"
              type="date"
              value={editExpense.expense_date}
              onChange={(e) => setEditExpense({ ...editExpense, expense_date: e.target.value })}
              required
            />
            <Select
              label="Mode de partage"
              options={[
                { value: 'equal', label: 'Égal entre tous' },
                { value: 'percentage', label: 'Par pourcentage' },
                { value: 'custom', label: 'Montants personnalisés' },
                { value: 'payer_only', label: 'Je paie seul (pas de partage)' },
              ]}
              value={editExpense.split_type}
              onChange={(value) => setEditExpense({ ...editExpense, split_type: value as SplitType })}
            />
          </div>
          {editExpense.split_type === 'payer_only' && (
            <p className="text-xs text-slate-500 -mt-2">
              Cette dépense ne crée aucune dette pour les autres membres et réduit uniquement votre propre solde.
            </p>
          )}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Description (optionnel)</label>
            <textarea
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 outline-none shadow-sm hover:shadow-md hover:border-slate-300 focus:border-primary focus:ring-4 focus:ring-primary/10 focus:shadow-md transition-all duration-200 resize-none"
              rows={3}
              placeholder="Ajouter une description..."
              value={editExpense.description}
              onChange={(e) => setEditExpense({ ...editExpense, description: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowEditExpenseModal(false);
                resetEditExpenseForm();
              }}
            >
              Annuler
            </Button>
            <Button type="submit" isLoading={isUpdatingExpense} disabled={isUpdatingExpense}>
              Enregistrer les modifications
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
