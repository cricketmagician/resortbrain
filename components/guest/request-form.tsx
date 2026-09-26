'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSWRConfig } from 'swr';
import { Button } from '@/components/ui/guest-kit/button';
import { Textarea } from '@/components/ui/guest-kit/input';
import { useToast } from '@/components/ui/guest-kit/toast';
import { RequestCategoryGrid } from './request-category-grid';
import { getGuestApi, GuestApiError } from '@/lib/guest/data';
import { requestsKey } from '@/lib/guest/data/hooks';
import { clearSession } from '@/lib/guest/session';
import { GUEST_COPY } from '@/lib/guest/copy';
import { GUEST_TID } from './test-ids';
import type { GuestSession, PublicHotel, RequestCategory, RequestPreset, ServiceRequest } from '@/lib/guest/types';

const VALID_CATEGORIES: readonly RequestCategory[] = ['housekeeping', 'amenities', 'front_desk', 'maintenance'];

interface PresetOption extends RequestPreset {
  isOther?: boolean;
}

function computeTitle(option: PresetOption | undefined, details: string): string | null {
  if (!option) return null;
  if (!option.isOther) return option.label;
  const trimmed = details.trim();
  return trimmed.length >= 3 ? trimmed.slice(0, 60) : null;
}

export function RequestForm({ hotel, session }: { hotel: PublicHotel; session: GuestSession }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { mutate } = useSWRConfig();
  const { show } = useToast();

  const preselected = searchParams.get('c');
  const [category, setCategory] = useState<RequestCategory | null>(
    preselected && (VALID_CATEGORIES as string[]).includes(preselected) ? (preselected as RequestCategory) : null
  );
  const [presetSlug, setPresetSlug] = useState<string | null>(null);
  const [details, setDetails] = useState('');
  const [urgent, setUrgent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const options: PresetOption[] = category
    ? [...hotel.requestPresets[category], { slug: 'other', label: GUEST_COPY.request.other, isOther: true }]
    : [];
  const selectedOption = options.find((o) => o.slug === presetSlug);
  const title = computeTitle(selectedOption, details);
  const needsDetails = !!selectedOption?.isOther && !title;

  function selectCategory(next: RequestCategory) {
    setCategory(next);
    setPresetSlug(null);
  }

  async function handleSubmit() {
    if (!category || !title || submitting) return;
    setSubmitting(true);

    const tempId = `temp_${crypto.randomUUID()}`;
    const optimistic: ServiceRequest = {
      id: tempId,
      category,
      title,
      details: details.trim() || undefined,
      status: 'created',
      priority: urgent ? 'high' : 'normal',
      roomNumber: session.roomNumber,
      createdAt: new Date().toISOString(),
      optimistic: true,
    };

    await mutate(requestsKey(session.stayId), (current: ServiceRequest[] | undefined) => [optimistic, ...(current ?? [])], {
      revalidate: false,
    });

    try {
      const api = await getGuestApi();
      const created = await api.createRequest(session, {
        category,
        title,
        details: details.trim() || undefined,
        priority: urgent ? 'high' : 'normal',
      });
      await mutate(
        requestsKey(session.stayId),
        (current: ServiceRequest[] | undefined) => (current ?? []).map((r) => (r.id === tempId ? created : r)),
        { revalidate: false }
      );
      router.push(`/h/${hotel.slug}/requests/${created.id}?sent=1`);
    } catch (err) {
      await mutate(requestsKey(session.stayId), (current: ServiceRequest[] | undefined) => (current ?? []).filter((r) => r.id !== tempId), {
        revalidate: false,
      });
      setSubmitting(false);
      if (err instanceof GuestApiError && err.kind === 'expired') {
        clearSession();
        router.push(`/h/${hotel.slug}/rejoin?reason=expired`);
        return;
      }
      show({ tone: 'error', title: GUEST_COPY.request.error, action: { label: GUEST_COPY.common.retry, onClick: handleSubmit } });
    }
  }

  return (
    <div data-testid={GUEST_TID.request} className="flex flex-col gap-5 pb-24">
      <div>
        <h1 className="font-display text-display-md text-ink">{GUEST_COPY.request.title}</h1>
        <p className="text-sm text-ink-muted">{GUEST_COPY.request.subtitle}</p>
      </div>

      <RequestCategoryGrid selected={category} onSelect={selectCategory} />

      {category && (
        <div className="animate-rise flex flex-col gap-4">
          <div>
            <p className="mb-2 text-sm font-medium text-ink">{GUEST_COPY.request.whatDoYouNeed}</p>
            <div className="flex flex-wrap gap-2">
              {options.map((option) => (
                <Button
                  key={option.slug}
                  variant="chip"
                  pressed={presetSlug === option.slug}
                  onClick={() => setPresetSlug(option.slug)}
                  data-testid={GUEST_TID.requestPreset(option.slug)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="request-details" className="text-sm font-medium text-ink">
              {GUEST_COPY.request.details}
            </label>
            <div data-testid={GUEST_TID.requestDetails} className="mt-1.5">
              <Textarea
                id="request-details"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                maxLength={1000}
                placeholder={GUEST_COPY.item.note.placeholder}
              />
            </div>
            {needsDetails && <p className="mt-1 text-xs text-danger">{GUEST_COPY.request.detailsRequired}</p>}
          </div>

          <Button
            variant="chip"
            pressed={urgent}
            onClick={() => setUrgent((u) => !u)}
            data-testid={GUEST_TID.requestUrgent}
            className="self-start"
          >
            {GUEST_COPY.request.urgent}
          </Button>

          <Button
            variant="primary"
            size="lg"
            fullWidth
            loading={submitting}
            disabled={!title}
            onClick={handleSubmit}
            data-testid={GUEST_TID.requestSubmit}
          >
            {submitting ? GUEST_COPY.request.sending : GUEST_COPY.request.send}
          </Button>
        </div>
      )}
    </div>
  );
}
