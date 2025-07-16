"use client"

import { useState, useEffect } from 'react'
import { Smartphone, Laptop, MoreVertical, Lock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/Components/ui/card"
import { Button } from "@/Components/ui/button"
import { Input } from "@/Components/ui/input"
import { Label } from "@/Components/ui/label"
import { BASE_URL } from "@/Constants/Server"
import { toast } from "sonner"

export default function SecuritySettings() {
  const [isLoading, setIsLoading] = useState(false);
  const [showResetCode, setShowResetCode] = useState(false);
  const [sellerEmail, setSellerEmail] = useState('');
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    resetCode: ''
  });

  useEffect(() => {
    fetchSellerProfile();
  }, []);

  const fetchSellerProfile = async () => {
    try {
      const sellerToken = JSON.parse(localStorage.getItem('sellerToken')).data;
      const response = await fetch(`${BASE_URL}/seller/profile`, {
        headers: {
          Authorization: `Bearer ${sellerToken}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setSellerEmail(data.email);
      }
    } catch (error) {
      toast.error("Failed to fetch profile");
    }
  };

  const handleRequestPasswordReset = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/seller/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: sellerEmail }),
      });

      if (response.ok) {
        toast.success("Reset code sent to your email");
        setShowResetCode(true);
      } else {
        throw new Error("Failed to send reset code");
      }
    } catch (error) {
      toast.error("Error requesting password reset");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/seller/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: sellerEmail,
          code: formData.resetCode,
          newPassword: formData.newPassword,
        }),
      });

      if (response.ok) {
        toast.success("Password reset successfully");
        setShowResetCode(false);
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
          resetCode: ''
        });
      } else {
        throw new Error("Failed to reset password");
      }
    } catch (error) {
      toast.error("Error resetting password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      {/* Left Column - Authentication Settings */}
      <div className="space-y-6">
        {/* Two-factor Authentication - Coming Soon */}
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-[300px] text-center p-6">
            <Lock className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Two-factor Authentication</h3>
            <p className="text-sm text-muted-foreground">
              Enhanced security features coming soon to protect your account.
            </p>
          </CardContent>
        </Card>

        {/* Password Reset Section */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold">Reset Password</h3>
                <p className="text-sm text-muted-foreground">Change your password securely</p>
              </div>

              <div className="grid gap-4">
                {showResetCode && (
                  <div className="space-y-2">
                    <Label htmlFor="resetCode">Reset Code</Label>
                    <Input 
                      id="resetCode"
                      type="text"
                      maxLength={4}
                      value={formData.resetCode}
                      onChange={(e) => setFormData({...formData, resetCode: e.target.value})}
                      placeholder="Enter 4-digit code"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="new">New password</Label>
                  <Input 
                    id="new"
                    type="password"
                    value={formData.newPassword}
                    onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirm password</Label>
                  <Input 
                    id="confirm"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                <h4 className="font-medium">Password Requirements</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Minimum 8 characters</li>
                  <li>• At least one special character</li>
                  <li>• At least one number</li>
                  <li>• Can't be the same as a previous password</li>
                </ul>
              </div>

              {!showResetCode ? (
                <Button 
                  className="bg-green-500 hover:bg-green-600 w-full"
                  onClick={handleRequestPasswordReset}
                  disabled={isLoading}
                >
                  {isLoading ? "Requesting..." : "Request Password Reset"}
                </Button>
              ) : (
                <Button 
                  className="bg-green-500 hover:bg-green-600 w-full"
                  onClick={handleResetPassword}
                  disabled={isLoading}
                >
                  {isLoading ? "Resetting..." : "Reset Password"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column - Devices Coming Soon */}
      <Card>
        <CardContent className="flex flex-col items-center justify-center h-[300px] text-center p-6">
          <Smartphone className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Device Management</h3>
          <p className="text-sm text-muted-foreground">
            Device tracking and management features coming soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
