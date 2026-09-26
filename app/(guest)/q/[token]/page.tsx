import { RejoinScreen } from '@/components/guest/rejoin-screen';
import { QrEntry } from '@/components/guest/qr-entry';

// Never statically generated for a token — the static shell is fine, the token itself only ever
// reaches the client (docs/m2/04 §2).
export function generateStaticParams() {
  return [];
}

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{4,128}$/;

export default async function QrEntryPage(props: PageProps<'/q/[token]'>) {
  const { token } = await props.params;

  if (!TOKEN_PATTERN.test(token)) {
    return <RejoinScreen reason="invalid" />;
  }

  return <QrEntry token={token} />;
}
