'use client';

import Navbar from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Github, Linkedin, Mail, Users } from 'lucide-react';

export default function TeamPage() {
  const team = [
    {
      name: 'Devang Vala',
      role: 'Team Lead',
      image: 'https://res.cloudinary.com/dxxxxxxxxxxx/image/upload/v1234567890/team/devang.jpg',
      // Replace with actual Cloudinary URL
    },
    {
      name: 'Vasu Sadariya',
      role: 'Developer',
      image: 'https://res.cloudinary.com/dxxxxxxxxxxx/image/upload/v1234567890/team/vasu.jpg',
      // Replace with actual Cloudinary URL
    },
    {
      name: 'Aryan Sawant',
      role: 'Developer',
      image: 'https://res.cloudinary.com/dxxxxxxxxxxx/image/upload/v1234567890/team/aryan.jpg',
      // Replace with actual Cloudinary URL
    },
    {
      name: 'Jeet Tandel',
      role: 'Developer',
      image: 'https://res.cloudinary.com/dxxxxxxxxxxx/image/upload/v1234567890/team/jeet.jpg',
      // Replace with actual Cloudinary URL
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <section className="border-b border-border py-10 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex p-2 bg-primary/10 rounded-full mb-4">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Our Team
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Meet the dedicated team behind the National Identity Verification Portal
          </p>
        </div>
      </section>

      <main className="max-w-4xl mx-auto px-4 py-12">
        
        {/* Team Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {team.map((member, index) => (
            <Card key={index} className="border-border text-center hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                {/* Profile Image */}
                <div className="relative w-24 h-24 mx-auto mb-4">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-24 h-24 rounded-full object-cover border-4 border-primary/20"
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&size=96&background=f97316&color=fff&bold=true`;
                    }}
                  />
                </div>
                
                {/* Name & Role */}
                <h3 className="font-semibold text-foreground">{member.name}</h3>
                <Badge variant="outline" className="mt-2 text-xs">
                  {member.role}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Team Note */}
        <div className="mt-12 text-center">
          <Card className="border-border bg-muted/30">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">
                We are a team of passionate developers committed to building secure, 
                accessible digital solutions for citizens of India under the Digital India initiative.
              </p>
            </CardContent>
          </Card>
        </div>

      </main>

      <Footer />
    </div>
  );
}