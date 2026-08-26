import { listStrategistsWithEmail } from '@/lib/strategists';
import { getCompany } from '@/lib/company';
import EstrategasClient from './EstrategasClient';

export const dynamic = 'force-dynamic';

export default async function EstrategasPage() {
  const [strategists, company] = await Promise.all([listStrategistsWithEmail(), getCompany()]);

  return (
    <EstrategasClient
      initialStrategists={strategists}
      companyName={company?.name ?? 'Hekko'}
    />
  );
}
