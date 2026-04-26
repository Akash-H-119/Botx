import { useEffect } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, KeyRound, ShieldCheck, UserCog } from "lucide-react";

const accountSections = [
  {
    title: "Profile",
    description: "Manage user details, preferences, and account identity.",
    icon: UserCog,
  },
  {
    title: "Security",
    description: "Add password, session, and verification settings here.",
    icon: ShieldCheck,
  },
  {
    title: "Billing",
    description: "Keep subscription, invoice, and payment controls together.",
    icon: CreditCard,
  },
  {
    title: "Access",
    description: "Prepare roles, API keys, and permission controls.",
    icon: KeyRound,
  },
];

const AccountManagement = () => {
  useEffect(() => {
    document.title = "Account Management - Quro";
  }, []);

  return (
    <SiteLayout>
      <div className="container py-12 md:py-16">
        <div className="mb-10 max-w-3xl">
          <Badge variant="outline" className="mb-3 border-primary/30 text-primary">
            Account
          </Badge>
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-3">
            Account management
          </h1>
          <p className="text-muted-foreground">
            A dedicated place to build account settings, user controls, billing, and access management content.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {accountSections.map((section) => {
            const Icon = section.icon;

            return (
              <Card key={section.title} className="glass border-border/60">
                <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="font-display text-xl">{section.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <p className="text-sm text-muted-foreground">{section.description}</p>
                  <Button variant="outline" size="sm">
                    Add content
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </SiteLayout>
  );
};

export default AccountManagement;
