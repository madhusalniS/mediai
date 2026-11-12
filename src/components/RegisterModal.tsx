import React, { useState, useEffect } from 'react';
import {
  X,
  Upload,
  UserCheck,
  Camera,
  CheckCircle,
  AlertCircle,
  Trash2,
  Cpu,
  Shield,
  FileCheck,
} from 'lucide-react';
import { RegisteredPerson, Role } from '../types';
import { extractFaceDescriptorFromImage } from '../services/faceApi';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPersonRegistered: (person: RegisteredPerson) => void;
  initialThumbnail?: string;
  theme: 'dark' | 'light';
}

const ROLES: Role[] = [
  'Doctor',
  'Nurse',
  'Staff',
  'Approved Visitor',
  'Patient Attendant',
];

export const RegisterModal: React.FC<RegisterModalProps> = ({
  isOpen,
  onClose,
  onPersonRegistered,
  initialThumbnail,
  theme,
}) => {
  const isDark = theme === 'dark';

  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('Staff');
  const [department, setDepartment] = useState('Emergency Care');
  const [cardId, setCardId] = useState('');
  const [notes, setNotes] = useState('');

  // 1-3 photos
  const [photos, setPhotos] = useState<string[]>([]);
  const [extractedDescriptors, setExtractedDescriptors] = useState<number[][]>([]);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [successFeedback, setSuccessFeedback] = useState<string | null>(null);

  // If initialThumbnail is passed (e.g. from an Unknown detection card), pre-load it!
  useEffect(() => {
    if (initialThumbnail && photos.length === 0) {
      setPhotos([initialThumbnail]);
      processPhotoDescriptor(initialThumbnail);
    }
  }, [initialThumbnail]);

  if (!isOpen) return null;

  async function processPhotoDescriptor(photoDataUrl: string) {
    setIsExtracting(true);
    setExtractError(null);
    try {
      const res = await extractFaceDescriptorFromImage(photoDataUrl);
      if (res && res.descriptor) {
        setExtractedDescriptors((prev) => [...prev, res.descriptor]);
        setSuccessFeedback('Facial embedding (128-D vector) extracted successfully!');
      } else {
        setExtractError('No distinct human face found in photo. Please ensure face is well-lit and front-facing.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error extracting facial descriptor';
      setExtractError(msg);
    } finally {
      setIsExtracting(false);
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (photos.length + files.length > 3) {
      setExtractError('Maximum of 3 facial photos allowed per individual.');
      return;
    }

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const dataUrl = event.target.result as string;
          setPhotos((prev) => [...prev, dataUrl]);
          processPhotoDescriptor(dataUrl);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setExtractedDescriptors((prev) => prev.filter((_, i) => i !== index));
    setSuccessFeedback(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setExtractError('Please enter the person’s full legal or staff name.');
      return;
    }

    if (photos.length === 0) {
      setExtractError('Please upload at least 1 clear facial photograph.');
      return;
    }

    if (extractedDescriptors.length === 0) {
      setExtractError('No valid face descriptors extracted yet. Please upload a clear photo.');
      return;
    }

    const newPerson: RegisteredPerson = {
      id: `rkh-${role.toLowerCase().replace(/\s+/g, '-')}-${Date.now().toString(36)}`,
      name: name.trim(),
      role,
      department: department.trim() || 'General Hospital Unit',
      cardId: cardId.trim() || `RKH-${Math.floor(100 + Math.random() * 900)}`,
      photos,
      descriptors: extractedDescriptors,
      registeredAt: new Date().toISOString(),
      notes: notes.trim(),
    };

    onPersonRegistered(newPerson);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div
        className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden my-8 transition-all ${
          isDark ? 'glass-panel-dark text-white' : 'glass-panel-light text-slate-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-display">
                Register Hospital Personnel or Visitor
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Generate 128-D local face descriptor stored securely in browser
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Photos Upload Section (1 to 3) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Facial Photos ({photos.length}/3 photos)
              </label>
              <span className="text-[11px] text-teal-400 font-mono">
                {extractedDescriptors.length} Descriptors Extracted
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {photos.map((photo, idx) => (
                <div
                  key={idx}
                  className="relative group rounded-xl overflow-hidden border border-slate-700 aspect-square bg-slate-900"
                >
                  <img
                    src={photo}
                    alt={`Face scan ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-slate-950/80 text-[10px] font-mono text-teal-300">
                    Photo #{idx + 1}
                  </div>
                  <button
                    type="button"
                    onClick={() => removePhoto(idx)}
                    className="absolute top-1 right-1 p-1 rounded-md bg-rose-600/90 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    title="Remove photo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {photos.length < 3 && (
                <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-700 hover:border-teal-400/60 bg-slate-900/40 hover:bg-slate-900/70 p-4 aspect-square cursor-pointer transition-all text-center">
                  <Upload className="w-6 h-6 text-teal-400 mb-1.5" />
                  <span className="text-xs font-semibold text-slate-300">
                    Upload Photo
                  </span>
                  <span className="text-[10px] text-slate-500 mt-0.5">
                    Clear front face
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Neural Extraction Status */}
            {isExtracting && (
              <div className="mt-2.5 flex items-center gap-2 text-xs text-teal-400 font-mono animate-pulse">
                <Cpu className="w-4 h-4 animate-spin" />
                <span>Computing neural face embeddings via face-api.js...</span>
              </div>
            )}

            {extractError && (
              <div className="mt-2.5 flex items-center gap-2 text-xs text-rose-400 bg-rose-950/40 p-2.5 rounded-lg border border-rose-800/40">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{extractError}</span>
              </div>
            )}

            {successFeedback && !extractError && (
              <div className="mt-2.5 flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/30 p-2 rounded-lg border border-emerald-800/40 font-mono">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{successFeedback}</span>
              </div>
            )}
          </div>

          {/* Form Fields: Name & Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Dr. Priya Sharma"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  isDark
                    ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500'
                    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Role &amp; Clearance Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  isDark
                    ? 'bg-slate-900 border-slate-700 text-white'
                    : 'bg-white border-slate-300 text-slate-900'
                }`}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Department & Card ID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Hospital Department / Ward
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Cardiology, ICU, Pediatrics"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  isDark
                    ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500'
                    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Hospital Badge / Attendant Pass ID
              </label>
              <input
                type="text"
                value={cardId}
                onChange={(e) => setCardId(e.target.value)}
                placeholder="e.g. RKH-DOC-408"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  isDark
                    ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500'
                    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                }`}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Access Notes &amp; Special Clearances (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Cleared for ICU night shifts, Attending patient in Room 204"
              className={`w-full px-3.5 py-2 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                isDark
                  ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500'
                  : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
              }`}
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Descriptor stored in browser localStorage</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isExtracting || photos.length === 0}
                className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer ${
                  isExtracting || photos.length === 0
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 hover:brightness-110 active:scale-95'
                }`}
              >
                <FileCheck className="w-4 h-4" />
                <span>Save Biometric Registration</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
