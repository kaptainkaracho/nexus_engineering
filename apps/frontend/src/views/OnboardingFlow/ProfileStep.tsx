import { useState, useRef } from 'react';
import { Input, Button, RadioGroup, type RadioOption } from '@nexus-engineering/shared';
import { Users, Code2, ClipboardList, Server, MoreHorizontal, Upload, User } from 'lucide-react';

interface ProfileData {
  displayName: string;
  role: string;
  avatarUrl?: string;
}

interface ProfileStepProps {
  initial: ProfileData;
  onSave: (data: ProfileData) => void;
  onBack: () => void;
}

const roleOptions: RadioOption<string>[] = [
  { value: 'engineering-manager', label: 'Engineering Manager', description: 'I manage engineering teams', icon: <Users className="w-5 h-5 text-primary-500" /> },
  { value: 'developer', label: 'Developer', description: 'I write code day-to-day', icon: <Code2 className="w-5 h-5 text-primary-500" /> },
  { value: 'product-manager', label: 'Product Manager', description: 'I define product requirements', icon: <ClipboardList className="w-5 h-5 text-primary-500" /> },
  { value: 'devops', label: 'DevOps / Platform', description: 'I manage infrastructure', icon: <Server className="w-5 h-5 text-primary-500" /> },
  { value: 'other', label: 'Other', description: 'Something else', icon: <MoreHorizontal className="w-5 h-5 text-primary-500" /> },
];

export function ProfileStep({ initial, onSave, onBack }: ProfileStepProps) {
  const [displayName, setDisplayName] = useState(initial.displayName);
  const [role, setRole] = useState(initial.role);
  const [nameError, setNameError] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(initial.avatarUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleNext = () => {
    if (!displayName.trim() || displayName.trim().length < 2) {
      setNameError('Display name must be at least 2 characters');
      return;
    }
    setNameError('');
    onSave({ displayName: displayName.trim(), role, avatarUrl: avatarPreview });
  };

  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div role="group" aria-label="Step 2: Profile Setup">
      <h2 className="text-2xl font-semibold text-text-primary mb-1">Set up your profile</h2>
      <p className="text-sm text-text-secondary mb-6">Tell us about yourself</p>

      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-lg font-bold text-primary-600 overflow-hidden flex-shrink-0">
          {avatarPreview ? (
            <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
          ) : (
            <span>{initials || <User className="w-8 h-8" />}</span>
          )}
        </div>
        <div>
          <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-4 h-4" />
            Upload photo
          </Button>
          <p className="text-xs text-text-tertiary mt-1">PNG or JPG, max 2MB</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg"
          className="hidden"
          onChange={handleAvatarChange}
        />
      </div>

      <div className="mb-6">
        <Input
          label="Display name"
          placeholder="Jane Smith"
          value={displayName}
          onChange={(e) => { setDisplayName(e.target.value); setNameError(''); }}
          error={nameError}
          fullWidth
          autoFocus
        />
      </div>

      <div className="mb-6">
        <RadioGroup
          name="role"
          label="What best describes you?"
          options={roleOptions}
          value={role}
          onChange={setRole}
        />
      </div>

      <div className="flex items-center justify-between">
        <Button variant="secondary" size="lg" onClick={onBack} aria-label="Go to previous step">
          ← Back
        </Button>
        <Button variant="primary" size="lg" onClick={handleNext} aria-label="Go to next step">
          Next →
        </Button>
      </div>
    </div>
  );
}
