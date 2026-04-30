import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useSettingsStore } from '../../store/settingsStore';
import Button from '../../components/Button';
import Spinner from '../../components/Spinner';
import { useToast } from '../../components/Toast';

const SETTING_DEFINITIONS = [
  {
    key: 'store_name',
    label: 'Store Name',
    type: 'text',
    placeholder: 'Altro',
  },
  {
    key: 'store_phone',
    label: 'Support Phone',
    type: 'text',
    placeholder: '+880…',
  },
  {
    key: 'store_email',
    label: 'Support Email',
    type: 'email',
    placeholder: 'support@altro.com',
  },
  {
    key: 'dhaka_delivery_fee',
    label: 'Dhaka Delivery Fee (৳)',
    type: 'number',
    placeholder: '60',
  },
  {
    key: 'outside_dhaka_delivery_fee',
    label: 'Outside Dhaka Delivery Fee (৳)',
    type: 'number',
    placeholder: '120',
  },
  {
    key: 'free_delivery_threshold',
    label: 'Free Delivery Threshold (৳)',
    type: 'number',
    placeholder: '999',
  },
  {
    key: 'facebook_url',
    label: 'Facebook URL',
    type: 'url',
    placeholder: 'https://facebook.com/…',
  },
  {
    key: 'instagram_url',
    label: 'Instagram URL',
    type: 'url',
    placeholder: 'https://instagram.com/…',
  },
];

export default function Settings() {
  const { toast } = useToast();
  const fetchSettings = useSettingsStore((s) => s.fetchSettings);
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data } = await supabase.from('settings').select('*');
      const mapped = {};
      (data ?? []).forEach((row) => {
        mapped[row.key] = row.value ?? '';
      });
      setValues(mapped);
      setLoading(false);
    }
    load();
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    const upserts = Object.entries(values).map(([key, value]) => ({ key, value }));

    if (upserts.length > 0) {
      const { error } = await supabase
        .from('settings')
        .upsert(upserts, { onConflict: 'key' });
      if (error) {
        toast.error('Failed to save settings.');
        setSaving(false);
        return;
      }
    }

    // Also save any keys that don't exist yet
    const newEntries = SETTING_DEFINITIONS.filter(
      (d) => !(d.key in values) && values[d.key] !== undefined
    );
    if (newEntries.length > 0) {
      await supabase.from('settings').upsert(
        newEntries.map((d) => ({ key: d.key, value: values[d.key] ?? '' })),
        { onConflict: 'key' }
      );
    }

    // Invalidate store cache
    useSettingsStore.setState({ loaded: false });
    fetchSettings();
    toast.success('Settings saved.');
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto">
      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
          <h2 className="font-semibold text-[#0e1a12]">Store Information</h2>
          {SETTING_DEFINITIONS.slice(0, 3).map((def) => (
            <div key={def.key}>
              <label className="block text-sm font-semibold text-[#0e1a12] mb-1.5">
                {def.label}
              </label>
              <input
                type={def.type}
                value={values[def.key] ?? ''}
                onChange={(e) =>
                  setValues((v) => ({ ...v, [def.key]: e.target.value }))
                }
                placeholder={def.placeholder}
                className="w-full border border-[#0e1a12]/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c38]"
              />
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
          <h2 className="font-semibold text-[#0e1a12]">Delivery Fees</h2>
          {SETTING_DEFINITIONS.slice(3, 6).map((def) => (
            <div key={def.key}>
              <label className="block text-sm font-semibold text-[#0e1a12] mb-1.5">
                {def.label}
              </label>
              <input
                type={def.type}
                min="0"
                value={values[def.key] ?? ''}
                onChange={(e) =>
                  setValues((v) => ({ ...v, [def.key]: e.target.value }))
                }
                placeholder={def.placeholder}
                className="w-full border border-[#0e1a12]/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c38]"
              />
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
          <h2 className="font-semibold text-[#0e1a12]">Social Links</h2>
          {SETTING_DEFINITIONS.slice(6).map((def) => (
            <div key={def.key}>
              <label className="block text-sm font-semibold text-[#0e1a12] mb-1.5">
                {def.label}
              </label>
              <input
                type={def.type}
                value={values[def.key] ?? ''}
                onChange={(e) =>
                  setValues((v) => ({ ...v, [def.key]: e.target.value }))
                }
                placeholder={def.placeholder}
                className="w-full border border-[#0e1a12]/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c38]"
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <Button type="submit" loading={saving}>
            Save Settings
          </Button>
        </div>
      </form>
    </div>
  );
}
