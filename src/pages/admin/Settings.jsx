import { useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useSettingsStore } from '../../store/settingsStore';
import Button from '../../components/Button';
import Spinner from '../../components/Spinner';
import { useToast } from '../../components/Toast';

const inputClass =
  'w-full border border-[#0e1a12]/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c38]';

function TextField({ label, settingKey, values, onChange, type = 'text', placeholder }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-[#0e1a12] mb-1.5">{label}</label>
      <input
        type={type}
        value={values[settingKey] ?? ''}
        onChange={(e) => onChange(settingKey, e.target.value)}
        placeholder={placeholder}
        className={inputClass}
      />
    </div>
  );
}

function ToggleField({ label, settingKey, values, onChange }) {
  const enabled = values[settingKey] === 'true' || values[settingKey] === true;
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-sm font-medium text-[#0e1a12]">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => onChange(settingKey, enabled ? 'false' : 'true')}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#1a5c38] focus:ring-offset-1 ${
          enabled ? 'bg-[#1a5c38]' : 'bg-gray-200'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </label>
  );
}

function PaymentMethodSection({ method, label, values, onChange }) {
  const enabledKey = `${method}_enabled`;
  const numberKey = `${method}_number`;
  const enabled = values[enabledKey] === 'true' || values[enabledKey] === true;
  return (
    <div className="border border-[#0e1a12]/10 rounded-xl p-4 space-y-3">
      <ToggleField label={label} settingKey={enabledKey} values={values} onChange={onChange} />
      {enabled && (
        <TextField
          label={`${label} Number`}
          settingKey={numberKey}
          values={values}
          onChange={onChange}
          placeholder="01XXXXXXXXX"
        />
      )}
    </div>
  );
}

export default function Settings() {
  const { toast } = useToast();
  const fetchSettings = useSettingsStore((s) => s.fetchSettings);
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const logoInputRef = useRef(null);

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

  function handleChange(key, value) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function handleLogoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB.');
      return;
    }
    setLogoUploading(true);
    const ext = file.name.split('.').pop();
    const path = `logo-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from('settings')
      .upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) {
      toast.error('Logo upload failed.');
      setLogoUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from('settings').getPublicUrl(path);
    handleChange('logo_url', urlData.publicUrl);
    setLogoUploading(false);
    toast.success('Logo uploaded.');
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    const upserts = Object.entries(values)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([key, value]) => ({ key, value: String(value) }));

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

        {/* Store Information */}
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
          <h2 className="font-semibold text-[#0e1a12]">Store Information</h2>
          <TextField label="Store Name" settingKey="store_name" values={values} onChange={handleChange} placeholder="Altro Clothing" />
          <TextField label="Store Email" settingKey="store_email" values={values} onChange={handleChange} type="email" placeholder="support@altro.com" />
          <TextField label="Store Phone" settingKey="store_phone" values={values} onChange={handleChange} placeholder="+880…" />
          <TextField label="Store Address" settingKey="store_address" values={values} onChange={handleChange} placeholder="Full store address…" />

          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-semibold text-[#0e1a12] mb-1.5">Store Logo</label>
            {values.logo_url && (
              <img
                src={values.logo_url}
                alt="Logo preview"
                className="h-12 mb-3 object-contain rounded border border-[#0e1a12]/10 p-1"
              />
            )}
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={values.logo_url ?? ''}
                onChange={(e) => handleChange('logo_url', e.target.value)}
                placeholder="Logo URL or upload below"
                className={`flex-1 ${inputClass}`}
              />
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                disabled={logoUploading}
                className="shrink-0 border border-[#1a5c38] text-[#1a5c38] text-sm font-semibold px-3 py-2 rounded-lg hover:bg-[#1a5c38] hover:text-white transition-colors disabled:opacity-60"
              >
                {logoUploading ? 'Uploading…' : 'Upload'}
              </button>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
          <h2 className="font-semibold text-[#0e1a12]">Social Links</h2>
          <TextField label="Facebook URL" settingKey="facebook_url" values={values} onChange={handleChange} type="url" placeholder="https://facebook.com/…" />
          <TextField label="Instagram URL" settingKey="instagram_url" values={values} onChange={handleChange} type="url" placeholder="https://instagram.com/…" />
        </div>

        {/* Delivery Fees */}
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
          <h2 className="font-semibold text-[#0e1a12]">Delivery & Fees</h2>
          <TextField label="Dhaka Delivery Fee (৳)" settingKey="delivery_fee_dhaka" values={values} onChange={handleChange} type="number" placeholder="60" />
          <TextField label="Outside Dhaka Delivery Fee (৳)" settingKey="delivery_fee_outside" values={values} onChange={handleChange} type="number" placeholder="120" />
          <TextField label="Free Delivery Threshold (৳)" settingKey="free_delivery_threshold" values={values} onChange={handleChange} type="number" placeholder="999" />
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-[#0e1a12]">Payment Methods</h2>
          <p className="text-xs text-[#0e1a12]/50">Enable or disable payment methods shown to customers at checkout. Enter the merchant number customers should send payment to.</p>
          <PaymentMethodSection method="bkash" label="bKash" values={values} onChange={handleChange} />
          <PaymentMethodSection method="nagad" label="Nagad" values={values} onChange={handleChange} />
          <PaymentMethodSection method="rocket" label="Rocket" values={values} onChange={handleChange} />
          <div className="border border-[#0e1a12]/10 rounded-xl p-4">
            <ToggleField label="Cash on Delivery (COD)" settingKey="cod_enabled" values={values} onChange={handleChange} />
          </div>
        </div>

        {/* Announcement Bar */}
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-[#0e1a12]">Announcement Bar</h2>
          <ToggleField label="Show Announcement Bar" settingKey="announcement_bar_enabled" values={values} onChange={handleChange} />
          <TextField
            label="Announcement Text"
            settingKey="announcement_bar_text"
            values={values}
            onChange={handleChange}
            placeholder="Free delivery on orders over ৳999"
          />
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
