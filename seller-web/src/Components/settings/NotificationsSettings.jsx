import { useNotification } from '@/Hooks/useNotification';
import { Switch } from "@/Components/ui/switch"
import { Checkbox } from "@/Components/ui/checkbox"
import { useAuthContext } from "@/Hooks/useAuthContextV2"
import { useState, useEffect } from "react"
import { BASE_URL, BASE_URL_V2 } from "@/Constants/Server"
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card"

export default function NotificationsSettings() {
  const { token } = useAuthContext();
  const { showNotification } = useNotification();
  const [ setIsLoading ] = useState(false);
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    pushNotifications: true,
    notificationTypes: {
      orderUpdates: true,
      lowStock: true,
      newReviews: true,
      promotions: true,
    }
  });

  useEffect(() => {
    fetchNotificationPreferences();
  }, []);

  const fetchNotificationPreferences = async () => {
    try {
      const sellerToken = token?.data;
      const response = await fetch(`${BASE_URL_V2}/sellers/profile`, {
        headers: {
          Authorization: `Bearer ${sellerToken}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setPreferences(data.data.notificationPreferences || {});
      }
    } catch (error) {
      console.log('error fetching notification preferences', error);
      showNotification("Failed to fetch notification preferences", 'error', 'dismissible');
    }
  };

  const updatePreferences = async (updates) => {
    setIsLoading(true);
    try {
      const sellerToken = token?.data;
      const response = await fetch(`${BASE_URL}/seller/notification-preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sellerToken}`,
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        setPreferences(prev => ({ ...prev, ...updates }));
        showNotification("Notification preferences updated", 'information', 'dismissible');
      } else {
        throw new Error("Failed to update preferences");
      }
    } catch (error) {
      console.log('error updating notification preferences', error);
      showNotification("Error updating notification preferences", 'error', 'dismissible');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Customizable Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">CUSTOMIZABLE NOTIFICATIONS</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">Order Updates</span>
            <Checkbox 
              checked={preferences.notificationTypes?.orderUpdates}
              onCheckedChange={(checked) => {
                updatePreferences({
                  notificationTypes: {
                    ...preferences.notificationTypes,
                    orderUpdates: checked
                  }
                });
              }}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Low Stock Alerts</span>
            <Checkbox 
              checked={preferences.notificationTypes?.lowStock}
              onCheckedChange={(checked) => {
                updatePreferences({
                  notificationTypes: {
                    ...preferences.notificationTypes,
                    lowStock: checked
                  }
                });
              }}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">New Reviews</span>
            <Checkbox 
              checked={preferences.notificationTypes?.newReviews}
              onCheckedChange={(checked) => {
                updatePreferences({
                  notificationTypes: {
                    ...preferences.notificationTypes,
                    newReviews: checked
                  }
                });
              }}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Promotions</span>
            <Checkbox 
              checked={preferences.notificationTypes?.promotions}
              onCheckedChange={(checked) => {
                updatePreferences({
                  notificationTypes: {
                    ...preferences.notificationTypes,
                    promotions: checked
                  }
                });
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Communication Preferences */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Email */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <h3 className="font-medium">E-mail</h3>
                <p className="text-sm text-muted-foreground">
                  Receive updates and reports via email
                </p>
              </div>
              <Switch 
                checked={preferences.emailNotifications}
                onCheckedChange={(checked) => {
                  updatePreferences({ emailNotifications: checked });
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Push Notifications */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <h3 className="font-medium">Push Notifications</h3>
                <p className="text-sm text-muted-foreground">
                  Receive real-time updates while logged in
                </p>
              </div>
              <Switch 
                checked={preferences.pushNotifications}
                onCheckedChange={(checked) => {
                  updatePreferences({ pushNotifications: checked });
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

