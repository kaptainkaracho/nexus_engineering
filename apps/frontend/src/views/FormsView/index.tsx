import { useState } from 'react';
import { Stack, Card, Input, Button } from '@nexus-engineering/shared';

export function FormsView() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (e.target.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.target.value)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError('');
    }
  };

  const handleSubmit = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
    }, 1500);
  };

  return (
    <Stack gap={12}>
      <Stack gap={4}>
        <h2 className="text-2xl font-bold text-text-primary">Form components</h2>
        <p className="text-text-secondary">
          Input with label, helper text, error state, icons, and ARIA
          attributes. Inline validation on blur.
        </p>
      </Stack>

      <Card padding="lg">
        <Stack gap={6}>
          <Stack gap={4}>
            <Input
              label="Full Name"
              placeholder="Enter your name"
              fullWidth
            />

            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={handleEmailChange}
              error={emailError}
              fullWidth
            />

            <Input
              label="Password"
              type="password"
              placeholder="Create a password"
              helperText="At least 8 characters"
              fullWidth
            />

            <Input
              label="Bio"
              placeholder="Tell us about yourself..."
              helperText="Brief description for your profile"
              fullWidth
            />

            <Input
              label="Team (disabled)"
              placeholder="You cannot edit this field"
              disabled
              fullWidth
            />
          </Stack>

          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              onClick={handleSubmit}
              loading={loading}
              disabled={submitted}
            >
              {submitted ? 'Saved' : 'Save Profile'}
            </Button>
            <Button variant="ghost">Cancel</Button>
          </div>
        </Stack>
      </Card>
    </Stack>
  );
}
