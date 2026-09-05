import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  AlertCircle,
  Star,
  Settings,
  QrCode,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  LogOut,
  Save,
  Printer,
  ChevronRight,
  Clock,
  Search,
  Sliders,
  HelpCircle,
  Download,
  Volume2,
  VolumeX,
  LayoutGrid,
  Eye,
  Plus
} from 'lucide-react';
import QRCode from 'qrcode';
import { RestaurantProfile, CustomerFeedback, GameDatabase } from '../types';
import {
  updateRestaurantProfile,
  updateFeedbackResolution,
  subscribeToRestaurantFeedbacks,
  saveRestaurantGameQuestions
} from '../utils/restaurantService';
import { ContentManager } from './ContentManager';
import { sounds } from '../utils/sound';

export interface AdminPortalProps {
  restaurant: RestaurantProfile;
  setRestaurant?: (profile: RestaurantProfile) => void;
  onUpdateRestaurant?: (profile: RestaurantProfile) => void;
  gameDb: GameDatabase;
  setGameDb?: React.Dispatch<React.SetStateAction<GameDatabase>> | ((db: GameDatabase) => void);
  onUpdateQuestions?: (questions: Partial<GameDatabase>) => void;
  onExitAdmin?: () => void;
  onLogout?: () => void;
}

type AdminTab = 'feedbacks' | 'tables' | 'settings' | 'questions' | 'qrs';

export const AdminPortal: React.FC<AdminPortalProps> = ({
  restaurant,
  setRestaurant,
  onUpdateRestaurant,
  gameDb,
  setGameDb,
  onUpdateQuestions,
  onExitAdmin,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('feedbacks');
  const [feedbacks, setFeedbacks] = useState<CustomerFeedback[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'complaints' | 'reviews' | 'unresolved'>('all');
  const [searchTable, setSearchTable] = useState<string>('');
  const [adminSoundAlert, setAdminSoundAlert] = useState<boolean>(true);

  // Settings form state
  const [restaurantName, setRestaurantName] = useState<string>(restaurant.name);
  const [googleReviewUrl, setGoogleReviewUrl] = useState<string>(restaurant.googleReviewUrl);
  const [adminPin, setAdminPin] = useState<string>(restaurant.adminPin || '1234');
  const [isSavingSettings, setIsSavingSettings] = useState<boolean>(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string>('');

  // Selected feedback for resolution drawer/details
  const [selectedFeedback, setSelectedFeedback] = useState<CustomerFeedback | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState<string>('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);

  // QR stand preview cache
  const [qrMap, setQrMap] = useState<Record<string, string>>({});
  const [selectedQrTable, setSelectedQrTable] = useState<string>(restaurant.tables?.[0] || 'Table 1');

  // Track prev feedback count to trigger audio alert on new complaint
  const prevComplaintCountRef = useRef<number | null>(null);

  // Helper wrappers for flexible props
  const handleUpdateProfile = (updated: RestaurantProfile) => {
    if (setRestaurant) setRestaurant(updated);
    if (onUpdateRestaurant) onUpdateRestaurant(updated);
  };

  const handleUpdateGameDb = (action: GameDatabase | ((prev: GameDatabase) => GameDatabase)) => {
    const nextDb = typeof action === 'function' ? action(gameDb) : action;
    if (setGameDb) {
      (setGameDb as (db: GameDatabase) => void)(nextDb);
    }
    if (onUpdateQuestions) {
      onUpdateQuestions(nextDb);
    }
  };

  const handleExit = () => {
    if (onExitAdmin) onExitAdmin();
    if (onLogout) onLogout();
  };

  // Listen to feedbacks real-time
  useEffect(() => {
    const unsubscribe = subscribeToRestaurantFeedbacks(restaurant.id, (items) => {
      setFeedbacks(items);

      const pendingComplaints = items.filter((f) => f.type === 'complaint' && f.status !== 'resolved').length;
      if (
        prevComplaintCountRef.current !== null &&
        pendingComplaints > prevComplaintCountRef.current &&
        adminSoundAlert
      ) {
        // Play notification chime for manager
        sounds.playBuzzer();
      }
      prevComplaintCountRef.current = pendingComplaints;
    });
    return () => unsubscribe();
  }, [restaurant.id, adminSoundAlert]);

  // Generate QR codes for all tables
  useEffect(() => {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    const baseUrl = `${origin}${pathname}`;
    const tables = restaurant.tables || ['Table 1', 'Table 2', 'Table 3', 'Table 4'];

    tables.forEach(async (t) => {
      const clean = t.replace(/^Table\s*#?/i, '').trim();
      // Nested URL: includes restaurant ID and table number!
      const targetUrl = `${baseUrl}?restaurant=${encodeURIComponent(restaurant.id)}&table=${encodeURIComponent(clean)}`;
      try {
        const dataUrl = await QRCode.toDataURL(targetUrl, {
          width: 320,
          margin: 2,
          color: {
            dark: '#1A1A1A',
            light: '#FFFFFF',
          },
        });
        setQrMap((prev) => ({ ...prev, [t]: dataUrl }));
      } catch (err) {
        console.error('Failed to generate QR for table:', t, err);
      }
    });
  }, [restaurant.id, restaurant.tables]);

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      const updated: RestaurantProfile = {
        ...restaurant,
        name: restaurantName.trim(),
        googleReviewUrl: googleReviewUrl.trim(),
        adminPin: adminPin.trim() || '1234',
        updatedAt: new Date().toISOString(),
      };
      await updateRestaurantProfile(updated);
      handleUpdateProfile(updated);
      setSaveSuccessMessage('Settings saved and synchronized with all table QRs!');
      setTimeout(() => setSaveSuccessMessage(''), 4000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      alert('Error updating restaurant settings.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Update feedback resolution
  const handleUpdateStatus = async (status: CustomerFeedback['status']) => {
    if (!selectedFeedback) return;
    setIsUpdatingStatus(true);
    try {
      await updateFeedbackResolution(
        restaurant.id,
        selectedFeedback.id,
        status,
        resolutionNotes
      );
      setSelectedFeedback((prev) =>
        prev ? { ...prev, status, resolutionNotes } : null
      );
    } catch (err) {
      console.error('Failed to update resolution:', err);
      alert('Error updating status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Export feedback data to CSV
  const exportFeedbacksCSV = () => {
    if (feedbacks.length === 0) {
      alert('No feedbacks to export yet.');
      return;
    }
    const headers = ['ID', 'Table', 'Type', 'Status', 'Rating', 'Comment', 'Customer Name', 'Created At', 'Resolution Notes'];
    const rows = feedbacks.map((f) => [
      f.id,
      f.table,
      f.type,
      f.status,
      f.rating || '',
      `"${(f.comment || '').replace(/"/g, '""')}"`,
      `"${(f.customerName || '').replace(/"/g, '""')}"`,
      new Date(f.createdAt).toLocaleString(),
      `"${(f.resolutionNotes || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${restaurant.name.replace(/\s+/g, '_')}_feedbacks_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter feedbacks
  const filteredFeedbacks = feedbacks.filter((fb) => {
    if (filterType === 'complaints' && fb.type !== 'complaint') return false;
    if (filterType === 'reviews' && fb.type !== 'review') return false;
    if (filterType === 'unresolved' && fb.status === 'resolved') return false;
    if (searchTable.trim()) {
      return fb.table.toLowerCase().includes(searchTable.toLowerCase().trim());
    }
    return true;
  });

  const complaintCount = feedbacks.filter((f) => f.type === 'complaint' && f.status !== 'resolved').length;
  const reviewCount = feedbacks.filter((f) => f.type === 'review').length;
  const avgRating =
    reviewCount > 0
      ? (
          feedbacks
            .filter((f) => f.rating)
            .reduce((acc, curr) => acc + (curr.rating || 0), 0) /
          feedbacks.filter((f) => f.rating).length
        ).toFixed(1)
      : '5.0';

  const tables = restaurant.tables || ['Table 1', 'Table 2', 'Table 3', 'Table 4'];

  const printSingleTable = (t: string) => {
    const qrImage = qrMap[t];
    if (!qrImage) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print table stand.');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${restaurant.name} - ${t} QR Stand</title>
          <style>
            @page { size: auto; margin: 10mm; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              background-color: #f5f5f5;
            }
            .card {
              background: #fff;
              border: 4px solid #1A1A1A;
              border-radius: 24px;
              padding: 36px 30px;
              text-align: center;
              max-width: 340px;
              box-shadow: 6px 6px 0px #1A1A1A;
            }
            .badge {
              display: inline-block;
              background: #FFD166;
              border: 2px solid #1A1A1A;
              padding: 4px 14px;
              font-weight: 900;
              font-size: 13px;
              border-radius: 999px;
              margin-bottom: 12px;
            }
            .title {
              font-size: 26px;
              font-weight: 900;
              margin: 0 0 4px 0;
            }
            .sub {
              font-size: 13px;
              color: #FF5A5F;
              font-weight: 800;
              margin-bottom: 20px;
              text-transform: uppercase;
            }
            .qr-wrap {
              border: 3px solid #1A1A1A;
              border-radius: 16px;
              padding: 14px;
              display: inline-block;
              background: #FFF9F2;
              margin-bottom: 18px;
            }
            .qr-wrap img {
              display: block;
              width: 220px;
              height: 220px;
            }
            .footer-note {
              font-size: 12px;
              font-weight: 700;
              color: #444;
              margin: 0;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="badge">${restaurant.name}</div>
            <h1 class="title">${t}</h1>
            <div class="sub">Scan to Play & Review</div>
            <div class="qr-wrap">
              <img src="${qrImage}" />
            </div>
            <p class="footer-note">No app download or login required!<br/>Just point your phone camera to play & review.</p>
          </div>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const printAllTables = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print stands.');
      return;
    }

    const cardsHtml = tables
      .map((t) => {
        const qr = qrMap[t] || '';
        return `
        <div class="card">
          <div class="badge">${restaurant.name}</div>
          <h1 class="title">${t}</h1>
          <div class="sub">Scan to Play & Review</div>
          <div class="qr-wrap">
            <img src="${qr}" />
          </div>
          <p class="footer-note">No app download or login required!<br/>Point phone camera to join table.</p>
        </div>
      `;
      })
      .join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${restaurant.name} - All Table Stands</title>
          <style>
            @page { size: auto; margin: 10mm; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              margin: 0;
              padding: 20px;
              background-color: #fff;
            }
            .grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 20px;
            }
            .card {
              page-break-inside: avoid;
              background: #fff;
              border: 3px solid #1A1A1A;
              border-radius: 20px;
              padding: 24px 20px;
              text-align: center;
            }
            .badge {
              display: inline-block;
              background: #FFD166;
              border: 2px solid #1A1A1A;
              padding: 3px 12px;
              font-weight: 900;
              font-size: 11px;
              border-radius: 999px;
              margin-bottom: 8px;
            }
            .title {
              font-size: 22px;
              font-weight: 900;
              margin: 0 0 4px 0;
            }
            .sub {
              font-size: 11px;
              color: #FF5A5F;
              font-weight: 800;
              margin-bottom: 12px;
              text-transform: uppercase;
            }
            .qr-wrap {
              border: 2px solid #1A1A1A;
              border-radius: 12px;
              padding: 10px;
              display: inline-block;
              background: #FFF9F2;
              margin-bottom: 12px;
            }
            .qr-wrap img {
              display: block;
              width: 170px;
              height: 170px;
            }
            .footer-note {
              font-size: 11px;
              font-weight: 700;
              color: #444;
              margin: 0;
            }
          </style>
        </head>
        <body>
          <div class="grid">
            ${cardsHtml}
          </div>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      {/* Top Admin Banner */}
      <div className="bg-[#1A1A1A] text-white p-4 sm:p-6 rounded-3xl border-4 border-black shadow-[6px_6px_0px_0px_rgba(255,209,102,1)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#FFD166] text-[#1A1A1A] flex items-center justify-center border-2 border-white shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
            <Settings className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black italic tracking-tight">
                {restaurant.name}
              </h2>
              <span className="px-2 py-0.5 rounded-md bg-[#06D6A0] text-black text-[10px] font-black uppercase">
                ADMIN
              </span>
            </div>
            <p className="text-xs text-neutral-300 font-bold">
              Google Reviews Integration • Live Complaints Hub • Table QR Manager
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={handleExit}
            className="py-2 px-3.5 rounded-xl bg-white hover:bg-neutral-100 text-[#1A1A1A] text-xs font-black border-2 border-black transition cursor-pointer flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5"
          >
            <LogOut className="w-4 h-4" />
            <span>Switch to Guest Table View</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b-2 border-black/15">
        <button
          onClick={() => setActiveTab('feedbacks')}
          className={`py-2.5 px-4 rounded-xl text-xs font-black transition cursor-pointer border-2 border-black flex items-center gap-2 ${
            activeTab === 'feedbacks'
              ? 'bg-[#FFD166] text-[#1A1A1A] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5'
              : 'bg-white text-neutral-700 hover:bg-neutral-50'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Reviews & Complaints</span>
          {complaintCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-[#FF5A5F] text-white text-[10px] font-black animate-pulse">
              {complaintCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('tables')}
          className={`py-2.5 px-4 rounded-xl text-xs font-black transition cursor-pointer border-2 border-black flex items-center gap-2 ${
            activeTab === 'tables'
              ? 'bg-[#FFD166] text-[#1A1A1A] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5'
              : 'bg-white text-neutral-700 hover:bg-neutral-50'
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          <span>Floor & Table Monitor</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`py-2.5 px-4 rounded-xl text-xs font-black transition cursor-pointer border-2 border-black flex items-center gap-2 ${
            activeTab === 'settings'
              ? 'bg-[#FFD166] text-[#1A1A1A] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5'
              : 'bg-white text-neutral-700 hover:bg-neutral-50'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Google Review & Details</span>
        </button>

        <button
          onClick={() => setActiveTab('questions')}
          className={`py-2.5 px-4 rounded-xl text-xs font-black transition cursor-pointer border-2 border-black flex items-center gap-2 ${
            activeTab === 'questions'
              ? 'bg-[#FFD166] text-[#1A1A1A] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5'
              : 'bg-white text-neutral-700 hover:bg-neutral-50'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>App Questions Control</span>
        </button>

        <button
          onClick={() => setActiveTab('qrs')}
          className={`py-2.5 px-4 rounded-xl text-xs font-black transition cursor-pointer border-2 border-black flex items-center gap-2 ${
            activeTab === 'qrs'
              ? 'bg-[#FFD166] text-[#1A1A1A] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5'
              : 'bg-white text-neutral-700 hover:bg-neutral-50'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>Table QR Stands (Auto-Login)</span>
        </button>
      </div>

      {/* TAB 1: REVIEWS & COMPLAINTS FEED */}
      {activeTab === 'feedbacks' && (
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white border-3 border-black p-4 rounded-2xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <span className="text-[11px] font-black uppercase text-neutral-500 block">
                Average Rating
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <Star className="w-5 h-5 fill-[#FFD166] text-[#1A1A1A]" />
                <span className="text-2xl font-black text-[#1A1A1A]">{avgRating}</span>
                <span className="text-xs text-neutral-400 font-bold">/ 5.0</span>
              </div>
            </div>

            <div className="bg-white border-3 border-black p-4 rounded-2xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <span className="text-[11px] font-black uppercase text-neutral-500 block">
                Total Reviews
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <MessageSquare className="w-5 h-5 text-[#4285F4]" />
                <span className="text-2xl font-black text-[#1A1A1A]">{reviewCount}</span>
              </div>
            </div>

            <div className="bg-white border-3 border-black p-4 rounded-2xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <span className="text-[11px] font-black uppercase text-neutral-500 block">
                Pending Complaints
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <AlertCircle className="w-5 h-5 text-[#FF5A5F]" />
                <span className="text-2xl font-black text-[#FF5A5F]">{complaintCount}</span>
                {complaintCount > 0 && (
                  <span className="text-[10px] font-black bg-[#FF5A5F]/10 text-[#FF5A5F] px-1.5 py-0.5 rounded">
                    Action needed
                  </span>
                )}
              </div>
            </div>

            <div className="bg-white border-3 border-black p-4 rounded-2xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <span className="text-[11px] font-black uppercase text-neutral-500 block">
                Google Review Link
              </span>
              <div className="mt-1.5 truncate">
                <a
                  href={restaurant.googleReviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-black text-[#4285F4] hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Open Google Form</span>
                </a>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white border-3 border-black p-3 rounded-2xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer border-2 border-black ${
                  filterType === 'all'
                    ? 'bg-[#1A1A1A] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                    : 'bg-neutral-100 text-neutral-700'
                }`}
              >
                All ({feedbacks.length})
              </button>

              <button
                onClick={() => setFilterType('complaints')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer border-2 border-black flex items-center gap-1 ${
                  filterType === 'complaints'
                    ? 'bg-[#FF5A5F] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                    : 'bg-neutral-100 text-[#FF5A5F]'
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Complaints ({feedbacks.filter((f) => f.type === 'complaint').length})</span>
              </button>

              <button
                onClick={() => setFilterType('unresolved')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer border-2 border-black ${
                  filterType === 'unresolved'
                    ? 'bg-[#FFD166] text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                    : 'bg-neutral-100 text-neutral-700'
                }`}
              >
                Unresolved
              </button>

              <button
                onClick={() => setFilterType('reviews')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer border-2 border-black ${
                  filterType === 'reviews'
                    ? 'bg-[#06D6A0] text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                    : 'bg-neutral-100 text-neutral-700'
                }`}
              >
                Reviews ({reviewCount})
              </button>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setAdminSoundAlert(!adminSoundAlert)}
                className={`p-1.5 px-2.5 rounded-xl border-2 border-black text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                  adminSoundAlert
                    ? 'bg-[#06D6A0] text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                    : 'bg-neutral-100 text-neutral-500'
                }`}
                title={adminSoundAlert ? 'Sound alerts ON for new complaints' : 'Sound alerts muted'}
              >
                {adminSoundAlert ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                <span className="text-[11px] hidden sm:inline">{adminSoundAlert ? 'Alerts On' : 'Muted'}</span>
              </button>

              <button
                type="button"
                onClick={exportFeedbacksCSV}
                className="p-1.5 px-2.5 rounded-xl bg-white hover:bg-neutral-100 border-2 border-black text-xs font-black text-neutral-800 transition cursor-pointer flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5"
                title="Download CSV spreadsheet of all reviews and complaints"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="text-[11px]">Export CSV</span>
              </button>

              <div className="flex items-center gap-1.5 bg-neutral-50 border-2 border-black rounded-xl px-2.5 py-1 flex-1 sm:flex-initial">
                <Search className="w-3.5 h-3.5 text-neutral-400" />
                <input
                  type="text"
                  value={searchTable}
                  onChange={(e) => setSearchTable(e.target.value)}
                  placeholder="Filter table..."
                  className="bg-transparent text-xs font-bold outline-none text-[#1A1A1A] w-full sm:w-32"
                />
              </div>
            </div>
          </div>

          {/* Feedbacks Grid */}
          {filteredFeedbacks.length === 0 ? (
            <div className="bg-white border-3 border-dashed border-black/30 rounded-3xl p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#FFF9F2] border-2 border-black/30 flex items-center justify-center mx-auto text-neutral-400">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="font-black text-lg text-neutral-700">No Feedback Matches</h3>
              <p className="text-xs text-neutral-500 font-bold max-w-sm mx-auto">
                When customers at tables submit reviews or complaints via the "Feedback & Reviews" button, they will appear here instantly in real-time.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredFeedbacks.map((fb) => (
                <div
                  key={fb.id}
                  className={`bg-white border-3 border-black rounded-2xl p-4 space-y-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition ${
                    fb.type === 'complaint' && fb.status !== 'resolved'
                      ? 'border-[#FF5A5F] ring-2 ring-[#FF5A5F]/20'
                      : ''
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-lg bg-[#1A1A1A] text-white font-black text-xs">
                          {fb.table}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${
                            fb.type === 'complaint'
                              ? 'bg-[#FF5A5F] text-white'
                              : fb.type === 'review'
                              ? 'bg-[#06D6A0] text-black'
                              : 'bg-[#118AB2] text-white'
                          }`}
                        >
                          {fb.type}
                        </span>

                        <span
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${
                            fb.status === 'resolved'
                              ? 'bg-neutral-100 text-neutral-600 border border-black/20'
                              : fb.status === 'investigating'
                              ? 'bg-[#FFD166] text-black'
                              : 'bg-red-100 text-red-700 font-black'
                          }`}
                        >
                          {fb.status}
                        </span>
                      </div>
                      {fb.customerName && (
                        <p className="text-xs text-neutral-500 font-bold mt-1">
                          By: <strong className="text-black">{fb.customerName}</strong>
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      {fb.rating && (
                        <div className="flex items-center gap-0.5 justify-end">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${
                                s <= fb.rating!
                                  ? 'fill-[#FFD166] text-black'
                                  : 'text-neutral-200'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                      <span className="text-[10px] text-neutral-400 font-bold block mt-0.5">
                        {new Date(fb.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Comment Body */}
                  <p className="text-xs text-[#1A1A1A] font-bold leading-relaxed bg-[#FFF9F2] p-2.5 rounded-xl border border-black/10">
                    "{fb.comment}"
                  </p>

                  {/* Resolution Notes if any */}
                  {fb.resolutionNotes && (
                    <div className="bg-[#E8F8F5] border border-[#06D6A0] p-2 rounded-xl text-[11px] font-bold text-neutral-700">
                      <span className="text-[#06D6A0] font-black block">Staff Resolution Note:</span>
                      {fb.resolutionNotes}
                    </div>
                  )}

                  {/* Quick Action Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-black/10 text-xs">
                    <div className="flex items-center gap-2">
                      {fb.googleReviewRedirected && (
                        <span className="text-[10px] text-[#4285F4] font-black flex items-center gap-1">
                          <ExternalLink className="w-3 h-3" />
                          Shared to Google Review
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        setSelectedFeedback(fb);
                        setResolutionNotes(fb.resolutionNotes || '');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-[#FFD166] hover:bg-[#ffc847] text-[#1A1A1A] text-xs font-black border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition cursor-pointer"
                    >
                      {fb.status === 'resolved' ? 'Edit Resolution' : 'Take Action'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: FLOOR & TABLE MONITOR */}
      {activeTab === 'tables' && (
        <div className="space-y-6">
          <div className="bg-white border-4 border-black rounded-3xl p-6 sm:p-8 space-y-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-black italic text-[#1A1A1A]">
                  LIVE FLOOR & TABLE MONITOR
                </h3>
                <p className="text-xs text-neutral-600 font-bold mt-1">
                  Real-time status across all dining tables. Quickly spot tables with open complaints or recent reviews.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('qrs')}
                className="py-2 px-3.5 rounded-xl bg-[#FFD166] text-[#1A1A1A] font-black text-xs border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
              >
                <QrCode className="w-4 h-4" />
                <span>Manage Table QRs</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-2">
              {tables.map((t) => {
                const tableFeedbacks = feedbacks.filter(
                  (f) => f.table.toLowerCase().trim() === t.toLowerCase().trim()
                );
                const unresolvedComplaint = tableFeedbacks.find(
                  (f) => f.type === 'complaint' && f.status !== 'resolved'
                );
                const tableReviews = tableFeedbacks.filter((f) => f.type === 'review');
                const latestReview = tableReviews[0];
                const cleanParam = t.replace(/^Table\s*#?/i, '').trim();
                const guestUrl = `${window.location.origin}${window.location.pathname}?restaurant=${encodeURIComponent(restaurant.id)}&table=${encodeURIComponent(cleanParam)}`;

                return (
                  <div
                    key={t}
                    className={`bg-[#FFF9F2] border-3 border-black rounded-2xl p-4 space-y-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between transition ${
                      unresolvedComplaint ? 'ring-3 ring-[#FF5A5F] bg-red-50/60' : ''
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-black text-base text-[#1A1A1A]">{t}</span>
                        {unresolvedComplaint ? (
                          <span className="px-2 py-0.5 rounded-md bg-[#FF5A5F] text-white text-[10px] font-black uppercase animate-pulse flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            <span>Complaint</span>
                          </span>
                        ) : tableReviews.length > 0 ? (
                          <span className="px-2 py-0.5 rounded-md bg-[#06D6A0] text-black text-[10px] font-black uppercase">
                            Reviewed
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-neutral-200 text-neutral-700 text-[10px] font-black uppercase">
                            Ready
                          </span>
                        )}
                      </div>

                      <div className="mt-2 text-xs text-neutral-600 font-bold space-y-1">
                        <p className="flex items-center justify-between">
                          <span>Total Feedbacks:</span>
                          <strong className="text-black">{tableFeedbacks.length}</strong>
                        </p>
                        {latestReview && (
                          <p className="flex items-center justify-between">
                            <span>Latest Rating:</span>
                            <span className="font-black text-[#1A1A1A] flex items-center gap-0.5">
                              {latestReview.rating}★
                            </span>
                          </p>
                        )}
                      </div>

                      {unresolvedComplaint && (
                        <div className="mt-2.5 p-2 rounded-xl bg-white border border-[#FF5A5F] text-[11px] text-[#1A1A1A] font-bold">
                          <p className="text-[#FF5A5F] font-black text-[10px] uppercase">Pending Issue:</p>
                          <p className="line-clamp-2 mt-0.5">"{unresolvedComplaint.comment}"</p>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-black/10 flex items-center justify-between gap-1.5">
                      <a
                        href={guestUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-1.5 px-2 rounded-lg bg-white hover:bg-neutral-100 text-[#1A1A1A] text-[11px] font-black border border-black text-center flex items-center justify-center gap-1 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5"
                        title="Open guest view for this table"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => {
                          setSearchTable(t);
                          setActiveTab('feedbacks');
                        }}
                        className="py-1.5 px-2 rounded-lg bg-[#FFD166] hover:bg-[#ffc847] text-[#1A1A1A] text-[11px] font-black border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5"
                        title="View history for this table"
                      >
                        History
                      </button>

                      <button
                        type="button"
                        onClick={() => printSingleTable(t)}
                        className="py-1.5 px-2 rounded-lg bg-white hover:bg-neutral-100 text-[#1A1A1A] text-[11px] font-black border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5"
                        title="Print Stand"
                      >
                        <Printer className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RESTAURANT & GOOGLE REVIEW SETTINGS */}
      {activeTab === 'settings' && (
        <div className="bg-white border-4 border-black rounded-3xl p-6 sm:p-8 space-y-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <div>
            <h3 className="text-xl font-black italic text-[#1A1A1A]">
              RESTAURANT & GOOGLE REVIEWS SETUP
            </h3>
            <p className="text-xs text-neutral-600 font-bold mt-1">
              Configure your Google Review URL so customers leaving high star ratings can paste their reviews directly onto your Google Business profile.
            </p>
          </div>

          {saveSuccessMessage && (
            <div className="bg-[#06D6A0]/15 border-2 border-[#06D6A0] rounded-2xl p-3 flex items-center gap-2 text-xs font-black text-[#1A1A1A]">
              <CheckCircle2 className="w-4 h-4 text-[#06D6A0] shrink-0" />
              <span>{saveSuccessMessage}</span>
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-5">
            {/* Restaurant Display Name */}
            <div>
              <label className="block text-xs font-black text-[#1A1A1A] mb-1">
                Restaurant Public Name *
              </label>
              <input
                type="text"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                required
                className="w-full bg-[#FFF9F2] border-3 border-black rounded-xl px-3.5 py-2 text-xs font-black text-[#1A1A1A] outline-none focus:border-[#FF5A5F] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              />
            </div>

            {/* Google Review URL */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-black text-[#1A1A1A] flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-[#4285F4] fill-[#4285F4]" />
                  <span>Google Review Link / Place URL *</span>
                </label>
                <a
                  href={googleReviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#4285F4] font-black hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Test Link</span>
                </a>
              </div>
              <input
                type="url"
                value={googleReviewUrl}
                onChange={(e) => setGoogleReviewUrl(e.target.value)}
                required
                placeholder="https://search.google.com/local/writereview?placeid=..."
                className="w-full bg-[#FFF9F2] border-3 border-black rounded-xl px-3.5 py-2 text-xs font-bold text-[#1A1A1A] outline-none focus:border-[#FF5A5F] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-mono"
              />

              {/* How-to helper */}
              <div className="mt-2.5 bg-[#F0F7FF] border-2 border-[#4285F4] rounded-xl p-3 text-xs text-neutral-700 font-bold space-y-1.5">
                <div className="flex items-center gap-1.5 text-[#4285F4] font-black">
                  <HelpCircle className="w-4 h-4" />
                  <span>How to find your restaurant's direct Google Review link:</span>
                </div>
                <ol className="list-decimal list-inside text-[11px] space-y-1 text-neutral-600 pl-1">
                  <li>Go to Google Search and search your restaurant name.</li>
                  <li>Click <strong>"Ask for reviews"</strong> or <strong>"Promote" &gt; "Ask for reviews"</strong> on your Google Business Profile.</li>
                  <li>Copy the direct short link (looks like <code className="bg-white px-1 py-0.5 rounded border border-black/20">https://g.page/r/.../review</code> or <code className="bg-white px-1 py-0.5 rounded border border-black/20">https://search.google.com/local/writereview?placeid=...</code>).</li>
                  <li>Paste it above!</li>
                </ol>
              </div>
            </div>

            {/* Admin PIN */}
            <div>
              <label className="block text-xs font-black text-[#1A1A1A] mb-1">
                Manager Admin Passcode / PIN (for accessing this portal)
              </label>
              <input
                type="text"
                value={adminPin}
                onChange={(e) => setAdminPin(e.target.value)}
                maxLength={8}
                className="w-44 bg-[#FFF9F2] border-3 border-black rounded-xl px-3.5 py-2 text-xs font-black text-[#1A1A1A] outline-none focus:border-[#FF5A5F] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              />
              <p className="text-[11px] text-neutral-500 font-bold mt-1">
                Enter a 4 to 8 character numeric code (Default is 1234).
              </p>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSavingSettings}
                className="py-3 px-6 rounded-xl bg-[#06D6A0] hover:bg-[#05be8d] disabled:opacity-50 text-[#1A1A1A] font-black text-xs border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition cursor-pointer flex items-center gap-2 active:translate-y-0.5"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingSettings ? 'Saving...' : 'Save & Sync Settings'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: APP QUESTIONS CONTROL */}
      {activeTab === 'questions' && (
        <div className="space-y-4">
          <div className="bg-[#FFF9F2] border-3 border-black rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <div>
              <h3 className="font-black text-sm text-[#1A1A1A]">
                Custom Game Database & Questions
              </h3>
              <p className="text-xs text-neutral-600 font-bold">
                Add, edit, or remove questions for Heads Up, Imposter, Spin Wheel, and table lists.
              </p>
            </div>
            <button
              onClick={async () => {
                try {
                  await saveRestaurantGameQuestions(restaurant.id, gameDb);
                  alert('Game questions successfully synchronized with all dining tables!');
                } catch (err) {
                  console.error('Failed to sync questions:', err);
                }
              }}
              className="py-2 px-4 rounded-xl bg-[#06D6A0] hover:bg-[#05be8d] text-[#1A1A1A] font-black text-xs border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1.5 transition cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Push Questions to All Tables</span>
            </button>
          </div>

          <ContentManager
            db={gameDb}
            setDb={handleUpdateGameDb as any}
            onOpenQRForTable={(t) => {
              setSelectedQrTable(t);
              setActiveTab('qrs');
            }}
          />
        </div>
      )}

      {/* TAB 4: TABLE QR STATION */}
      {activeTab === 'qrs' && (
        <div className="bg-white border-4 border-black rounded-3xl p-6 sm:p-8 space-y-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-black italic text-[#1A1A1A]">
                SMART RESTAURANT QR STANDS (AUTO-LOGIN)
              </h3>
              <p className="text-xs text-neutral-600 font-bold mt-1">
                Customers scan these codes with their phone camera and are automatically connected to their table at <strong>{restaurant.name}</strong> without any login required!
              </p>
            </div>

            <button
              onClick={printAllTables}
              className="py-2.5 px-4 rounded-xl bg-[#06D6A0] hover:bg-[#05be8d] text-[#1A1A1A] font-black text-xs border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 transition cursor-pointer self-start sm:self-auto"
            >
              <Printer className="w-4 h-4" />
              <span>Print All Table Stands</span>
            </button>
          </div>

          {/* Table Selector & Preview Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Table list */}
            <div className="space-y-2 lg:col-span-1 max-h-96 overflow-y-auto pr-1">
              <span className="text-xs font-black uppercase text-neutral-500">Select Table to Preview:</span>
              {tables.map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedQrTable(t)}
                  className={`w-full text-left p-3 rounded-xl text-xs font-black border-2 border-black flex items-center justify-between transition cursor-pointer ${
                    selectedQrTable === t
                      ? 'bg-[#FFD166] text-[#1A1A1A] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                      : 'bg-white hover:bg-neutral-50 text-neutral-700'
                  }`}
                >
                  <span>{t}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ))}
            </div>

            {/* Stand Card Preview */}
            <div className="lg:col-span-2 flex flex-col items-center justify-center p-6 bg-[#FFF9F2] border-3 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="bg-white border-3 border-black rounded-2xl p-6 text-center max-w-xs w-full shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-3">
                <span className="px-3 py-1 rounded-full bg-[#FFD166] text-[#1A1A1A] border-2 border-black text-[11px] font-black inline-block">
                  {restaurant.name}
                </span>
                <h4 className="text-2xl font-black text-[#1A1A1A] italic">{selectedQrTable}</h4>
                <p className="text-[11px] text-[#FF5A5F] font-black uppercase tracking-wider">
                  Scan to Play & Review
                </p>

                {qrMap[selectedQrTable] ? (
                  <div className="p-3 bg-[#FFF9F2] border-2 border-black rounded-xl inline-block shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <img
                      src={qrMap[selectedQrTable]}
                      alt={`${selectedQrTable} QR`}
                      className="w-48 h-48 mx-auto"
                    />
                  </div>
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center border-2 border-dashed border-black/30 rounded-xl mx-auto">
                    <span className="text-xs text-neutral-400 font-bold">Generating QR...</span>
                  </div>
                )}

                <p className="text-[10px] text-neutral-600 font-bold">
                  No login required for guests! Automatically connects table to your reviews & complaints inbox.
                </p>

                <button
                  onClick={() => printSingleTable(selectedQrTable)}
                  className="w-full py-2.5 rounded-xl bg-[#FF5A5F] hover:bg-[#e0484d] text-white font-black text-xs border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-1.5 cursor-pointer transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Stand for {selectedQrTable}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RESOLUTION ACTION DRAWER / MODAL */}
      {selectedFeedback && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border-4 border-black rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-xl bg-[#1A1A1A] text-white text-xs font-black">
                  {selectedFeedback.table}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                    selectedFeedback.type === 'complaint'
                      ? 'bg-[#FF5A5F] text-white'
                      : 'bg-[#06D6A0] text-black'
                  }`}
                >
                  {selectedFeedback.type}
                </span>
              </div>
              <button
                onClick={() => setSelectedFeedback(null)}
                className="text-xs font-black text-neutral-500 hover:text-black"
              >
                Close ✕
              </button>
            </div>

            <p className="text-xs text-[#1A1A1A] font-bold p-3 bg-[#FFF9F2] rounded-xl border-2 border-black leading-relaxed">
              "{selectedFeedback.comment}"
            </p>

            <div>
              <label className="block text-xs font-black text-[#1A1A1A] mb-1">
                Resolution Notes (Internal staff record):
              </label>
              <textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                rows={2}
                placeholder="e.g. Spoke to guest at Table 4, replaced cocktail with complimentary dessert."
                className="w-full bg-[#FFF9F2] border-2 border-black rounded-xl p-2.5 text-xs font-bold text-[#1A1A1A] outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => handleUpdateStatus('investigating')}
                disabled={isUpdatingStatus}
                className="py-2 rounded-xl bg-[#FFD166] text-black font-black text-xs border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition cursor-pointer"
              >
                Mark In-Progress
              </button>

              <button
                onClick={() => handleUpdateStatus('resolved')}
                disabled={isUpdatingStatus}
                className="py-2 rounded-xl bg-[#06D6A0] text-black font-black text-xs border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition cursor-pointer flex items-center justify-center gap-1"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Mark Resolved</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
