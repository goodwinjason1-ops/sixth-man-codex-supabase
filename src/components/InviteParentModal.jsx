import React, { useState } from 'react';
import { X, Copy, Check, UserPlus, Loader2, ExternalLink } from 'lucide-react';
import { createInvitation } from '../services/parentInvitationService';
import { useAuth } from '../contexts/AuthContext';

const InviteParentModal = ({ player, onClose, onSuccess }) => {
  const { currentUser } = useAuth();
  const [parentEmail, setParentEmail] = useState(player?.parentEmail || '');
  const [parentName, setParentName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await createInvitation({
        playerIds: [player.id],
        parentEmail: parentEmail.trim(),
        parentName: parentName.trim(),
        createdBy: currentUser.uid
      });

      if (res.success) {
        setResult(res);
        if (onSuccess) onSuccess(res);
      } else {
        setError(res.error || 'Failed to create invitation');
      }
    } catch (err) {
      setError(err.message || 'Failed to create invitation');
    } finally {
      setLoading(false);
    }
  };

  const signupLink = result ? `${window.location.origin}/signup/${result.invitationCode}` : '';

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(result.invitationCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(signupLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative w-full sm:max-w-lg max-h-[90vh] bg-[#0d5943] border-2 border-[#1a8a68] rounded-t-3xl sm:rounded-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-[#1a8a68] flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-[#4ade80]" />
            Invite Parent
          </h2>
          <button onClick={onClose} className="w-8 h-8 bg-[#0a3d2e] border border-[#1a8a68] rounded-full flex items-center justify-center hover:border-[#22c55e]">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Player Info */}
          <div className="bg-[#0a3d2e] border border-[#1a8a68] rounded-xl p-3 mb-4">
            <p className="text-[#4ade80] text-xs font-medium mb-1">Inviting parent for</p>
            <p className="text-white font-semibold">{player.name}</p>
            <p className="text-[#1a8a68] text-sm">#{player.playerNumber} &bull; {player.ageGroup || player.teamId}</p>
          </div>

          {!result ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[#4ade80] text-sm font-medium mb-1">Parent Email (optional)</label>
                <input
                  type="email"
                  value={parentEmail}
                  onChange={(e) => setParentEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0a3d2e] border border-[#1a8a68] rounded-lg text-white focus:border-[#22c55e] focus:outline-none"
                  placeholder="parent@email.com"
                />
                <p className="text-[#1a8a68] text-xs mt-1">Pre-fills the signup form for the parent</p>
              </div>

              <div>
                <label className="block text-[#4ade80] text-sm font-medium mb-1">Parent Name (optional)</label>
                <input
                  type="text"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0a3d2e] border border-[#1a8a68] rounded-lg text-white focus:border-[#22c55e] focus:outline-none"
                  placeholder="Parent's full name"
                  maxLength={100}
                />
              </div>

              {error && (
                <div className="p-3 bg-red-500/20 border border-red-500 rounded-lg">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#22c55e] text-[#0a3d2e] rounded-xl font-semibold hover:bg-[#4ade80] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    Generate Invitation Code
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="bg-[#22c55e]/10 border-2 border-[#22c55e] rounded-xl p-4 text-center">
                <p className="text-[#4ade80] text-sm font-medium mb-2">Invitation Code</p>
                <p className="text-white text-3xl font-mono font-bold tracking-wider">{result.invitationCode}</p>
              </div>

              <button
                onClick={copyCode}
                className="w-full py-3 bg-[#0a3d2e] border border-[#1a8a68] rounded-xl text-white font-medium hover:border-[#22c55e] transition-colors flex items-center justify-center gap-2"
              >
                {copied ? <Check className="w-5 h-5 text-[#4ade80]" /> : <Copy className="w-5 h-5" />}
                {copied ? 'Copied!' : 'Copy Code'}
              </button>

              <div className="bg-[#0a3d2e] border border-[#1a8a68] rounded-xl p-3">
                <p className="text-[#4ade80] text-xs font-medium mb-2">Signup Link</p>
                <p className="text-white text-sm break-all font-mono">{signupLink}</p>
              </div>

              <button
                onClick={copyLink}
                className="w-full py-3 bg-[#0a3d2e] border border-[#1a8a68] rounded-xl text-white font-medium hover:border-[#22c55e] transition-colors flex items-center justify-center gap-2"
              >
                {copiedLink ? <Check className="w-5 h-5 text-[#4ade80]" /> : <ExternalLink className="w-5 h-5" />}
                {copiedLink ? 'Link Copied!' : 'Copy Signup Link'}
              </button>

              <p className="text-[#1a8a68] text-xs text-center">Share this code or link with the parent. It expires in 30 days.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InviteParentModal;
