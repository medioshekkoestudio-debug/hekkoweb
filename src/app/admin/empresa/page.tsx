import { getCompany } from '@/lib/company';
import EmpresaClient from './EmpresaClient';

export const dynamic = 'force-dynamic';

export default async function EmpresaPage() {
  const company = await getCompany();

  if (!company) return null;

  return <EmpresaClient company={company} />;
}
