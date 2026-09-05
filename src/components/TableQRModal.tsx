import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  QrCode,
  Printer,
  X,
  UtensilsCrossed,
  Sparkles,
  Check,
  Plus,
  Trash2,
  ListFilter,
  RotateCcw,
  Layers
} from 'lucide-react';
import { sounds } from '../utils/sound';
import { DEFAULT_TABLES } from '../utils/storage';

interface TableQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTable: string;
  onSelectTable: (table: string) => void;
  tables: string[];
  setTables: (tables: string[]) => void;
}

export const TableQRModal: React.FC<TableQRModalProps> = ({
  isOpen,
  onClose,
  currentTable,
  onSelectTable,
  tables,
  setTables,
}) => {
  const [modalTab, setModalTab] = useState<'single' | 'manage' | 'batch'>('single');
  const [selectedTable, setSelectedTable] = useState<string>(currentTable || 'Table 4');
  const [newTableName, setNewTableName] = useState<string>('');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [batchQrUrls, setBatchQrUrls] = useState<{ [table: string]: string }>({});
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://bites-and-games.app';
  const targetUrl = `${baseUrl}/?table=${encodeURIComponent(selectedTable.replace(/^Table\s*#?/i, ''))}`;

  // Keep selectedTable in sync when currentTable changes
  useEffect(() => {
    if (currentTable) {
      setSelectedTable(currentTable);
    }
  }, [currentTable]);

  // Generate QR for single table
  useEffect(() => {
    if (!isOpen) return;

    QRCode.toDataURL(
      targetUrl,
      {
        width: 320,
        margin: 2,
        color: {
          dark: '#1A1A1A',
          light: '#FFFFFF',
        },
      },
      (err, url) => {
        if (!err && url) {
          setQrDataUrl(url);
        }
      }
    );
  }, [isOpen, selectedTable, targetUrl]);

  // Generate batch QR codes for all tables if in batch tab
  useEffect(() => {
    if (!isOpen || modalTab !== 'batch') return;

    const urls: { [table: string]: string } = {};
    let pending = tables.length;

    tables.forEach((t) => {
      const cleanParam = t.replace(/^Table\s*#?/i, '');
      const tUrl = `${baseUrl}/?table=${encodeURIComponent(cleanParam)}`;
      QRCode.toDataURL(
        tUrl,
        {
          width: 240,
          margin: 1,
          color: {
            dark: '#1A1A1A',
            light: '#FFFFFF',
          },
        },
        (err, url) => {
          if (!err && url) {
            urls[t] = url;
          }
          pending--;
          if (pending === 0) {
            setBatchQrUrls({ ...urls });
          }
        }
      );
    });
  }, [isOpen, modalTab, tables, baseUrl]);

  if (!isOpen) return null;

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  };

  // Add new custom table
  const handleAddTable = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTableName.trim();
    if (!trimmed) return;

    // Format with "Table " if just a number
    const formatted = /^\d+$/.test(trimmed) ? `Table ${trimmed}` : trimmed;

    if (tables.some((t) => t.toLowerCase() === formatted.toLowerCase())) {
      showFeedback(`"${formatted}" is already in your tables list!`);
      return;
    }

    const updated = [...tables, formatted];
    setTables(updated);
    setNewTableName('');
    setSelectedTable(formatted);
    onSelectTable(formatted);
    sounds.playScoreDing();
    showFeedback(`Added "${formatted}" successfully!`);
  };

  // Quick helper to add the next numerical table
  const handleAddNextTable = () => {
    let maxNum = 0;
    tables.forEach((t) => {
      const match = t.match(/Table\s*#?\s*(\d+)/i);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > maxNum) maxNum = n;
      }
    });
    const nextName = `Table ${maxNum + 1}`;
    const updated = [...tables, nextName];
    setTables(updated);
    setSelectedTable(nextName);
    onSelectTable(nextName);
    sounds.playScoreDing();
    showFeedback(`Added "${nextName}"!`);
  };

  // Remove table
  const handleRemoveTable = (tableToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tables.length <= 1) {
      showFeedback('You must keep at least 1 table.');
      return;
    }

    const updated = tables.filter((t) => t !== tableToRemove);
    setTables(updated);
    sounds.playBuzzer();

    // If removed table was selected, switch to first available table
    if (selectedTable === tableToRemove) {
      const fallback = updated[0] || 'Table 1';
      setSelectedTable(fallback);
      onSelectTable(fallback);
    }
    showFeedback(`Removed "${tableToRemove}".`);
  };

  // Reset to default restaurant tables
  const handleResetTables = () => {
    setTables(DEFAULT_TABLES);
    setSelectedTable(DEFAULT_TABLES[0]);
    onSelectTable(DEFAULT_TABLES[0]);
    sounds.playDiceRoll();
    showFeedback('Reset to default tables list.');
  };

  const handlePrint = () => {
    sounds.playDiceRoll();
    window.print();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    sounds.playScoreDing();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto overscroll-contain">
      <div className="bg-white border-4 border-black rounded-3xl p-5 sm:p-8 max-w-2xl w-full space-y-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] sm:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative animate-in zoom-in-95 my-4 sm:my-8 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 border-2 border-black transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFD166] text-[#1A1A1A] border-2 border-black text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <QrCode className="w-3.5 h-3.5 text-[#FF5A5F]" /> RESTAURANT TABLE SYSTEM
          </div>
          <h3 className="text-2xl sm:text-3xl font-black italic text-[#1A1A1A] tracking-tight">
            TABLES & QR STANDS
          </h3>
          <p className="text-xs font-bold text-neutral-600">
            Add or remove restaurant tables, generate QR codes, and print tabletop game stands.
          </p>
        </div>

        {/* Navigation Tabs inside Modal */}
        <div className="flex items-center gap-2 border-b-2 border-black pb-2">
          <button
            onClick={() => setModalTab('single')}
            className={`px-4 py-2 rounded-xl border-2 border-black text-xs font-black transition cursor-pointer ${
              modalTab === 'single'
                ? 'bg-[#FF5A5F] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5'
                : 'bg-white text-[#1A1A1A] hover:bg-neutral-100'
            }`}
          >
            QR STAND PREVIEW
          </button>
          <button
            onClick={() => setModalTab('manage')}
            className={`px-4 py-2 rounded-xl border-2 border-black text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
              modalTab === 'manage'
                ? 'bg-[#06D6A0] text-[#1A1A1A] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5'
                : 'bg-white text-[#1A1A1A] hover:bg-neutral-100'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>MANAGE TABLES ({tables.length})</span>
          </button>
          <button
            onClick={() => setModalTab('batch')}
            className={`px-4 py-2 rounded-xl border-2 border-black text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
              modalTab === 'batch'
                ? 'bg-[#118AB2] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5'
                : 'bg-white text-[#1A1A1A] hover:bg-neutral-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>PRINT ALL STANDS</span>
          </button>
        </div>

        {/* Notification Banner */}
        {feedback && (
          <div className="p-3 rounded-xl bg-amber-100 border-2 border-black text-[#1A1A1A] text-xs font-black flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {/* TAB 1: SINGLE TABLE PREVIEW & PRINT */}
        {modalTab === 'single' && (
          <div className="space-y-6">
            {/* Table Quick Switcher Pills */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-black">
                <span className="uppercase text-[#FF5A5F] tracking-wider">
                  SELECT ACTIVE TABLE:
                </span>
                <button
                  onClick={() => setModalTab('manage')}
                  className="text-neutral-500 hover:text-black underline cursor-pointer"
                >
                  + Add / Remove Tables
                </button>
              </div>

              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-[#FFF9F2] rounded-2xl border-2 border-black">
                {tables.map((t) => {
                  const isSel = selectedTable === t;
                  return (
                    <button
                      key={t}
                      onClick={() => {
                        setSelectedTable(t);
                        onSelectTable(t);
                        sounds.playWheelClick();
                      }}
                      className={`px-3 py-1.5 rounded-xl border-2 border-black text-xs font-black transition cursor-pointer ${
                        isSel
                          ? 'bg-[#FFD166] text-[#1A1A1A] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] scale-105'
                          : 'bg-white text-[#1A1A1A] hover:bg-neutral-100'
                      }`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Printable Card Preview */}
            <div
              id="printable-table-card"
              className="bg-[#FFF9F2] border-4 border-black rounded-3xl p-6 text-center space-y-4 shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] flex flex-col items-center"
            >
              {/* Card Brand Header */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#FF5A5F] flex items-center justify-center border-2 border-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <UtensilsCrossed className="w-4 h-4" />
                </div>
                <span className="font-black text-lg tracking-tight text-[#1A1A1A]">BITES & GAMES</span>
              </div>

              <div className="space-y-1">
                <h4 className="text-xl sm:text-2xl font-black italic text-[#1A1A1A]">
                  SCAN TO PLAY WHILE YOU WAIT!
                </h4>
                <p className="text-xs font-bold text-neutral-600">
                  Instant in browser • No app download or login needed
                </p>
              </div>

              {/* QR Code */}
              <div className="p-3 bg-white border-4 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`${selectedTable} QR Code`}
                    className="w-44 h-44 sm:w-52 sm:h-52 block mx-auto"
                  />
                ) : (
                  <div className="w-44 h-44 flex items-center justify-center font-bold text-xs">
                    Generating QR...
                  </div>
                )}
              </div>

              {/* Table Badge on Card */}
              <div className="bg-[#FFD166] text-[#1A1A1A] font-black px-6 py-2 rounded-full border-3 border-black text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] uppercase tracking-wider">
                {selectedTable}
              </div>

              <p className="text-[11px] font-mono font-bold text-neutral-500 break-all max-w-sm">
                {targetUrl}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleCopyLink}
                className="w-full py-3.5 rounded-2xl bg-white hover:bg-neutral-50 text-[#1A1A1A] font-black text-xs border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition cursor-pointer flex items-center justify-center gap-2"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Sparkles className="w-4 h-4 text-[#FF5A5F]" />}
                <span>{copied ? 'LINK COPIED!' : 'COPY TABLE LINK'}</span>
              </button>

              <button
                onClick={handlePrint}
                className="w-full py-3.5 rounded-2xl bg-[#06D6A0] hover:bg-[#05be8d] text-[#1A1A1A] font-black text-xs border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>PRINT THIS STAND</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: MANAGE TABLES (ADD / REMOVE) */}
        {modalTab === 'manage' && (
          <div className="space-y-6">
            {/* Add Table Form */}
            <div className="bg-[#FFF9F2] p-5 rounded-3xl border-3 border-black space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-[#FF5A5F] tracking-wider">
                  + ADD A NEW TABLE
                </span>
                <button
                  type="button"
                  onClick={handleAddNextTable}
                  className="text-xs font-black text-[#118AB2] hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Auto-Add Next Number</span>
                </button>
              </div>

              <form onSubmit={handleAddTable} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  placeholder="e.g. Table 9, Patio 3, Booth A, Bar 2"
                  className="flex-1 bg-white px-4 py-3 rounded-2xl border-2 border-black font-black text-sm outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                />
                <button
                  type="submit"
                  disabled={!newTableName.trim()}
                  className="px-6 py-3 rounded-2xl bg-[#06D6A0] hover:bg-[#05be8d] disabled:opacity-40 text-[#1A1A1A] font-black text-xs border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>ADD TABLE</span>
                </button>
              </form>
            </div>

            {/* Current Tables List with Remove buttons */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-black">
                <span className="uppercase text-neutral-600">
                  REGISTERED RESTAURANT TABLES ({tables.length})
                </span>
                <button
                  onClick={handleResetTables}
                  className="text-neutral-500 hover:text-black flex items-center gap-1 cursor-pointer"
                  title="Reset to default table list"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Defaults</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto p-1">
                {tables.map((tbl) => {
                  const isCurrent = selectedTable === tbl;
                  return (
                    <div
                      key={tbl}
                      onClick={() => {
                        setSelectedTable(tbl);
                        onSelectTable(tbl);
                        setModalTab('single');
                        sounds.playWheelClick();
                      }}
                      className={`flex items-center justify-between p-3 rounded-2xl border-2 border-black transition cursor-pointer ${
                        isCurrent
                          ? 'bg-[#FFD166] text-[#1A1A1A] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                          : 'bg-white text-[#1A1A1A] hover:bg-neutral-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <QrCode className="w-4 h-4 text-neutral-500 shrink-0" />
                        <span className="font-black text-sm truncate">{tbl}</span>
                        {isCurrent && (
                          <span className="text-[10px] bg-black text-white px-2 py-0.5 rounded-full font-black">
                            ACTIVE
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => handleRemoveTable(tbl, e)}
                          className="p-1.5 rounded-xl hover:bg-red-100 text-red-600 border border-transparent hover:border-black transition cursor-pointer"
                          title={`Remove ${tbl}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <p className="text-[11px] text-neutral-500 font-bold">
                Tip: Click any table above to view its QR stand or switch to it.
              </p>
              <button
                onClick={() => setModalTab('single')}
                className="px-5 py-2.5 rounded-2xl bg-[#FF5A5F] text-white font-black text-xs border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
              >
                Back to QR Preview
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: BATCH PRINT ALL STANDS */}
        {modalTab === 'batch' && (
          <div className="space-y-6">
            <div className="bg-[#FFF9F2] p-4 rounded-2xl border-2 border-black flex items-center justify-between">
              <div>
                <h4 className="font-black text-sm text-[#1A1A1A]">PRINT ALL TABLE STANDS</h4>
                <p className="text-xs font-bold text-neutral-600">
                  Ready to print QR cards for all {tables.length} tables at once.
                </p>
              </div>
              <button
                onClick={handlePrint}
                className="px-5 py-3 rounded-2xl bg-[#06D6A0] hover:bg-[#05be8d] text-[#1A1A1A] font-black text-xs border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>PRINT ALL NOW</span>
              </button>
            </div>

            {/* Grid of Mini Cards for all tables */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-96 overflow-y-auto p-2 border-2 border-black/10 rounded-2xl">
              {tables.map((t) => {
                const qr = batchQrUrls[t];
                return (
                  <div
                    key={t}
                    className="bg-[#FFF9F2] border-3 border-black rounded-2xl p-3 text-center space-y-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <span className="font-black text-xs text-[#1A1A1A] block truncate">{t}</span>
                    <div className="bg-white p-2 rounded-xl border-2 border-black">
                      {qr ? (
                        <img src={qr} alt={t} className="w-24 h-24 mx-auto block" />
                      ) : (
                        <div className="w-24 h-24 flex items-center justify-center text-[10px] font-bold">
                          ...
                        </div>
                      )}
                    </div>
                    <span className="text-[9px] font-bold text-neutral-500 uppercase block">
                      Scan to Play
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
