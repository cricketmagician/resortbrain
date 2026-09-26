import type { Metadata } from 'next';
import { RejoinScreen } from '@/components/guest/rejoin-screen';

export const metadata: Metadata = { title: 'Reconnect your stay' };

export default function GenericRejoinPage() {
  return <RejoinScreen />;
}
