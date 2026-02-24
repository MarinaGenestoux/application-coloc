import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  Calendar,
  Trash2,
  Edit2,
  MapPin,
  Euro,
  Users,
  Check,
  X,
  HelpCircle,
  Compass,
  ExternalLink,
} from 'lucide-react';
import { useColocation } from '../context/ColocationContext';
import { useAuth } from '../context/AuthContext';
import { eventApi } from '../api';
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
import type { Event, EventStatus, RSVPStatus, DiscoveredEvent, DiscoverEventType } from '../types';

const getInitialEventForm = () => ({
  title: '',
  description: '',
  event_date: '',
  location: '',
  budget: '',
});

const discoverEventTypeOptions = [
  { value: '', label: "Type d'evenement" },
  { value: 'CONCERT', label: 'Concert' },
  { value: 'EXPOSITION', label: 'Exposition' },
  { value: 'FESTIVAL', label: 'Festival' },
  { value: 'SPORT', label: 'Sport' },
  { value: 'THEATRE', label: 'Theatre / Spectacle' },
  { value: 'GASTRONOMIE', label: 'Gastronomie' },
  { value: 'MARCHE', label: 'Marche / Brocante' },
  { value: 'CINEMA', label: 'Cinema' },
  { value: 'CONFERENCE', label: 'Conference / Meetup' },
  { value: 'SOIREE', label: 'Soiree / Nightlife' },
];

// Convert backend date format "YYYY-MM-DD HH:MM" to JavaScript Date
const parseEventDate = (dateStr: string | undefined | null): Date => {
  if (!dateStr || typeof dateStr !== 'string') {
    console.warn('Invalid date string:', dateStr);
    return new Date();
  }
  // Backend sends "2026-02-15 19:00", convert to "2026-02-15T19:00"
  const isoStr = dateStr.replace(' ', 'T');
  const date = new Date(isoStr);
  if (isNaN(date.getTime())) {
    console.warn('Could not parse date:', dateStr);
    return new Date();
  }
  return date;
};

export function Events() {
  const { currentColocation } = useColocation();
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingEvent, setIsSavingEvent] = useState(false);
  const isSavingEventRef = useRef(false);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [showNewEventModal, setShowNewEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState(getInitialEventForm);
  const [showEditEventModal, setShowEditEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [editEvent, setEditEvent] = useState(getInitialEventForm);
  const [isUpdatingEvent, setIsUpdatingEvent] = useState(false);
  const [rsvpingEventId, setRsvpingEventId] = useState<string | null>(null);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [participantsData, setParticipantsData] = useState<Record<string, any>>({});

  // Discovery state
  const [showDiscovery, setShowDiscovery] = useState(false);
  const [discoveryCity, setDiscoveryCity] = useState('');
  const [discoveryEventType, setDiscoveryEventType] = useState('');
  const [discoveredEvents, setDiscoveredEvents] = useState<DiscoveredEvent[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoverySummary, setDiscoverySummary] = useState('');
  const [discoveryError, setDiscoveryError] = useState('');

  const resetEventForm = () => {
    setNewEvent(getInitialEventForm());
  };

  const resetEditEventForm = () => {
    setEditEvent(getInitialEventForm());
    setEditingEvent(null);
  };

  const loadEvents = useCallback(async () => {
    const colocationId = currentColocation?.id;
    if (!colocationId) return;
    setIsLoading(true);
    try {
      const result = await eventApi.list({ colocationId });
      setEvents(result.events || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentColocation?.id]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !selectedStatus || event.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentColocation || isSavingEventRef.current) return;

    isSavingEventRef.current = true;
    setIsSavingEvent(true);
    try {
      // Convert datetime-local format (YYYY-MM-DDTHH:MM) to backend format (YYYY-MM-DD HH:MM)
      const formattedDate = newEvent.event_date.replace('T', ' ');

      const event = await eventApi.create(currentColocation.id, {
        title: newEvent.title,
        description: newEvent.description || undefined,
        event_date: formattedDate,
        location: newEvent.location || undefined,
        budget: newEvent.budget ? parseFloat(newEvent.budget) : undefined,
      });
      setEvents((prev) => [event, ...prev]);
      setShowNewEventModal(false);
      resetEventForm();
    } catch (error) {
      console.error('Error creating event:', error);
    } finally {
      isSavingEventRef.current = false;
      setIsSavingEvent(false);
    }
  };

  const handleEditEventClick = (event: Event) => {
    setEditingEvent(event);
    // Parse event_date from "2026-02-15 19:00" to "2026-02-15T19:00" for datetime-local input
    const eventDate = event.event_date
      ? event.event_date.replace(' ', 'T')
      : '';
    setEditEvent({
      title: event.title,
      description: event.description || '',
      event_date: eventDate,
      location: event.location || '',
      budget: event.budget?.toString() || '',
    });
    setShowEditEventModal(true);
  };

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentColocation || !editingEvent || isUpdatingEvent) return;

    setIsUpdatingEvent(true);
    try {
      // Convert datetime-local format (YYYY-MM-DDTHH:MM) to backend format (YYYY-MM-DD HH:MM)
      const formattedDate = editEvent.event_date.replace('T', ' ');

      const updatedEvent = await eventApi.update(currentColocation.id, editingEvent.id, {
        title: editEvent.title,
        description: editEvent.description || undefined,
        event_date: formattedDate,
        location: editEvent.location || undefined,
        budget: editEvent.budget ? parseFloat(editEvent.budget) : undefined,
      });

      setEvents((prev) => prev.map((evt) => (evt.id === updatedEvent.id ? updatedEvent : evt)));
      setShowEditEventModal(false);
      resetEditEventForm();
    } catch (error) {
      console.error('Error updating event:', error);
    } finally {
      setIsUpdatingEvent(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!currentColocation || deletingEventId) return;
    setDeletingEventId(eventId);
    try {
      await eventApi.delete(currentColocation.id, eventId);
      setEvents((prev) => prev.filter((event) => event.id !== eventId));
    } catch (error) {
      console.error('Error deleting event:', error);
    } finally {
      setDeletingEventId(null);
    }
  };

  const handleRSVP = async (eventId: string, status: RSVPStatus) => {
    if (!currentColocation || rsvpingEventId) return;
    setRsvpingEventId(eventId);
    try {
      await eventApi.rsvp(currentColocation.id, eventId, status);
      // Refresh events to get updated counts
      await loadEvents();
      // Refresh participants if expanded
      if (expandedEventId === eventId) {
        await loadParticipants(eventId);
      }
    } catch (error) {
      console.error('Error updating RSVP:', error);
    } finally {
      setRsvpingEventId(null);
    }
  };

  const loadParticipants = async (eventId: string) => {
    if (!currentColocation) return;
    try {
      const data = await eventApi.getParticipants(currentColocation.id, eventId);
      setParticipantsData((prev) => ({ ...prev, [eventId]: data.participants }));
    } catch (error) {
      console.error('Error loading participants:', error);
    }
  };

  const toggleParticipants = async (eventId: string) => {
    if (expandedEventId === eventId) {
      setExpandedEventId(null);
    } else {
      setExpandedEventId(eventId);
      if (!participantsData[eventId]) {
        await loadParticipants(eventId);
      }
    }
  };

  const handleDiscover = async () => {
    if (!discoveryCity || !discoveryEventType || isDiscovering) return;
    setIsDiscovering(true);
    setDiscoveredEvents([]);
    setDiscoverySummary('');
    setDiscoveryError('');
    try {
      const result = await eventApi.discover(discoveryCity, discoveryEventType as DiscoverEventType);
      setDiscoveredEvents(result.events || []);
      setDiscoverySummary(result.search_summary || '');
    } catch (error: any) {
      console.error('Error discovering events:', error);
      const msg = error?.response?.data?.message || error?.message || 'Erreur inconnue';
      setDiscoveryError(`Erreur: ${msg}`);
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleAddDiscoveredEvent = (discovered: DiscoveredEvent) => {
    const eventDate = discovered.date.includes(' ')
      ? discovered.date.replace(' ', 'T')
      : discovered.date + 'T20:00';
    setNewEvent({
      title: discovered.title,
      description: discovered.description || '',
      event_date: eventDate,
      location: discovered.location || '',
      budget: discovered.price?.toString() || '',
    });
    setShowNewEventModal(true);
  };

  const getStatusColor = (status: EventStatus) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-700';
      case 'ongoing':
        return 'bg-green-100 text-green-700';
      case 'completed':
        return 'bg-slate-100 text-slate-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusLabel = (status: EventStatus) => {
    switch (status) {
      case 'upcoming':
        return 'À venir';
      case 'ongoing':
        return 'En cours';
      case 'completed':
        return 'Terminé';
      case 'cancelled':
        return 'Annulé';
      default:
        return status;
    }
  };

  const getRSVPIcon = (status: RSVPStatus) => {
    switch (status) {
      case 'going':
        return <Check className="w-4 h-4" />;
      case 'not_going':
        return <X className="w-4 h-4" />;
      case 'maybe':
        return <HelpCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getRSVPColor = (status: RSVPStatus) => {
    switch (status) {
      case 'going':
        return 'bg-green-500 text-white hover:bg-green-600';
      case 'not_going':
        return 'bg-red-500 text-white hover:bg-red-600';
      case 'maybe':
        return 'bg-amber-500 text-white hover:bg-amber-600';
      default:
        return 'bg-slate-200 text-slate-600 hover:bg-slate-300';
    }
  };

  const statusOptions = [
    { value: '', label: 'Tous les statuts' },
    { value: 'upcoming', label: 'À venir' },
    { value: 'ongoing', label: 'En cours' },
    { value: 'completed', label: 'Terminé' },
    { value: 'cancelled', label: 'Annulé' },
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
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-slate-800">Événements</h1>
          <p className="text-sm sm:text-base lg:text-lg text-slate-500 mt-1">
            Organisez les événements de votre colocation
          </p>
        </div>
        <Button
          size="lg"
          leftIcon={<Plus className="w-5 h-5" />}
          onClick={() => setShowNewEventModal(true)}
          className="w-full sm:w-auto"
        >
          Nouvel événement
        </Button>
      </div>

      {/* Discovery Section */}
      <Card elevation="elevated" padding="md">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-primary" />
              <h2 className="font-semibold text-slate-800">Decouvrir des evenements</h2>
            </div>
            <button
              onClick={() => setShowDiscovery(!showDiscovery)}
              className="text-sm text-primary hover:underline font-medium"
            >
              {showDiscovery ? 'Masquer' : 'Rechercher'}
            </button>
          </div>

          {showDiscovery && (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
                <div className="flex-1">
                  <Input
                    label="Ville"
                    placeholder="Ex: Lyon, Paris, Marseille..."
                    value={discoveryCity}
                    onChange={(e) => setDiscoveryCity(e.target.value)}
                    leftIcon={<MapPin className="w-5 h-5" />}
                  />
                </div>
                <div className="flex-1">
                  <Select
                    label="Type d'evenement"
                    options={discoverEventTypeOptions}
                    value={discoveryEventType}
                    onChange={setDiscoveryEventType}
                    placeholder="Choisir un type"
                  />
                </div>
                <Button
                  onClick={handleDiscover}
                  isLoading={isDiscovering}
                  disabled={!discoveryCity || !discoveryEventType || isDiscovering}
                  leftIcon={<Search className="w-4 h-4" />}
                  className="sm:w-auto w-full"
                >
                  Rechercher
                </Button>
              </div>

              {/* Error state */}
              {discoveryError && !isDiscovering && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
                  {discoveryError}
                </div>
              )}

              {/* Loading state */}
              {isDiscovering && (
                <div className="flex items-center gap-3 py-8 justify-center">
                  <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  <span className="text-sm text-slate-500">Recherche en cours avec l'IA...</span>
                </div>
              )}

              {/* Summary */}
              {discoverySummary && !isDiscovering && (
                <p className="text-sm text-slate-500 italic">{discoverySummary}</p>
              )}

              {/* Results */}
              {discoveredEvents.length > 0 && !isDiscovering && (
                <div className="space-y-3">
                  {discoveredEvents.map((event, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-4 p-4 rounded-xl border border-slate-200 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200"
                    >
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-800">{event.title}</h3>
                        <p className="text-sm text-slate-500 mt-1 line-clamp-2">{event.description}</p>
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-400">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            {event.date}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4" />
                            {event.location}
                          </span>
                          {event.price != null && (
                            <span className="flex items-center gap-1.5">
                              <Euro className="w-4 h-4" />
                              {event.price.toFixed(2)} EUR
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="default" size="sm">{event.source}</Badge>
                          {event.url && (
                            <a
                              href={event.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Voir le site
                            </a>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        leftIcon={<Plus className="w-4 h-4" />}
                        onClick={() => handleAddDiscoveredEvent(event)}
                      >
                        Ajouter
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Filters */}
      <Card elevation="elevated" padding="sm">
        <div className="flex flex-col gap-3 p-1 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex-1">
            <Input
              placeholder="Rechercher un événement..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-5 h-5" />}
            />
          </div>
          <div className="w-full sm:w-56">
            <Select
              options={statusOptions}
              value={selectedStatus}
              onChange={setSelectedStatus}
              leftIcon={<Filter className="w-4 h-4" />}
              placeholder="Statut"
            />
          </div>
        </div>
      </Card>

      {/* Events List */}
      <Card elevation="flat" padding="none" className="overflow-hidden">
        <div className="divide-y divide-slate-100">
          <AnimatePresence>
            {filteredEvents.length === 0 ? (
              <EmptyState
                icon={<Calendar className="w-10 h-10" />}
                title="Aucun événement trouvé"
                description="Commencez par créer un événement pour organiser des activités avec votre colocation."
                action={{
                  label: 'Nouvel événement',
                  onClick: () => setShowNewEventModal(true),
                  icon: <Plus className="w-5 h-5" />,
                }}
              />
            ) : (
              filteredEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.03 }}
                  className="flex flex-col gap-4 px-4 py-4 sm:px-5 sm:py-5 hover:bg-slate-50/80 transition-all duration-200"
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 shadow-sm">
                      <Calendar className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="font-semibold text-slate-800 text-base">{event.title}</h3>
                            <Badge variant="default" size="sm" className={getStatusColor(event.status)}>
                              {getStatusLabel(event.status)}
                            </Badge>
                          </div>
                          {event.description && (
                            <p className="text-sm text-slate-500 mt-1 line-clamp-2">{event.description}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-400">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-4 h-4" />
                              {parseEventDate(event.event_date).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {event.location && (
                              <span className="flex items-center gap-1.5">
                                <MapPin className="w-4 h-4" />
                                {event.location}
                              </span>
                            )}
                            {event.budget && (
                              <span className="flex items-center gap-1.5">
                                <Euro className="w-4 h-4" />
                                {event.budget.toFixed(2)} €
                              </span>
                            )}
                          </div>
                          <div className="flex flex-col gap-2 mt-3">
                            <button
                              onClick={() => toggleParticipants(event.id)}
                              className="flex items-center gap-2 text-sm hover:bg-slate-50 rounded-lg px-2 py-1 -ml-2 transition-colors w-fit"
                            >
                              <Users className="w-4 h-4 text-slate-400" />
                              <span className="text-green-600 font-medium">{event.going_count} oui</span>
                              <span className="text-slate-300">•</span>
                              <span className="text-amber-600 font-medium">{event.maybe_count} peut-être</span>
                              <span className="text-slate-300">•</span>
                              <span className="text-red-600 font-medium">{event.not_going_count} non</span>
                            </button>
                            {event.user_rsvp && (event.user_rsvp as string) !== '' && (
                              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium w-fit ${
                                event.user_rsvp === 'going' ? 'bg-green-100 text-green-700' :
                                event.user_rsvp === 'maybe' ? 'bg-amber-100 text-amber-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {getRSVPIcon(event.user_rsvp)}
                                <span>
                                  Vous : {event.user_rsvp === 'going' ? 'Je participe' :
                                         event.user_rsvp === 'maybe' ? 'Peut-être' :
                                         'Non'}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        {user?.id === event.created_by && (
                          <div className="flex items-center gap-0.5 sm:gap-1">
                            <button
                              className="p-2 sm:p-3 rounded-lg sm:rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all duration-200"
                              onClick={() => handleEditEventClick(event)}
                              type="button"
                            >
                              <Edit2 className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                            <button
                              className="p-2 sm:p-3 rounded-lg sm:rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                              onClick={() => handleDeleteEvent(event.id)}
                              disabled={deletingEventId === event.id}
                            >
                              <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* RSVP Buttons */}
                  {event.status !== 'completed' && event.status !== 'cancelled' && (
                    <div className="flex gap-2 ml-16">
                      <button
                        onClick={() => handleRSVP(event.id, 'going')}
                        disabled={rsvpingEventId === event.id}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                          event.user_rsvp === 'going'
                            ? getRSVPColor('going')
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {getRSVPIcon('going')}
                        Je participe
                      </button>
                      <button
                        onClick={() => handleRSVP(event.id, 'maybe')}
                        disabled={rsvpingEventId === event.id}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                          event.user_rsvp === 'maybe'
                            ? getRSVPColor('maybe')
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {getRSVPIcon('maybe')}
                        Peut-être
                      </button>
                      <button
                        onClick={() => handleRSVP(event.id, 'not_going')}
                        disabled={rsvpingEventId === event.id}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                          event.user_rsvp === 'not_going'
                            ? getRSVPColor('not_going')
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {getRSVPIcon('not_going')}
                        Non
                      </button>
                    </div>
                  )}

                  {/* Participants List */}
                  {expandedEventId === event.id && (
                    <div className="ml-16 mt-4 p-4 bg-slate-50 rounded-lg">
                      <h4 className="text-sm font-semibold text-slate-700 mb-3">Participants</h4>
                      {participantsData[event.id] ? (
                        <div className="space-y-2">
                          {participantsData[event.id].length === 0 ? (
                            <p className="text-sm text-slate-400">Aucune réponse pour le moment</p>
                          ) : (
                            participantsData[event.id].map((participant: any) => (
                              <div key={participant.userId} className="flex items-center gap-3">
                                <Avatar
                                  name={`${participant.userPrenom} ${participant.userNom}`}
                                  src={participant.avatarUrl}
                                  size="sm"
                                />
                                <span className="text-sm text-slate-700">
                                  {participant.userPrenom} {participant.userNom}
                                </span>
                                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ml-auto ${
                                  participant.rsvpStatus === 'going' ? 'bg-green-100 text-green-700' :
                                  participant.rsvpStatus === 'maybe' ? 'bg-amber-100 text-amber-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                  {getRSVPIcon(participant.rsvpStatus)}
                                  <span>
                                    {participant.rsvpStatus === 'going' ? 'Participe' :
                                     participant.rsvpStatus === 'maybe' ? 'Peut-être' :
                                     'Non'}
                                  </span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      ) : (
                        <div className="text-sm text-slate-400">Chargement...</div>
                      )}
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </Card>

      {/* New Event Modal */}
      <Modal
        isOpen={showNewEventModal}
        onClose={() => {
          setShowNewEventModal(false);
          resetEventForm();
        }}
        title="Nouvel événement"
        size="lg"
      >
        <form onSubmit={handleCreateEvent} className="space-y-4">
          <Input
            label="Titre"
            placeholder="Ex: Soirée pizza"
            value={newEvent.title}
            onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
            required
          />
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Description (optionnel)</label>
            <textarea
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 outline-none shadow-sm hover:shadow-md hover:border-slate-300 focus:border-primary focus:ring-4 focus:ring-primary/10 focus:shadow-md transition-all duration-200 resize-none"
              rows={3}
              placeholder="Décrivez l'événement..."
              value={newEvent.description}
              onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
            />
          </div>
          <Input
            label="Date et heure"
            type="datetime-local"
            value={newEvent.event_date}
            onChange={(e) => setNewEvent({ ...newEvent, event_date: e.target.value })}
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Lieu (optionnel)"
              placeholder="Ex: Salon"
              value={newEvent.location}
              onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
            />
            <Input
              label="Budget (optionnel)"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={newEvent.budget}
              onChange={(e) => setNewEvent({ ...newEvent, budget: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowNewEventModal(false);
                resetEventForm();
              }}
            >
              Annuler
            </Button>
            <Button type="submit" isLoading={isSavingEvent} disabled={isSavingEvent}>
              Créer l'événement
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Event Modal */}
      <Modal
        isOpen={showEditEventModal}
        onClose={() => {
          setShowEditEventModal(false);
          resetEditEventForm();
        }}
        title="Modifier l'événement"
        size="lg"
      >
        <form onSubmit={handleUpdateEvent} className="space-y-4">
          <Input
            label="Titre"
            placeholder="Ex: Soirée pizza"
            value={editEvent.title}
            onChange={(e) => setEditEvent({ ...editEvent, title: e.target.value })}
            required
          />
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Description (optionnel)</label>
            <textarea
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 outline-none shadow-sm hover:shadow-md hover:border-slate-300 focus:border-primary focus:ring-4 focus:ring-primary/10 focus:shadow-md transition-all duration-200 resize-none"
              rows={3}
              placeholder="Décrivez l'événement..."
              value={editEvent.description}
              onChange={(e) => setEditEvent({ ...editEvent, description: e.target.value })}
            />
          </div>
          <Input
            label="Date et heure"
            type="datetime-local"
            value={editEvent.event_date}
            onChange={(e) => setEditEvent({ ...editEvent, event_date: e.target.value })}
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Lieu (optionnel)"
              placeholder="Ex: Salon"
              value={editEvent.location}
              onChange={(e) => setEditEvent({ ...editEvent, location: e.target.value })}
            />
            <Input
              label="Budget (optionnel)"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={editEvent.budget}
              onChange={(e) => setEditEvent({ ...editEvent, budget: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowEditEventModal(false);
                resetEditEventForm();
              }}
            >
              Annuler
            </Button>
            <Button type="submit" isLoading={isUpdatingEvent} disabled={isUpdatingEvent}>
              Enregistrer les modifications
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
