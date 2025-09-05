export type ClientStatus = 
  | 'waiting'      // Čeká
  | 'inquiry'      // Poptávka  
  | 'offer'        // Nabídka
  | 'completion'   // Kompletace
  | 'signing'      // Podpis
  | 'drawdown'     // Čerpání
  | 'completed'    // Vyřízeno
  | 'archived';    // Archiv

export interface ClientStatusConfig {
  id: ClientStatus;
  label: string;
  color: string;
  bgColor: string;
  icon: string;
  order: number;
}

export const CLIENT_STATUSES: ClientStatusConfig[] = [
  {
    id: 'waiting',
    label: 'Čeká',
    color: 'text-gray-700 dark:text-gray-300',
    bgColor: 'bg-gray-100 dark:bg-gray-700',
    icon: '⏳',
    order: 1
  },
  {
    id: 'inquiry',
    label: 'Poptávka',
    color: 'text-blue-700 dark:text-blue-300',
    bgColor: 'bg-blue-100 dark:bg-blue-900',
    icon: '📋',
    order: 2
  },
  {
    id: 'offer',
    label: 'Nabídka',
    color: 'text-purple-700 dark:text-purple-300',
    bgColor: 'bg-purple-100 dark:bg-purple-900',
    icon: '💰',
    order: 3
  },
  {
    id: 'completion',
    label: 'Kompletace',
    color: 'text-orange-700 dark:text-orange-300',
    bgColor: 'bg-orange-100 dark:bg-orange-900',
    icon: '📄',
    order: 4
  },
  {
    id: 'signing',
    label: 'Podpis',
    color: 'text-indigo-700 dark:text-indigo-300',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900',
    icon: '✍️',
    order: 5
  },
  {
    id: 'drawdown',
    label: 'Čerpání',
    color: 'text-green-700 dark:text-green-300',
    bgColor: 'bg-green-100 dark:bg-green-900',
    icon: '💳',
    order: 6
  },
  {
    id: 'completed',
    label: 'Vyřízeno',
    color: 'text-emerald-700 dark:text-emerald-300',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900',
    icon: '✅',
    order: 7
  },
  {
    id: 'archived',
    label: 'Archiv',
    color: 'text-slate-700 dark:text-slate-300',
    bgColor: 'bg-slate-100 dark:bg-slate-800',
    icon: '📦',
    order: 8
  }
];

export const getStatusConfig = (status: ClientStatus): ClientStatusConfig | undefined => {
  return CLIENT_STATUSES.find(s => s.id === status);
};
