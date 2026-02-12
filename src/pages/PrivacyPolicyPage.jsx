import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Shield,
  Database,
  Users,
  Lock,
  Clock,
  Share2,
  Baby,
  Mail,
  Bell,
  Printer,
  Eye,
  FileText,
  Download,
  Trash2,
  PenLine,
} from 'lucide-react';

const SECTIONS = [
  {
    id: 'data-collected',
    title: 'What Data We Collect',
    icon: Database,
    content: [
      { heading: 'Player Information', text: 'Player names, dates of birth, age groups, team assignments, jersey numbers, and positions.' },
      { heading: 'Skill Assessments', text: 'Tryout evaluations, coach assessments, match performance ratings, per-metric scores, and assessor notes.' },
      { heading: 'Contact Information', text: 'Parent/guardian names, email addresses, and phone numbers. Coach and coordinator contact details.' },
      { heading: 'Attendance Records', text: 'Training session attendance, match day attendance, and participation history.' },
      { heading: 'Match Performance Data', text: 'Game scores, player rotation tracking, playing time records, and match day assessment ratings.' },
      { heading: 'Account Data', text: 'Email address, display name, role assignment, and authentication provider (Google, Apple, or email).' },
    ],
  },
  {
    id: 'data-access',
    title: 'Who Can Access Data',
    icon: Users,
    content: [
      { heading: 'Role-Based Access Control', text: 'The Emerald Lakers app uses strict role-based access controls. Each user role has specific data access permissions:' },
      { heading: 'Parents', text: 'Can view only their own children\'s profiles, assessments, attendance records, and performance data. Cannot access other families\' information.' },
      { heading: 'Coaches', text: 'Can view player profiles, assessments, and attendance for the teams they are assigned to coach. Cannot see data for teams outside their assignment.' },
      { heading: 'Youth Coaches', text: 'Can view and manage attendance and basic player information for their assigned youth program groups only.' },
      { heading: 'Coordinators', text: 'Can view player and team data within their coordinated program (e.g., girls\' program, boys\' program). Can manage scoring rosters and swap requests for their teams.' },
      { heading: 'Assessors', text: 'During tryout sessions, assessors can view player names and submit evaluations. Access is limited to active tryout sessions they are assigned to.' },
      { heading: 'Administrators', text: 'Club administrators have full access to all data within the system for management purposes. This includes all player records, assessments, team configurations, and system settings.' },
    ],
  },
  {
    id: 'data-storage',
    title: 'How Data Is Stored',
    icon: Lock,
    content: [
      { heading: 'Cloud Infrastructure', text: 'All data is stored securely using Firebase (Google Cloud Platform), hosted in Google\'s data centres with enterprise-grade physical and digital security.' },
      { heading: 'Encryption in Transit', text: 'All data transmitted between your device and our servers is encrypted using TLS (Transport Layer Security), the industry standard for secure web communication.' },
      { heading: 'Encryption at Rest', text: 'Data stored in our database is encrypted at rest using Google Cloud\'s default encryption, which uses AES-256 encryption.' },
      { heading: 'Authentication Security', text: 'User authentication is handled by Firebase Authentication, supporting secure sign-in via Google, Apple, or email/password with industry-standard password hashing.' },
      { heading: 'Firestore Security Rules', text: 'Database access is enforced through Firestore security rules that validate every read and write operation against the user\'s authenticated role and permissions.' },
    ],
  },
  {
    id: 'data-retention',
    title: 'Data Retention',
    icon: Clock,
    content: [
      { heading: 'Active Membership', text: 'Player data is retained for the duration of the player\'s active membership with the Emerald Lakers Basketball Club.' },
      { heading: 'Post-Membership', text: 'After a player\'s membership ends, data is retained for an additional 2 years for historical records and reporting purposes.' },
      { heading: 'Deletion on Request', text: 'After the retention period, data will be deleted upon request. Parents or guardians may request early deletion at any time (see Your Rights section below).' },
      { heading: 'Assessment Archives', text: 'Tryout evaluations and assessment data may be retained in anonymised or aggregated form for program improvement purposes after individual records are deleted.' },
    ],
  },
  {
    id: 'your-rights',
    title: 'Parent & Guardian Rights',
    icon: Eye,
    content: [
      { heading: 'Right to View', text: 'You have the right to view all data collected about your child at any time through the app. Your parent dashboard shows assessments, attendance, and performance data.' },
      { heading: 'Right to Correction', text: 'If any data about your child is inaccurate, you have the right to request correction. Contact the club administrator through the app or via email.' },
      { heading: 'Right to Deletion', text: 'You may request deletion of your child\'s data at any time. Upon verified request, all personal data will be permanently removed from the system within 30 days.' },
      { heading: 'Right to Data Export', text: 'You may request a complete export of all data held about your child in a standard format (CSV/PDF). Contact the club administrator to initiate an export.' },
      { heading: 'Right to Withdraw Consent', text: 'You may withdraw consent for data collection at any time. Note that this may affect your child\'s ability to participate in club activities that require record-keeping.' },
    ],
  },
  {
    id: 'data-sharing',
    title: 'Data Sharing',
    icon: Share2,
    content: [
      { heading: 'No Third-Party Sales', text: 'Your data is never sold to third parties. The Emerald Lakers Basketball Club does not engage in any commercial data sharing.' },
      { heading: 'Club Use Only', text: 'Data is only accessible within the Emerald Lakers club management system and is used exclusively for club administration, team management, and player development.' },
      { heading: 'Infrastructure Providers', text: 'Data is stored on Google Cloud Platform (Firebase) infrastructure. Google acts as a data processor under their standard terms of service and does not access your data for advertising or other purposes.' },
      { heading: 'Legal Requirements', text: 'We may disclose data if required by law, court order, or to protect the safety of club members. We will notify affected users where legally permitted to do so.' },
    ],
  },
  {
    id: 'childrens-privacy',
    title: "Children's Privacy",
    icon: Baby,
    content: [
      { heading: 'Minimal Data Collection', text: 'We collect only the minimum data necessary about minors to facilitate club activities, team management, and player development.' },
      { heading: 'Parental Consent', text: 'All data about minors is collected with the knowledge and consent of a parent or guardian. Parent accounts are created through a verified invitation process.' },
      { heading: 'Equal Protection', text: 'All data about minors is protected with the same security measures as adult data, including encryption, role-based access controls, and secure authentication.' },
      { heading: 'No Direct Marketing', text: 'We do not use children\'s data for marketing purposes. The app does not display advertising or collect data for advertising profiles.' },
      { heading: 'Age-Appropriate Access', text: 'Player accounts have limited access appropriate to their role. Players can view their own profiles and team information but cannot access administrative or other players\' private data.' },
    ],
  },
  {
    id: 'contact',
    title: 'Contact & Enquiries',
    icon: Mail,
    content: [
      { heading: 'Privacy Enquiries', text: 'For any questions about this privacy policy or how your data is handled, contact the club administrator through the app or email the club committee at admin@emeraldlakers.com.' },
      { heading: 'Data Requests', text: 'To request data access, correction, deletion, or export, contact the club administrator. Please allow up to 30 days for requests to be processed.' },
      { heading: 'Complaints', text: 'If you are not satisfied with how your privacy concern has been handled, you may contact the Office of the Australian Information Commissioner (OAIC) at oaic.gov.au.' },
    ],
  },
  {
    id: 'changes',
    title: 'Changes to This Policy',
    icon: Bell,
    content: [
      { heading: 'Notification of Changes', text: 'Users will be notified of any material changes to this privacy policy via in-app notification. We encourage you to review this policy periodically.' },
      { heading: 'Effective Date', text: 'Changes take effect when posted to this page. Continued use of the app after changes are posted constitutes acceptance of the updated policy.' },
    ],
  },
];

const Section = ({ section, isOpen, onToggle }) => {
  const Icon = section.icon;
  return (
    <div className="border border-[#D4E4D4]/50 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50/50 transition-colors"
      >
        <div className="w-9 h-9 rounded-lg bg-[#D4E4D4]/30 flex items-center justify-center flex-shrink-0">
          <Icon className="w-4.5 h-4.5 text-[#00A651]" />
        </div>
        <span className="flex-1 font-semibold text-gray-800 text-sm">{section.title}</span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-[#00A651]" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>
      {isOpen && (
        <div className="px-4 pb-4 space-y-3">
          {section.content.map((item, i) => (
            <div key={i} className="pl-12">
              <h4 className="text-[#00A651] text-xs font-semibold mb-0.5">{item.heading}</h4>
              <p className="text-gray-600 text-sm leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const PrivacyPolicyPage = () => {
  const navigate = useNavigate();
  const [openSections, setOpenSections] = useState({});

  const toggleSection = (id) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    const all = {};
    SECTIONS.forEach((s) => { all[s.id] = true; });
    setOpenSections(all);
  };

  const collapseAll = () => {
    setOpenSections({});
  };

  const handlePrint = () => {
    expandAll();
    setTimeout(() => window.print(), 200);
  };

  return (
    <div className="min-h-screen bg-[#F5F9F5]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-[#D4E4D4]/30 print:static">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center print:hidden"
            >
              <ArrowLeft className="w-5 h-5 text-gray-800" />
            </button>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#00A651]" />
              <h1 className="text-gray-800 font-bold text-lg">Privacy Policy</h1>
            </div>
          </div>
          <button
            onClick={handlePrint}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center print:hidden"
            title="Print"
          >
            <Printer className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Intro Card */}
        <div className="bg-white border border-[#D4E4D4]/50 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-[#005028]/20 border-2 border-[#00A651] rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-[#00A651]" />
            </div>
            <div>
              <h2 className="text-gray-800 font-bold text-lg">Emerald Lakers Basketball Club</h2>
              <p className="text-[#00A651] text-sm">Sixth Man App — Privacy Policy</p>
            </div>
          </div>
          <p className="text-gray-600 text-sm leading-relaxed">
            The Emerald Lakers Basketball Club ("we", "us", "our") is committed to protecting the
            privacy of our members, including players, parents, coaches, and volunteers. This policy
            explains how we collect, use, store, and protect your personal information when you use
            the Sixth Man club management application.
          </p>
          <p className="text-gray-400 text-xs mt-3">
            Last updated: February 2026
          </p>
        </div>

        {/* Expand/Collapse controls */}
        <div className="flex gap-2 print:hidden">
          <button
            onClick={expandAll}
            className="px-3 py-1.5 text-xs font-medium text-[#00A651] bg-[#005028]/10 border border-[#00A651]/30 rounded-lg hover:bg-[#00A651]/20 transition-colors"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-1.5 text-xs font-medium text-gray-400 bg-gray-100 border border-white/10 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Collapse All
          </button>
        </div>

        {/* Sections */}
        <div className="space-y-3">
          {SECTIONS.map((section) => (
            <Section
              key={section.id}
              section={section}
              isOpen={openSections[section.id] || false}
              onToggle={() => toggleSection(section.id)}
            />
          ))}
        </div>

        {/* Summary rights card */}
        <div className="bg-white border border-[#00A651]/40 rounded-xl p-5">
          <h3 className="text-gray-800 font-bold text-sm mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#00A651]" />
            Your Rights at a Glance
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: Eye, label: 'View Data' },
              { icon: PenLine, label: 'Correct Data' },
              { icon: Trash2, label: 'Delete Data' },
              { icon: Download, label: 'Export Data' },
            ].map(({ icon: RIcon, label }) => (
              <div key={label} className="bg-[#F5F9F5] rounded-lg p-3 text-center">
                <RIcon className="w-5 h-5 text-[#00A651] mx-auto mb-1.5" />
                <p className="text-gray-600 text-xs font-medium">{label}</p>
              </div>
            ))}
          </div>
          <p className="text-gray-400 text-xs mt-3">
            Contact admin@emeraldlakers.com to exercise any of these rights.
          </p>
        </div>

        {/* Footer */}
        <div className="text-center pb-6">
          <p className="text-gray-800/30 text-xs">
            &copy; 2026 Emerald Lakers Basketball Club. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
