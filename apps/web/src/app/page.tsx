import { Dashboard } from '../components/dashboard';
import { getDashboard, getSoftware } from '../lib/api';
export default async function Page() { const [data, software] = await Promise.all([getDashboard(), getSoftware()]); return <Dashboard data={data} software={software}/>; }
