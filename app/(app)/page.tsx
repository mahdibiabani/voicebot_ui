import { LandingPage } from '@/components/landing-page';
import { getAppConfig } from '@/lib/utils';
import { headers } from 'next/headers';

export default async function Page() {
  const hdrs = await headers();
  const appConfig = await getAppConfig(hdrs);

  return <LandingPage appConfig={appConfig} />;
}
