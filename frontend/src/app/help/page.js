'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import Navbar from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  HelpCircle,
  Search,
  FileText,
  User,
  Shield,
  Clock,
  Phone,
  Mail,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Camera,
  Building2,
  X
} from 'lucide-react';

export default function HelpPage() {
  const t = useTranslations('help');
  const [searchQuery, setSearchQuery] = useState('');

  // FAQ Data with translation keys
  const faqCategories = [
    {
      id: 'general',
      titleKey: 'categories.general.title',
      icon: HelpCircle,
      color: 'bg-blue-50 text-blue-600 border-blue-200',
      faqs: [
        { qKey: 'categories.general.q1', aKey: 'categories.general.a1' },
        { qKey: 'categories.general.q2', aKey: 'categories.general.a2' },
        { qKey: 'categories.general.q3', aKey: 'categories.general.a3' },
        { qKey: 'categories.general.q4', aKey: 'categories.general.a4' }
      ]
    },
    {
      id: 'documents',
      titleKey: 'categories.documents.title',
      icon: FileText,
      color: 'bg-purple-50 text-purple-600 border-purple-200',
      faqs: [
        { qKey: 'categories.documents.q1', aKey: 'categories.documents.a1' },
        { qKey: 'categories.documents.q2', aKey: 'categories.documents.a2' },
        { qKey: 'categories.documents.q3', aKey: 'categories.documents.a3' },
        { qKey: 'categories.documents.q4', aKey: 'categories.documents.a4' }
      ]
    },
    {
      id: 'biometric',
      titleKey: 'categories.biometric.title',
      icon: Camera,
      color: 'bg-green-50 text-green-600 border-green-200',
      faqs: [
        { qKey: 'categories.biometric.q1', aKey: 'categories.biometric.a1' },
        { qKey: 'categories.biometric.q2', aKey: 'categories.biometric.a2' },
        { qKey: 'categories.biometric.q3', aKey: 'categories.biometric.a3' },
        { qKey: 'categories.biometric.q4', aKey: 'categories.biometric.a4' }
      ]
    },
    {
      id: 'account',
      titleKey: 'categories.account.title',
      icon: User,
      color: 'bg-orange-50 text-orange-600 border-orange-200',
      faqs: [
        { qKey: 'categories.account.q1', aKey: 'categories.account.a1' },
        { qKey: 'categories.account.q2', aKey: 'categories.account.a2' },
        { qKey: 'categories.account.q3', aKey: 'categories.account.a3' },
        { qKey: 'categories.account.q4', aKey: 'categories.account.a4' }
      ]
    },
    {
      id: 'status',
      titleKey: 'categories.status.title',
      icon: Clock,
      color: 'bg-yellow-50 text-yellow-600 border-yellow-200',
      faqs: [
        { qKey: 'categories.status.q1', aKey: 'categories.status.a1' },
        { qKey: 'categories.status.q2', aKey: 'categories.status.a2' },
        { qKey: 'categories.status.q3', aKey: 'categories.status.a3' },
        { qKey: 'categories.status.q4', aKey: 'categories.status.a4' }
      ]
    },
    {
      id: 'security',
      titleKey: 'categories.security.title',
      icon: Shield,
      color: 'bg-red-50 text-red-600 border-red-200',
      faqs: [
        { qKey: 'categories.security.q1', aKey: 'categories.security.a1' },
        { qKey: 'categories.security.q2', aKey: 'categories.security.a2' },
        { qKey: 'categories.security.q3', aKey: 'categories.security.a3' },
        { qKey: 'categories.security.q4', aKey: 'categories.security.a4' }
      ]
    }
  ];

  // Filter FAQs based on search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return faqCategories;

    const query = searchQuery.toLowerCase();
    
    return faqCategories.map(category => ({
      ...category,
      faqs: category.faqs.filter(faq => {
        const question = t(faq.qKey).toLowerCase();
        const answer = t(faq.aKey).toLowerCase();
        return question.includes(query) || answer.includes(query);
      })
    })).filter(category => category.faqs.length > 0);
  }, [searchQuery, t]);

  const totalResults = filteredCategories.reduce((sum, cat) => sum + cat.faqs.length, 0);

  const clearSearch = () => setSearchQuery('');

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <section className="border-b border-border py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <HelpCircle className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              {t('title')}
            </h1>
          </div>
          <p className="text-center text-muted-foreground mb-6 max-w-lg mx-auto">
            {t('subtitle')}
          </p>
          
          {/* Search Bar */}
          <div className="max-w-lg mx-auto relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 h-11 bg-background border-border"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Search Results Count */}
          {searchQuery && (
            <p className="text-center text-sm text-muted-foreground mt-3">
              {totalResults > 0 
                ? t('searchResults', { count: totalResults, query: searchQuery })
                : t('noResults', { query: searchQuery })
              }
            </p>
          )}
        </div>
      </section>

      <main className="max-w-4xl mx-auto px-4 py-10">

        {/* No Results */}
        {searchQuery && totalResults === 0 && (
          <div className="text-center py-12 bg-muted/30 rounded-lg mb-8">
            <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">
              {t('noResultsMessage')}
            </p>
            <Button variant="outline" onClick={clearSearch}>
              {t('clearSearch')}
            </Button>
          </div>
        )}

        {/* FAQ Categories */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            {t('faqTitle')}
            {!searchQuery && (
              <Badge variant="outline" className="font-normal">
                {faqCategories.reduce((sum, cat) => sum + cat.faqs.length, 0)} {t('questions')}
              </Badge>
            )}
          </h2>

          <div className="space-y-4">
            {filteredCategories.map((category) => {
              const Icon = category.icon;
              return (
                <Card key={category.id} className="border-border overflow-hidden">
                  <CardHeader className={`py-3 px-4 ${category.color} border-b`}>
                    <CardTitle className="flex items-center gap-2 text-sm font-medium">
                      <Icon className="h-4 w-4" />
                      {t(category.titleKey)}
                      <span className="ml-auto text-xs opacity-70">
                        {category.faqs.length}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Accordion type="single" collapsible className="w-full">
                      {category.faqs.map((faq, index) => (
                        <AccordionItem 
                          key={index} 
                          value={`${category.id}-${index}`}
                          className="border-b last:border-b-0"
                        >
                          <AccordionTrigger className="px-4 py-3 text-left hover:no-underline hover:bg-muted/30">
                            <span className="text-sm font-medium pr-4">
                              {t(faq.qKey)}
                            </span>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-4">
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {t(faq.aKey)}
                            </p>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Guidelines */}
        <section className="mb-10">
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-primary" />
                {t('guidelines.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-sm mb-3 text-green-700">{t('guidelines.dos')}</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                      <span>{t('guidelines.do1')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                      <span>{t('guidelines.do2')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                      <span>{t('guidelines.do3')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                      <span>{t('guidelines.do4')}</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-sm mb-3 text-red-700">{t('guidelines.donts')}</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <X className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                      <span>{t('guidelines.dont1')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <X className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                      <span>{t('guidelines.dont2')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <X className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                      <span>{t('guidelines.dont3')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <X className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                      <span>{t('guidelines.dont4')}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Contact Section */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-4">{t('contact.title')}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <Phone className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t('contact.phone')}</p>
                    <p className="font-semibold text-primary">1800-XXX-XXXX</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Mail className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t('contact.email')}</p>
                    <p className="font-medium text-sm">support@nivp.gov.in</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <Clock className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t('contact.hours')}</p>
                    <p className="font-medium text-sm">{t('contact.timing')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA */}
        <section>
          <div className="bg-muted/50 rounded-lg p-6 text-center border border-border">
            <p className="text-muted-foreground text-sm mb-4">
              {t('cta.message')}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/services">
                <Button variant="outline" size="sm">
                  {t('cta.services')}
                </Button>
              </Link>
              <Link href="/verification">
                <Button size="sm" className="bg-primary hover:bg-primary/90">
                  {t('cta.startVerification')}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}