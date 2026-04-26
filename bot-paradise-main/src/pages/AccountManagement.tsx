import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Wallet, 
  TrendingUp, 
  ShieldCheck, 
  Clock, 
  Send, 
  CheckCircle2,
  AlertCircle,
  DollarSign,
  Percent
} from "lucide-react";

interface FormData {
  brokerName: string;
  accountNumber: string;
  accountType: string;
  initialCapital: string;
  notes: string;
}

interface FormErrors {
  brokerName?: string;
  accountNumber?: string;
  accountType?: string;
  initialCapital?: string;
}

const AccountManagement = () => {
  const [formData, setFormData] = useState<FormData>({
    brokerName: "",
    accountNumber: "",
    accountType: "",
    initialCapital: "",
    notes: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");

  useEffect(() => {
    document.title = "Account Management - Quro";
  }, []);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.brokerName.trim()) {
      newErrors.brokerName = "Broker name is required";
    }
    if (!formData.accountNumber.trim()) {
      newErrors.accountNumber = "Account number is required";
    }
    if (!formData.accountType.trim()) {
      newErrors.accountType = "Account type is required";
    }
    if (!formData.initialCapital.trim()) {
      newErrors.initialCapital = "Initial capital is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitStatus("idle");

    if (!validateForm()) return;

    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setSubmitStatus("success");
    
    // Reset form after successful submission
    setFormData({
      brokerName: "",
      accountNumber: "",
      accountType: "",
      initialCapital: "",
      notes: "",
    });
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <SiteLayout>
      <div className="container py-12 md:py-16">
        {/* Header */}
        <div className="mb-10 max-w-3xl">
          <Badge variant="outline" className="mb-3 border-primary/30 text-primary">
            Account
          </Badge>
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-3">
            Account management
          </h1>
          <p className="text-muted-foreground">
            Manage your trading accounts and let our bots grow your wealth.
          </p>
        </div>

        {/* Trading Bot Service Section */}
        <div className="mb-12">
          <Card className="glass-strong border-primary/20 overflow-hidden">
            <div className="bg-gradient-to-r from-primary/10 to-transparent p-6 md:p-8 border-b border-primary/10">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="font-display text-2xl md:text-3xl font-bold">
                    Get Free Bots
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    Let our expert bots trade for you
                  </p>
                </div>
              </div>
            </div>

            <CardContent className="p-6 md:p-8 space-y-8">
              {/* How It Works */}
              <div>
                <h3 className="font-display text-xl font-semibold mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  How It Works
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="glass rounded-xl p-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-3">
                      <Wallet className="h-5 w-5 text-primary" />
                    </div>
                    <h4 className="font-semibold mb-2">1. Submit Your Account</h4>
                    <p className="text-sm text-muted-foreground">
                      Share your trading account details securely through our submission form.
                    </p>
                  </div>
                  <div className="glass rounded-xl p-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-3">
                      <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                    <h4 className="font-semibold mb-2">2. We Trade For You</h4>
                    <p className="text-sm text-muted-foreground">
                      Our advanced bots trade on your account using proven strategies.
                    </p>
                  </div>
                  <div className="glass rounded-xl p-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-3">
                      <DollarSign className="h-5 w-5 text-primary" />
                    </div>
                    <h4 className="font-semibold mb-2">3. You Keep 70% Profit</h4>
                    <p className="text-sm text-muted-foreground">
                      You receive 70% of all profits, we take 30% as our commission.
                    </p>
                  </div>
                </div>
              </div>

              {/* Profit Split */}
              <div className="glass rounded-2xl p-6">
                <h3 className="font-display text-xl font-semibold mb-6 text-center">
                  Profit Sharing Model
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="text-center p-6 rounded-xl bg-success/10 border border-success/20">
                    <Percent className="h-8 w-8 text-success mx-auto mb-3" />
                    <div className="font-display text-4xl font-bold text-success mb-2">70%</div>
                    <div className="font-semibold mb-1">Your Share</div>
                    <p className="text-sm text-muted-foreground">
                      You keep 70% of all profits generated
                    </p>
                  </div>
                  <div className="text-center p-6 rounded-xl bg-primary/10 border border-primary/20">
                    <Percent className="h-8 w-8 text-primary mx-auto mb-3" />
                    <div className="font-display text-4xl font-bold text-primary mb-2">30%</div>
                    <div className="font-semibold mb-1">Our Commission</div>
                    <p className="text-sm text-muted-foreground">
                      We take 30% for managing your account
                    </p>
                  </div>
                </div>
              </div>

              {/* Security Notice */}
              <div className="flex items-start gap-4 p-5 rounded-xl bg-warning/10 border border-warning/20">
                <ShieldCheck className="h-6 w-6 text-warning flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-warning mb-1">Security & Privacy</h4>
                  <p className="text-sm text-muted-foreground">
                    Your account credentials are encrypted and stored securely. We only use read-only 
                    access for trading operations. You can withdraw profits anytime. Your funds remain 
                    fully controlled by you.
                  </p>
                </div>
              </div>

              {/* Submission Form */}
              <div className="pt-4">
                <h3 className="font-display text-xl font-semibold mb-6 flex items-center gap-2">
                  <Send className="h-5 w-5 text-primary" />
                  Submit Your Trading Account
                </h3>

                {submitStatus === "success" && (
                  <div className="mb-6 p-4 rounded-xl bg-success/10 border border-success/20 flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-success">Submission Received!</p>
                      <p className="text-sm text-muted-foreground">
                        We'll review your account and contact you within 24 hours.
                      </p>
                    </div>
                  </div>
                )}

                {submitStatus === "error" && (
                  <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-destructive">Submission Failed</p>
                      <p className="text-sm text-muted-foreground">
                        Please try again or contact us directly.
                      </p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="brokerName">Broker Name *</Label>
                      <Input
                        id="brokerName"
                        placeholder="e.g., Binance, Bybit, OctaFX"
                        value={formData.brokerName}
                        onChange={(e) => handleChange("brokerName", e.target.value)}
                        className={errors.brokerName ? "border-destructive" : ""}
                      />
                      {errors.brokerName && (
                        <p className="text-sm text-destructive">{errors.brokerName}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="accountNumber">Account Number / ID *</Label>
                      <Input
                        id="accountNumber"
                        placeholder="Your trading account ID"
                        value={formData.accountNumber}
                        onChange={(e) => handleChange("accountNumber", e.target.value)}
                        className={errors.accountNumber ? "border-destructive" : ""}
                      />
                      {errors.accountNumber && (
                        <p className="text-sm text-destructive">{errors.accountNumber}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="accountType">Account Type *</Label>
                      <Input
                        id="accountType"
                        placeholder="e.g., Standard, ECN, Crypto"
                        value={formData.accountType}
                        onChange={(e) => handleChange("accountType", e.target.value)}
                        className={errors.accountType ? "border-destructive" : ""}
                      />
                      {errors.accountType && (
                        <p className="text-sm text-destructive">{errors.accountType}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="initialCapital">Initial Capital (USD) *</Label>
                      <Input
                        id="initialCapital"
                        type="number"
                        placeholder="e.g., 1000"
                        value={formData.initialCapital}
                        onChange={(e) => handleChange("initialCapital", e.target.value)}
                        className={errors.initialCapital ? "border-destructive" : ""}
                      />
                      {errors.initialCapital && (
                        <p className="text-sm text-destructive">{errors.initialCapital}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Additional Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Any additional information about your account or trading preferences..."
                      value={formData.notes}
                      onChange={(e) => handleChange("notes", e.target.value)}
                      rows={4}
                    />
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full md:w-auto"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Submit Account for Trading
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Other Account Sections */}
        <div className="grid gap-5 md:grid-cols-3">
          <Card className="glass border-border/60">
            <CardHeader className="flex flex-row items-center gap-4 space-y-0">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="font-display text-xl">Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <p className="text-sm text-muted-foreground">
                Manage password, session, and verification settings for your account.
              </p>
              <Button variant="outline" size="sm" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          <Card className="glass border-border/60">
            <CardHeader className="flex flex-row items-center gap-4 space-y-0">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="font-display text-xl">Billing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <p className="text-sm text-muted-foreground">
                View subscription plans, invoices, and payment history.
              </p>
              <Button variant="outline" size="sm" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          <Card className="glass border-border/60">
            <CardHeader className="flex flex-row items-center gap-4 space-y-0">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="font-display text-xl">My Bots</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <p className="text-sm text-muted-foreground">
                View and manage your purchased trading bots.
              </p>
              <Button variant="outline" size="sm" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </SiteLayout>
  );
};

export default AccountManagement;