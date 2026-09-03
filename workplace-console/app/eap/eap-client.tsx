'use client';

import { useState } from 'react';
import type { Incident } from '@/lib/types';
import { categoryLabel, daysUntil } from '@/components/IncidentCard';

function slaColor(days: number): string {
  if (days <= 3) return 'text-red-700 font-semibold';
  if (days <= 7) return 'text-amber-700 font-semibold';
  return 'text-gray-700';
}

export default function EAPQueueClient({ incidents }: { incidents: Incident[] }) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const onContact = async (incidentId: string) => {
    setBusyId(incidentId);
    setFlash(null);
    try {
      const res = await fetch('/api/eap/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incident_id: incidentId }),
      });
      const j = await res.json();
      if (res.ok) {
        setFlash(`Logged consent-contact for ${incidentId.slice(0, 8)}.`);
      } else {
        setFlash(`Error: ${j.error ?? res.status}`);
      }
    } catch (e) {
      setFlash(`Network error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusyId(null);
    }
  };

  if (incidents.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center bg-white">
        <p className="text-sm text-gray-600">No EAP-routed incidents.</p>
      </div>
    );
  }

  return (
    <>
      {flash && (
        <div className="mb-4 rounded-md bg-blue-50 border border-blue-200 text-blue-800 text-sm px-3 py-2">
          {flash}
        </div>
      )}
      <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left text-xs uppercase text-gray-600">
            <tr>
              <th className="px-4 py-2">ID</th>
              <th className="px-4 py-2">Category</th>
              <th className="px-4 py-2">Reported</th>
              <th className="px-4 py-2">SLA</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {incidents.map((i) => {
              const days = daysUntil(i.sla_deadline);
              return (
                <tr key={i.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2 font-mono text-xs">
                    {i.id.slice(0, 8)}
                  </td>
                  <td className="px-4 py-2">{categoryLabel(i.category)}</td>
                  <td className="px-4 py-2 text-xs text-gray-600">
                    {new Date(i.timestamp).toLocaleDateString()}
                  </td>
                  <td className={`px-4 py-2 ${slaColor(days)}`}>{days} days</td>
                  <td className="px-4 py-2 capitalize">{i.status}</td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => onContact(i.id)}
                      disabled={busyId === i.id}
                      className="px-3 py-1 text-xs rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-300"
                    >
                      {busyId === i.id ? 'Logging…' : 'Contact employee (consent)'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
