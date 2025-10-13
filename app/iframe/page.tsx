import { FloatingBot } from '@/components/floating-bot';
import { getAppConfig } from '@/lib/utils';
import { headers } from 'next/headers';

export default async function IframePage() {
  const hdrs = await headers();
  const appConfig = await getAppConfig(hdrs);

  return (
    <div className="min-h-screen bg-transparent">
      <FloatingBot appConfig={appConfig} />
    </div>
  );
}
