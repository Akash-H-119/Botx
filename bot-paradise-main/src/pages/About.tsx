import { useEffect } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { Badge } from "@/components/ui/badge";

const About = () => {
  useEffect(() => { document.title = "About — CipherBots"; }, []);
  return (
    <SiteLayout>
      <div className="container py-16 max-w-3xl">
        <Badge variant="outline" className="mb-3 border-primary/30 text-primary">About</Badge>
        <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-6">Built for the next generation of traders</h1>
        <div className="space-y-6 text-muted-foreground leading-relaxed">
          <p>CipherBots is a curated marketplace for production-ready algorithmic trading bots. Every strategy on our platform is reviewed by quant engineers, backtested on multi-year datasets, and ships with full source code.</p>
          <p>We accept crypto natively — no fiat onramps, no payment processors taking cuts, no chargebacks. Pay with BTC, ETH, USDC and more. Confirmation is automatic via webhook, and your bot files are delivered through one-time signed URLs the moment your transaction settles.</p>
          <p>Whether you're scalping perpetuals, running market-making across CEXes, or chasing trends with ML models, CipherBots is where the best strategies live.</p>
        </div>
      </div>
    </SiteLayout>
  );
};

export default About;
