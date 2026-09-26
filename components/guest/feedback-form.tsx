'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/guest-kit/button';
import { Textarea } from '@/components/ui/guest-kit/input';
import { useToast } from '@/components/ui/guest-kit/toast';
import { AnimatedCheck } from './animated-check';
import { StarRating, type Rating } from './star-rating';
import { getGuestApi } from '@/lib/guest/data';
import { GUEST_COPY } from '@/lib/guest/copy';
import { GUEST_TID } from './test-ids';
import type { GuestSession, PublicHotel } from '@/lib/guest/types';

const TAGS = GUEST_COPY.feedback.tags.map((label, i) => ({
  slug: label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
  label,
  key: i,
}));

export function FeedbackForm({ hotel, session, invoiceId }: { hotel: PublicHotel; session: GuestSession; invoiceId: string }) {
  const { show } = useToast();
  const [rating, setRating] = useState<Rating | 0>(0);
  const [tags, setTags] = useState<Set<string>>(new Set());
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  function toggleTag(slug: string) {
    setTags((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  async function handleSubmit() {
    if (!rating || submitting) return;
    setSubmitting(true);
    try {
      const api = await getGuestApi();
      await api.submitFeedback(session, {
        invoiceId,
        rating,
        tags: TAGS.filter((t) => tags.has(t.slug)).map((t) => t.label),
        comment: comment.trim() || undefined,
      });
      setSent(true);
    } catch {
      show({ tone: 'error', title: GUEST_COPY.common.retry, action: { label: GUEST_COPY.feedback.send, onClick: handleSubmit } });
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div data-testid={GUEST_TID.feedbackThanks} className="animate-rise flex flex-col items-center gap-2 rounded-lg border border-success/30 bg-success-soft p-6 text-center">
        <AnimatedCheck className="size-10" />
        <p className="text-sm text-ink">{GUEST_COPY.feedback.thanks}</p>
      </div>
    );
  }

  return (
    <div data-testid={GUEST_TID.feedbackForm} className="flex flex-col gap-4">
      <h2 className="font-display text-lg text-ink">{GUEST_COPY.feedback.title}</h2>

      <StarRating value={rating} onChange={setRating} />

      <div className="flex flex-wrap gap-2">
        {TAGS.map((tag) => (
          <Button key={tag.slug} variant="chip" pressed={tags.has(tag.slug)} onClick={() => toggleTag(tag.slug)} data-testid={GUEST_TID.feedbackTag(tag.slug)}>
            {tag.label}
          </Button>
        ))}
      </div>

      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={500}
        placeholder={GUEST_COPY.feedback.comment}
        aria-label={GUEST_COPY.feedback.comment}
      />

      {rating > 0 && rating <= 2 && hotel.contact.phone && <p className="text-sm text-ink-muted">{GUEST_COPY.feedback.low}</p>}

      <Button variant="primary" size="lg" fullWidth disabled={!rating} loading={submitting} onClick={handleSubmit} data-testid={GUEST_TID.feedbackSubmit}>
        {GUEST_COPY.feedback.send}
      </Button>
    </div>
  );
}
