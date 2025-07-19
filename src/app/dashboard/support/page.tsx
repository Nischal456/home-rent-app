'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LifeBuoy, Mail, Phone } from 'lucide-react';

export default function SupportPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <LifeBuoy className="h-6 w-6" />
            Support & Contact
          </CardTitle>
          <CardDescription>
            Need help? Reach out to us through any of the channels below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="flex items-start gap-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <Phone className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Phone Support</h3>
              <p className="text-muted-foreground">For urgent issues, please call us directly.</p>
              <a href="tel:98XXXXXXXX" className="text-primary font-medium">9822790665</a>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Email Support</h3>
              <p className="text-muted-foreground">For general inquiries, email is the best way to reach us.</p>
              <a href="mailto:stgtowerhouse@gmail.com" className="text-primary font-medium">stgtowerhouse@gmail.com</a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
