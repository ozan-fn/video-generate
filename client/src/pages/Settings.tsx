import MainLayout from '../components/layout/MainLayout';
import { Button } from '../components/ui/button';
import { Bell, Lock, User, Palette } from 'lucide-react';

const Settings = () => {
  return (
    <MainLayout>
      <div className="p-6 md:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account and application preferences.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Profile Settings */}
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <User className="h-5 w-5" />
              <h2 className="text-xl font-semibold">Profile</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Update your personal information and profile details.
            </p>
            <Button variant="outline">Edit Profile</Button>
          </div>

          {/* Security Settings */}
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <Lock className="h-5 w-5" />
              <h2 className="text-xl font-semibold">Security</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Manage your password and security preferences.
            </p>
            <Button variant="outline">Change Password</Button>
          </div>

          {/* Notifications */}
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <Bell className="h-5 w-5" />
              <h2 className="text-xl font-semibold">Notifications</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Control how you receive notifications and updates.
            </p>
            <Button variant="outline">Notification Settings</Button>
          </div>

          {/* Appearance */}
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <Palette className="h-5 w-5" />
              <h2 className="text-xl font-semibold">Appearance</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Customize the look and feel of your application.
            </p>
            <Button variant="outline">Theme Settings</Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Settings;
