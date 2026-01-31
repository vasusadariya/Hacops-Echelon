'use client';

import Link from 'next/link';
import { Phone, Mail } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-card text-muted-foreground border-t border-border">
      <div className="max-w-7xl mx-auto px-4 py-12">

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">

          {/* About */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">
              About KYC Verify
            </h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="#" className="hover:text-foreground">About Us</Link></li>
              <li><Link href="#" className="hover:text-foreground">Mission & Vision</Link></li>
              <li><Link href="#" className="hover:text-foreground">Our Team</Link></li>
              <li><Link href="#" className="hover:text-foreground">Careers</Link></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">
              Services
            </h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="#" className="hover:text-foreground">Document Verification</Link></li>
              <li><Link href="#" className="hover:text-foreground">Biometric Verification</Link></li>
              <li><Link href="#" className="hover:text-foreground">Identity Validation</Link></li>
              <li><Link href="#" className="hover:text-foreground">KYC Compliance</Link></li>
            </ul>
          </div>

          {/* Useful Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">
              Useful Links
            </h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="#" className="hover:text-foreground">FAQ</Link></li>
              <li><Link href="#" className="hover:text-foreground">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-foreground">Terms & Conditions</Link></li>
              <li><Link href="#" className="hover:text-foreground">Contact Support</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">
              Contact Us
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary" />
                <span>1800-258-1800</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
                <span>support@kycverify.gov.in</span>
              </div>
              <p className="mt-4 text-sm">
                Ministry of Identity Verification<br />
                Government of India
              </p>
            </div>
          </div>

        </div>

        {/* Bottom Strip */}
        <div className="border-t border-border pt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">

            <div>
              <h4 className="font-semibold text-foreground mb-2">
                Languages
              </h4>
              <div className="space-y-1">
                <Link href="#" className="block hover:text-foreground">हिन्दी</Link>
                <Link href="#" className="block hover:text-foreground">English</Link>
                <Link href="#" className="block hover:text-foreground">বাংলা</Link>
              </div>
            </div>

            <div className="md:text-center">
              <p>
                © 2026 KYC Verify. All rights reserved.
              </p>
              <p className="text-xs mt-1">
                Government of India | Ministry of Identity Verification
              </p>
            </div>

            <div className="md:text-right">
              <p>Website Accessibility Policy</p>
              <p className="text-xs mt-1">
                Last Updated: January 31, 2026
              </p>
            </div>

          </div>
        </div>

      </div>
    </footer>
  );
}
