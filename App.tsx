import React, { useState, useEffect } from 'react';
import { MapPin, Plane, Hotel, Camera, Heart, Clock, CheckCircle, AlertCircle, Settings, Calendar as CalendarIcon, Plus, Binoculars, Ship, Sun, CloudRain, Thermometer, Download, Wifi, WifiOff, Smartphone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Button } from './components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Toaster, toast } from 'sonner@2.0.3';
import Login from './components/Login';
import HorizontalCalendar from './components/HorizontalCalendar';
import ActivityEditor from './components/ActivityEditor';
import AddActivity from './components/AddActivity';
import SwipeableActivity from './components/SwipeableActivity';
import PWADebug from './components/PWADebug';
import AppIcon from './components/AppIcon';
import SettingsPage from './components/Settings';
import { flights, type Activity, type DayPlan } from './data/itinerary';
import { useItinerary } from './hooks/useItinerary';
import { useServiceWorker } from './hooks/useServiceWorker';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  // Use real current time
  const [currentTime, setCurrentTime] = useState(new Date());
  const [nextActivity, setNextActivity] = useState<{day: DayPlan, activity: Activity} | null>(null);
  const [activeTab, setActiveTab] = useState('timeline');
  
  // Editing states
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [suggestedTime, setSuggestedTime] = useState<string>('12:00');

  // Use custom hook for itinerary management
  const { itinerary, updateActivity, addUserActivity, deleteUserActivity, hasChanges } = useItinerary();
  
  // Service Worker PWA hook
  const { 
    isInstallable, 
    installApp, 
    updateAvailable, 
    applyUpdate, 
    isOnline,
    isAppInstalled,
    registrationError,
    isRegistered
  } = useServiceWorker();

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Find next activity
  useEffect(() => {
    const now = currentTime;
    const currentDate = now.toISOString().split('T')[0];

    for (const day of itinerary) {
      if (day.date >= currentDate) {
        for (const activity of day.activities) {
          const activityDateTime = new Date(`${day.date}T${activity.time}:00`);
          if (activityDateTime > now) {
            setNextActivity({ day, activity });
            return;
          }
        }
        if (day.date > currentDate) {
          setNextActivity({ day, activity: day.activities[0] });
          return;
        }
      }
    }
    setNextActivity(null);
  }, [currentTime, itinerary]);

  // Auto-select today's date ONLY on first load (when selectedDay is null)
  useEffect(() => {
    if (selectedDay === null) {
      const today = new Date().toISOString().split('T')[0];
      setSelectedDay(today);
    }
  }, [selectedDay]);

  // Check if user was previously logged in (optional - for better UX)
  useEffect(() => {
    const wasLoggedIn = localStorage.getItem('honeymoon-logged-in');
    if (wasLoggedIn === 'true') {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = () => {
    setIsLoggedIn(true);
    localStorage.setItem('honeymoon-logged-in', 'true');
    toast.success('Benvenuti nel vostro viaggio di nozze! 💕');
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'flight': return <Plane className="w-4 h-4" />;
      case 'hotel': case 'checkin': case 'checkout': return <Hotel className="w-4 h-4" />;
      case 'transport': return <MapPin className="w-4 h-4" />;
      case 'activity': case 'exploration': return <Camera className="w-4 h-4" />;
      case 'meal': return <Heart className="w-4 h-4" />;
      case 'safari': return <Binoculars className="w-4 h-4" />;
      case 'ferry': return <Ship className="w-4 h-4" />;
      case 'wedding': return <Heart className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'flight': return 'bg-blue-100 text-blue-800';
      case 'hotel': case 'checkin': case 'checkout': return 'bg-green-100 text-green-800';
      case 'transport': return 'bg-orange-100 text-orange-800';
      case 'activity': return 'bg-purple-100 text-purple-800';
      case 'exploration': return 'bg-indigo-100 text-indigo-800';
      case 'meal': return 'bg-pink-100 text-pink-800';
      case 'safari': return 'bg-amber-100 text-amber-800';
      case 'ferry': return 'bg-cyan-100 text-cyan-800';
      case 'wedding': return 'bg-rose-100 text-rose-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isActivityCurrent = (dayDate: string, activityTime: string) => {
    const now = currentTime;
    const activityDateTime = new Date(`${dayDate}T${activityTime}:00`);
    const oneHourLater = new Date(activityDateTime.getTime() + 60 * 60 * 1000);
    return now >= activityDateTime && now <= oneHourLater;
  };

  const isActivityPast = (dayDate: string, activityTime: string) => {
    const now = currentTime;
    const activityDateTime = new Date(`${dayDate}T${activityTime}:00`);
    return now > activityDateTime;
  };

  const handleEditActivity = (activity: Activity) => {
    setEditingActivity(activity);
    setIsEditModalOpen(true);
  };

  const handleSaveActivity = (updatedActivity: Activity) => {
    if (!selectedDay || !editingActivity) return;
    
    updateActivity(selectedDay, editingActivity.id, updatedActivity);
    toast.success('Attività aggiornata con successo!');
    setEditingActivity(null);
  };

  const handleDeleteActivity = (activity: Activity) => {
    if (!selectedDay) return;
    
    if ((activity as any).isUserCreated) {
      deleteUserActivity(selectedDay, activity.id);
      toast.success('Attività eliminata');
    } else {
      updateActivity(selectedDay, activity.id, { isDeleted: true } as any);
      toast.success('Attività nascosta');
    }
    setIsEditModalOpen(false);
    setEditingActivity(null);
  };

  const handleAddActivity = () => {
    if (!selectedDay) return;
    
    const selectedDayPlan = itinerary.find(day => day.date === selectedDay);
    if (selectedDayPlan && selectedDayPlan.activities.length > 0) {
      const lastActivity = selectedDayPlan.activities[selectedDayPlan.activities.length - 1];
      const lastTime = new Date(`2000-01-01T${lastActivity.time}:00`);
      lastTime.setHours(lastTime.getHours() + 1);
      setSuggestedTime(lastTime.toTimeString().slice(0, 5));
    }
    
    setIsAddModalOpen(true);
  };

  const handleSaveNewActivity = (activity: Omit<Activity, 'id'>) => {
    if (!selectedDay) return;
    
    addUserActivity(selectedDay, activity);
    toast.success('Nuova attività aggiunta!');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('honeymoon-logged-in');
    toast.info('Alla prossima! 👋');
  };

  // Navigation functions for calendar
  const handlePreviousDay = () => {
    const currentIndex = itinerary.findIndex(day => day.date === selectedDay);
    if (currentIndex > 0) {
      setSelectedDay(itinerary[currentIndex - 1].date);
    }
  };

  const handleNextDay = () => {
    const currentIndex = itinerary.findIndex(day => day.date === selectedDay);
    if (currentIndex < itinerary.length - 1) {
      setSelectedDay(itinerary[currentIndex + 1].date);
    }
  };

  // Helper function to get day insights
  const getDayInsights = (dayPlan: DayPlan) => {
    const activities = dayPlan.activities.filter(act => !(act as any).isDeleted);
    const activityTypes = activities.reduce((acc, act) => {
      acc[act.type] = (acc[act.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const highlights = [];
    
    if (activityTypes.flight) highlights.push(`${activityTypes.flight} volo${activityTypes.flight > 1 ? 'i' : ''}`);
    if (activityTypes.safari) highlights.push(`${activityTypes.safari} safari`);
    if (activityTypes.exploration) highlights.push(`${activityTypes.exploration} esplorazione${activityTypes.exploration > 1 ? 'i' : ''}`);
    if (activityTypes.activity) highlights.push(`${activityTypes.activity} attività`);
    if (activityTypes.meal) highlights.push(`${activityTypes.meal} pasto${activityTypes.meal > 1 ? 'i' : ''}`);

    let description = '';
    if (dayPlan.location.includes('Cape Town')) {
      description = 'Esplorazione della città più bella del Sudafrica';
    } else if (dayPlan.location.includes('Kruger')) {
      description = 'Avventura safari nel parco nazionale più famoso d\'Africa';
    } else if (dayPlan.location.includes('Seychelles') || dayPlan.location.includes('Mahe') || dayPlan.location.includes('Praslin') || dayPlan.location.includes('La Digue')) {
      description = 'Paradiso tropicale e spiagge da sogno';
    } else if (dayPlan.location.includes('Milano')) {
      if (dayPlan.date === '2025-06-27') {
        description = '💒 Il giorno più bello - Il nostro matrimonio!';
      } else {
        description = 'Partenza per il viaggio di nozze';
      }
    } else if (dayPlan.location.includes('Graskop')) {
      description = 'Panorami mozzafiato e canyon spettacolari';
    }

    return {
      highlights: highlights.slice(0, 3),
      description,
      totalActivities: activities.length
    };
  };

  const today = currentTime.toISOString().split('T')[0];
  const todayPlan = itinerary.find(day => day.date === today);
  const selectedDayPlan = selectedDay ? itinerary.find(day => day.date === selectedDay) : null;

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        {/* Header */}
        <header className="bg-white/95 backdrop-blur-sm sticky top-0 z-30 border-b border-gray-200 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <AppIcon size={32} className="sm:w-10 sm:h-10" />
                  <div className="min-w-0">
                    <h1 className="text-lg sm:text-xl font-bold text-gray-800 truncate">27.06.25</h1>
                    <p className="text-xs sm:text-sm text-gray-600 truncate">Alice &amp; Alessandro • Il nostro matrimonio e viaggio di nozze</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                {/* Today's Info */}
                {todayPlan && (
                  <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-blue-700">Oggi: {todayPlan.location}</span>
                  </div>
                )}

                {/* Next Activity */}
                {nextActivity && (
                  <div className="hidden lg:flex items-center gap-2 px-3 py-2 bg-pink-50 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-pink-600" />
                    <div className="text-sm">
                      <span className="text-pink-600 font-medium">{nextActivity.activity.time}</span>
                      <span className="text-gray-600 ml-2">{nextActivity.activity.title}</span>
                    </div>
                  </div>
                )}

                {/* Online/Offline Status */}
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${
                  isOnline ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'
                }`} title={isOnline ? 'Online' : 'Offline'}>
                  {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                  <span className="hidden sm:inline text-xs">
                    {isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>

                {/* Changes indicator */}
                {hasChanges && (
                  <div className="flex items-center gap-2 px-2 sm:px-3 py-2 bg-orange-50 rounded-lg">
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                    <span className="text-xs sm:text-sm text-orange-700 hidden sm:inline">Modifiche non salvate</span>
                  </div>
                )}

                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setActiveTab('settings')} 
                  title="Impostazioni" 
                  className={`p-2 ${activeTab === 'settings' ? 'bg-gray-100' : ''}`}
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Tabs Navigation */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-4 gap-4">
                <TabsList className="grid w-full sm:w-auto grid-cols-4">
                  <TabsTrigger value="timeline" className="text-xs sm:text-sm">Timeline</TabsTrigger>
                  <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
                  <TabsTrigger value="flights" className="text-xs sm:text-sm">Voli</TabsTrigger>
                  <TabsTrigger value="settings" className="text-xs sm:text-sm">
                    <Settings className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Impostazioni</span>
                    <span className="sm:hidden">Settings</span>
                  </TabsTrigger>
                </TabsList>

                {activeTab === 'timeline' && selectedDay && (
                  <Button onClick={handleAddActivity} className="gap-2 w-full sm:w-auto" size="sm">
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Aggiungi Attività</span>
                    <span className="sm:hidden">Aggiungi</span>
                  </Button>
                )}
              </div>
            </Tabs>
          </div>
        </div>

        {/* Horizontal Calendar - Only for Timeline Tab */}
        {activeTab === 'timeline' && (
          <HorizontalCalendar
            itinerary={itinerary}
            selectedDate={selectedDay}
            onDateSelect={setSelectedDay}
            currentDate={today}
            onPreviousDay={handlePreviousDay}
            onNextDay={handleNextDay}
          />
        )}

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsContent value="timeline" className="space-y-4 mt-0">
              {selectedDayPlan ? (
                <div>
                  {/* Enhanced Day Banner - Mobile Optimized */}
                  <div className="relative mb-6 sm:mb-8 overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 shadow-xl sm:shadow-2xl">
                    <div className="absolute inset-0 bg-black/20"></div>
                    <div className="relative p-4 sm:p-6 text-white">
                      {/* Header Section */}
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          {/* Title and Location */}
                          <div className="flex items-start gap-3 mb-3">
                            <div className="bg-white/20 backdrop-blur-sm rounded-full p-1.5 sm:p-2 flex-shrink-0">
                              <CalendarIcon className="w-4 h-4 sm:w-6 sm:h-6" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-baseline gap-2 mb-1">
                                <h2 className="text-xl sm:text-2xl font-bold truncate">
                                  {selectedDayPlan.dayName} {selectedDayPlan.date.split('-').reverse().join('/')}
                                </h2>
                                {/* Activity Count Badge - Mobile Inline */}
                                <div className="sm:hidden bg-white/20 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1 flex-shrink-0">
                                  <span className="text-sm font-bold">{getDayInsights(selectedDayPlan).totalActivities}</span>
                                  <span className="text-xs">att.</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 text-white/90">
                                <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                <span className="font-medium text-sm sm:text-base truncate">{selectedDayPlan.location}</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Description */}
                          <div className="mb-3 sm:mb-4">
                            <p className="text-white/95 text-sm sm:text-lg leading-relaxed">
                              {getDayInsights(selectedDayPlan).description}
                            </p>
                            
                            {/* Weather Info */}
                            {selectedDayPlan.weather && (
                              <div className="flex items-center gap-2 text-white/80 mt-2">
                                {selectedDayPlan.weather.includes('☀️') ? <Sun className="w-3 h-3 sm:w-4 sm:h-4" /> :
                                 selectedDayPlan.weather.includes('🌤️') || selectedDayPlan.weather.includes('⛅') ? <CloudRain className="w-3 h-3 sm:w-4 sm:h-4" /> :
                                 <Thermometer className="w-3 h-3 sm:w-4 sm:h-4" />}
                                <span className="text-xs sm:text-sm">{selectedDayPlan.weather}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Stats - Desktop Only */}
                        <div className="hidden sm:block text-right flex-shrink-0">
                          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 text-center min-w-[120px]">
                            <div className="text-3xl font-bold mb-1">
                              {getDayInsights(selectedDayPlan).totalActivities}
                            </div>
                            <div className="text-white/80 text-sm">
                              attività in programma
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Activity Highlights */}
                      <div className="mb-3 sm:mb-4">
                        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                          {getDayInsights(selectedDayPlan).highlights.map((highlight, idx) => (
                            <Badge key={idx} variant="outline" className="bg-white/20 text-white border-white/30 backdrop-blur-sm text-xs justify-center">
                              {highlight}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      {/* Time Range */}
                      {selectedDayPlan.activities.length > 0 && (
                        <div className="pt-3 sm:pt-4 border-t border-white/20">
                          <div className="flex items-center gap-2 sm:gap-3 text-white/90">
                            <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span className="text-xs sm:text-sm">
                              Dalle {selectedDayPlan.activities[0].time} alle{' '}
                              {selectedDayPlan.activities[selectedDayPlan.activities.length - 1].time}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Timeline with Connectors */}
                  <div className="relative">
                    {/* Vertical Timeline Line */}
                    <div className="absolute left-4 sm:left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-gray-200 via-gray-300 to-gray-200"></div>
                    
                    <div className="space-y-0">
                      {selectedDayPlan.activities
                        .filter(activity => !(activity as any).isDeleted)
                        .map((activity, idx, filteredActivities) => {
                          const isCurrent = isActivityCurrent(selectedDayPlan.date, activity.time);
                          const isPast = isActivityPast(selectedDayPlan.date, activity.time);
                          const nextActivity = filteredActivities[idx + 1];
                          const isLast = idx === filteredActivities.length - 1;
                          
                          return (
                            <div key={activity.id} className="relative">
                              {/* Timeline Dot */}
                              <div className={`absolute left-3 sm:left-5 top-6 w-3 h-3 rounded-full z-10 border-2 border-white shadow-sm ${
                                isCurrent ? 'bg-pink-500 animate-pulse' : 
                                isPast ? 'bg-green-500' : 'bg-gray-400'
                              }`}></div>
                              
                              {/* Activity Card */}
                              <div className="ml-8 sm:ml-12 pb-4">
                                <SwipeableActivity
                                  activity={activity}
                                  isCurrentActivity={isCurrent}
                                  isPastActivity={isPast}
                                  onEdit={() => handleEditActivity(activity)}
                                  onDelete={(activity as any).isUserCreated ? () => handleDeleteActivity(activity) : undefined}
                                  getTypeIcon={getTypeIcon}
                                  getTypeColor={getTypeColor}
                                />
                              </div>

                              {/* Connection Line for continuous activities */}
                              {nextActivity && !isLast && (
                                <div className="relative ml-8 sm:ml-12 -mt-2 mb-2">
                                  {/* Travel time indicator */}
                                  {nextActivity.travelTime ? (
                                    <div className="flex items-center gap-2 py-2">
                                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                                      <div className="bg-blue-50 px-2 sm:px-3 py-1 rounded-full text-xs text-blue-700 flex items-center gap-1">
                                        <MapPin className="w-3 h-3" />
                                        <span className="hidden sm:inline">{nextActivity.travelTime.duration}</span>
                                        <span className="sm:hidden">{nextActivity.travelTime.duration.replace(' min', 'm')}</span>
                                      </div>
                                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                                    </div>
                                  ) : (
                                    /* Simple connector for sequential activities */
                                    <div className="flex items-center py-1">
                                      <div className="flex-1 h-px bg-gray-200"></div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8 sm:p-12 text-center">
                    <CalendarIcon className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-base sm:text-lg font-medium text-gray-600 mb-2">Seleziona una data</h3>
                    <p className="text-sm sm:text-base text-gray-500">Scegli un giorno dal calendario sopra per vedere le attività</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="overview" className="space-y-6 mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {itinerary.map((day) => (
                  <Card key={day.date} className="hover:shadow-lg transition-all cursor-pointer group"
                        onClick={() => {setSelectedDay(day.date); setActiveTab('timeline');}}>
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="group-hover:text-pink-600 transition-colors">
                            {day.dayName} {day.date.split('-').reverse().join('/')}
                          </CardTitle>
                          <p className="text-gray-600 flex items-center gap-1 mt-1">
                            <MapPin className="w-4 h-4" />
                            {day.location}
                          </p>
                        </div>
                        <Badge variant="outline">{day.activities.length}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {day.activities.slice(0, 4).map((activity) => (
                          <div key={activity.id} className="flex items-center gap-3 text-sm">
                            <span className="text-gray-500 w-12 flex-shrink-0">{activity.time}</span>
                            <span className="text-gray-700 truncate">{activity.title}</span>
                          </div>
                        ))}
                        {day.activities.length > 4 && (
                          <p className="text-gray-500 text-sm mt-3">
                            e altre {day.activities.length - 4} attività...
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="flights" className="space-y-6 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plane className="w-5 h-5" />
                    Operativo Voli - Ethiopian Airlines
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {flights.map((flight, idx) => (
                    <div key={idx} className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <p className="font-medium text-blue-900">{flight.route}</p>
                          <p className="text-sm text-blue-700">{flight.date} - {flight.flight}</p>
                        </div>
                        <Badge variant="outline" className="bg-white border-blue-300 text-blue-700">
                          {flight.dep} → {flight.arr}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Car Rental Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      🚗 Auto Noleggio 1 - Cape Town
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><strong>Periodo:</strong> 01-05 Luglio 2025</div>
                      <div><strong>Durata:</strong> 5 giorni</div>
                      <div><strong>Auto:</strong> Toyota Corolla Quest</div>
                      <div><strong>Posti:</strong> 5 posti, 2 valige</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded text-sm">
                      <p><strong>Caratteristiche:</strong> Economica, 4 porte, aria condizionata, km illimitati</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      🚙 Auto Noleggio 2 - Kruger
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><strong>Periodo:</strong> 05-11 Luglio 2025</div>
                      <div><strong>Durata:</strong> 7 giorni</div>
                      <div><strong>Auto:</strong> T-ROC o similare</div>
                      <div><strong>Posti:</strong> 5 posti, 2 valige</div>
                    </div>
                    <div className="bg-orange-50 p-3 rounded text-sm border-l-4 border-orange-400">
                      <p><strong>⚠️ Drop Off Fee:</strong> ZAR 1.490 da pagare in loco</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="mt-0">
              <SettingsPage 
                onLogout={handleLogout}
                hasChanges={hasChanges}
                currentTime={currentTime}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <footer className="mt-16 border-t border-gray-200 bg-white/50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 text-center">
            <p className="text-xs text-gray-400">
              Ultimo aggiornamento: {currentTime.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </footer>

        {/* Edit Activity Modal */}
        {editingActivity && (
          <ActivityEditor
            activity={editingActivity}
            onSave={handleSaveActivity}
            onDelete={() => handleDeleteActivity(editingActivity)}
            isOpen={isEditModalOpen}
            onOpenChange={setIsEditModalOpen}
          />
        )}

        {/* Add Activity Modal */}
        <AddActivity
          isOpen={isAddModalOpen}
          onOpenChange={setIsAddModalOpen}
          onAdd={handleSaveNewActivity}
          suggestedTime={suggestedTime}
        />
        
        {/* PWA Debug - Development Tool */}
        <PWADebug />
      </div>

      {/* Toast Notifications */}
      <Toaster 
        position="top-center" 
        richColors 
        closeButton
        toastOptions={{
          duration: 3000,
          style: {
            marginTop: '80px', // Account for header
          }
        }}
      />
    </>
  );
}