import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCartStore } from './cartStore';
import { useSettings } from '../hooks/useSettings';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../utils/formatCurrency';
import { generateOrderNumber } from '../utils/generateOrderNumber';
import { InvoiceDownloadButton } from '../lib/Invoice';
import bkashLogo from '../assets/bkash.png';
import nagadLogo from '../assets/nagad.png';
import rocketLogo from '../assets/rocket.png';
import bankLogo from '../assets/bank.png';
import cashLogo from '../assets/cash.png';

// ─── Schemas ────────────────────────────────────────────────────────────────

const customerSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  phone: z.string().regex(/^01[3-9]\d{8}$/, 'Enter a valid Bangladesh mobile number'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().min(5, 'Enter your full address'),
  district: z.enum(['dhaka', 'outside'], { required_error: 'Select a district' }),
});

const paymentSchema = z.object({
  paymentMethod: z.enum(['bkash', 'nagad', 'rocket', 'bank', 'cod'], {
    required_error: 'Select a payment method',
  }),
  senderNumber: z.string().optional(),
  trxId: z.string().optional(),
  paymentNote: z.string().optional(),
}).superRefine((data, ctx) => {
  const mobileBanking = ['bkash', 'nagad', 'rocket'];
  if (mobileBanking.includes(data.paymentMethod)) {
    if (!data.senderNumber?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Sender number is required', path: ['senderNumber'] });
    }
    if (!data.trxId?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Transaction ID is required', path: ['trxId'] });
    }
  }
  if (data.paymentMethod === 'bank') {
    if (!data.senderNumber?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Depositor name is required', path: ['senderNumber'] });
    }
    if (!data.trxId?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Transaction reference is required', path: ['trxId'] });
    }
  }
});

const PAYMENT_LABELS = {
  bkash: 'bKash',
  nagad: 'Nagad',
  rocket: 'Rocket',
  bank: 'Bank Transfer',
  cod: 'Cash on Delivery',
};

// ─── Step Indicator ─────────────────────────────────────────────────────────

function StepIndicator({ step }) {
  const steps = ['Details', 'Payment', 'Review'];
  return (
    <div className="flex items-center justify-center gap-0 mb-6 px-4">
      {steps.map((label, idx) => {
        const num = idx + 1;
        const active = step === num;
        const done = step > num;
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  done
                    ? 'bg-[#1a5c38] text-white'
                    : active
                    ? 'bg-[#c9f230] text-[#0e1a12]'
                    : 'bg-[#1a5c38]/10 text-[#0e1a12]/40'
                }`}
              >
                {done ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  num
                )}
              </div>
              <span
                className={`text-xs font-medium ${
                  active ? 'text-[#1a5c38]' : 'text-[#0e1a12]/40'
                }`}
              >
                {label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={`w-12 sm:w-20 h-0.5 mx-1 mb-4 transition-colors ${
                  step > num ? 'bg-[#1a5c38]' : 'bg-[#1a5c38]/15'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Field error helper ──────────────────────────────────────────────────────
function FieldError({ message }) {
  if (!message) return null;
  return <p className="text-xs text-red-500 mt-1">{message}</p>;
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function CheckoutModal({ isOpen, onClose }) {
  const [step, setStep] = useState(1);
  const [customerData, setCustomerData] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [orderResult, setOrderResult] = useState(null);

  const { getSetting } = useSettings();
  const items = useCartStore((s) => s.items);
  const appliedCoupon = useCartStore((s) => s.appliedCoupon);
  const couponDiscount = useCartStore((s) => s.couponDiscount);
  const district = useCartStore((s) => s.district);
  const setDistrict = useCartStore((s) => s.setDistrict);
  const clearCart = useCartStore((s) => s.clearCart);

  const dhakaFee = Number(getSetting('delivery_fee_dhaka', 60));
  const outsideFee = Number(getSetting('delivery_fee_outside', 120));

  const subtotal = items.reduce((sum, i) => {
    const unitPrice = i.sale_price ?? i.price;
    return sum + unitPrice * i.qty;
  }, 0);

  const getDeliveryFee = (d) => (d === 'dhaka' ? dhakaFee : outsideFee);
  const deliveryFee = getDeliveryFee(customerData?.district ?? district);
  const total = subtotal - couponDiscount + deliveryFee;

  // Payment method settings — DB stores booleans as strings, coerce explicitly
  const toBool = (val, def) => (val === null || val === undefined) ? def : val === true || val === 'true';
  const bkashEnabled = toBool(getSetting('bkash_enabled'), true);
  const nagadEnabled = toBool(getSetting('nagad_enabled'), true);
  const rocketEnabled = toBool(getSetting('rocket_enabled'), false);
  const bankEnabled = toBool(getSetting('bank_enabled'), false);
  const codEnabled = toBool(getSetting('cod_enabled'), true);
  const bkashNumber = getSetting('bkash_number', '01XXXXXXXXX');
  const nagadNumber = getSetting('nagad_number', '01XXXXXXXXX');
  const rocketNumber = getSetting('rocket_number', '01XXXXXXXXX');
  const bankAccountHolder = getSetting('bank_account_holder', '');
  const bankAccountName = getSetting('bank_name', '');
  const bankAccountNumber = getSetting('bank_account_number', '');
  const bankBranch = getSetting('bank_branch', '');

  // Reset when closed
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep(1);
        setCustomerData(null);
        setPaymentData(null);
        setOrderResult(null);
        setSubmitting(false);
      }, 300);
    }
  }, [isOpen]);

  // Step 1 form
  const {
    register: reg1,
    handleSubmit: submit1,
    formState: { errors: err1 },
    watch: watch1,
    setValue: setValue1,
  } = useForm({
    resolver: zodResolver(customerSchema),
    defaultValues: { district: district ?? 'outside' },
  });

  // Sync district to cart when it changes in step 1
  const watchedDistrict = watch1('district');
  useEffect(() => {
    if (watchedDistrict) setDistrict(watchedDistrict);
  }, [watchedDistrict, setDistrict]);

  // Step 2 form
  const {
    register: reg2,
    handleSubmit: submit2,
    formState: { errors: err2 },
    watch: watch2,
    setValue: setValue2,
  } = useForm({ resolver: zodResolver(paymentSchema) });

  const selectedMethod = watch2('paymentMethod');

  const onStep1Submit = (data) => {
    setCustomerData(data);
    setStep(2);
  };

  const onStep2Submit = (data) => {
    setPaymentData(data);
    setStep(3);
  };

  const handlePlaceOrder = async () => {
    if (!customerData || !paymentData) return;
    setSubmitting(true);
    try {
      const orderNumber = generateOrderNumber();
      const fee = getDeliveryFee(customerData.district);
      const orderTotal = subtotal - couponDiscount + fee;

      const orderPayload = {
        order_number: orderNumber,
        customer_name: customerData.fullName,
        customer_phone: customerData.phone,
        customer_email: customerData.email || null,
        customer_address: customerData.address,
        district: customerData.district,
        items: JSON.stringify(items),
        subtotal,
        discount: couponDiscount,
        delivery_fee: fee,
        total: orderTotal,
        payment_method: paymentData.paymentMethod,
        payment_sender_number: paymentData.senderNumber || null,
        payment_trx_id: paymentData.trxId || null,
        payment_note: paymentData.paymentNote || null,
        coupon_code: appliedCoupon?.code || null,
        status: 'pending',
      };

      const { data: inserted, error: insertError } = await supabase
        .from('orders')
        .insert([orderPayload])
        .select();

      if (insertError) throw insertError;

      // Update coupon usage
      if (appliedCoupon) {
        await supabase
          .from('coupons')
          .update({ used_count: appliedCoupon.used_count + 1 })
          .eq('id', appliedCoupon.id);
      }

      // Decrement stock for each item
      for (const item of items) {
        const { data: prod } = await supabase
          .from('products')
          .select('stock')
          .eq('id', item.product_id)
          .single();
        if (prod) {
          await supabase
            .from('products')
            .update({ stock: Math.max(0, prod.stock - item.qty) })
            .eq('id', item.product_id);
        }
      }

      const fullOrder = {
        ...orderPayload,
        id: inserted?.[0]?.id,
        created_at: inserted?.[0]?.created_at ?? new Date().toISOString(),
      };

      clearCart();
      setOrderResult({ orderId: inserted?.[0]?.id, orderNumber, order: fullOrder });
    } catch (err) {
      console.error('Order placement failed:', err);
      alert('Failed to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const paymentMethods = [
    { key: 'bkash', label: 'bKash', enabled: bkashEnabled, number: bkashNumber, logo: bkashLogo },
    { key: 'nagad', label: 'Nagad', enabled: nagadEnabled, number: nagadNumber, logo: nagadLogo },
    { key: 'rocket', label: 'Rocket', enabled: rocketEnabled, number: rocketNumber, logo: rocketLogo },
    { key: 'bank', label: 'Bank Transfer', enabled: bankEnabled, number: null, logo: bankLogo },
    { key: 'cod', label: 'Cash on Delivery', enabled: codEnabled, number: null, logo: cashLogo },
  ].filter((m) => m.enabled);

  const isMobileBanking = (method) => ['bkash', 'nagad', 'rocket'].includes(method);
  const isBank = (method) => method === 'bank';

  if (!isOpen) return null;

  const content = (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={!submitting ? onClose : undefined} />

      {/* Modal */}
      <div className="relative bg-[#f5f2eb] w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1a5c38]/10 shrink-0">
          <h2 className="text-lg font-bold text-[#0e1a12]">
            {orderResult ? 'Order Confirmed!' : 'Checkout'}
          </h2>
          {!submitting && (
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-[#1a5c38]/10 transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5 text-[#0e1a12]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-5">
          {/* Success Screen */}
          {orderResult ? (
            <div className="flex flex-col items-center text-center gap-4 py-4">
              <div className="w-16 h-16 rounded-full bg-[#1a5c38] flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#0e1a12]">Order Placed!</h3>
                <p className="text-[#0e1a12]/60 text-sm mt-1">Thank you for your purchase.</p>
              </div>
              <div className="bg-white rounded-xl px-6 py-3 shadow-sm">
                <p className="text-xs text-[#0e1a12]/50 uppercase tracking-wide">Order Number</p>
                <p className="text-xl font-bold text-[#1a5c38] mt-1 tracking-wider">
                  {orderResult.orderNumber}
                </p>
              </div>
              <p className="text-sm text-[#0e1a12]/60">
                We'll process your order soon. You can track it using the order number above.
              </p>
              <InvoiceDownloadButton order={orderResult.order} />
              <button
                onClick={onClose}
                className="w-full py-3 border-2 border-[#1a5c38] text-[#1a5c38] font-semibold rounded-xl hover:bg-[#1a5c38] hover:text-white transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <>
              <StepIndicator step={step} />

              {/* STEP 1: Customer Details */}
              {step === 1 && (
                <form onSubmit={submit1(onStep1Submit)} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#0e1a12] mb-1.5">
                      Full Name *
                    </label>
                    <input
                      {...reg1('fullName')}
                      placeholder="Your full name"
                      className="w-full border border-[#1a5c38]/20 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#1a5c38] bg-white"
                    />
                    <FieldError message={err1.fullName?.message} />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#0e1a12] mb-1.5">
                      Phone Number *
                    </label>
                    <input
                      {...reg1('phone')}
                      type="tel"
                      placeholder="01XXXXXXXXX"
                      className="w-full border border-[#1a5c38]/20 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#1a5c38] bg-white"
                    />
                    <FieldError message={err1.phone?.message} />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#0e1a12] mb-1.5">
                      Email (optional)
                    </label>
                    <input
                      {...reg1('email')}
                      type="email"
                      placeholder="your@email.com"
                      className="w-full border border-[#1a5c38]/20 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#1a5c38] bg-white"
                    />
                    <FieldError message={err1.email?.message} />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#0e1a12] mb-1.5">
                      Delivery Address *
                    </label>
                    <textarea
                      {...reg1('address')}
                      rows={3}
                      placeholder="House/Flat, Road, Area, City"
                      className="w-full border border-[#1a5c38]/20 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#1a5c38] bg-white resize-none"
                    />
                    <FieldError message={err1.address?.message} />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#0e1a12] mb-2">
                      Delivery Area *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: 'dhaka', label: 'Dhaka', fee: dhakaFee },
                        { value: 'outside', label: 'Outside Dhaka', fee: outsideFee },
                      ].map((opt) => (
                        <label
                          key={opt.value}
                          className={`flex flex-col items-center p-3 rounded-xl border-2 cursor-pointer transition-all ${
                            watchedDistrict === opt.value
                              ? 'border-[#1a5c38] bg-[#1a5c38]/5'
                              : 'border-[#1a5c38]/15 hover:border-[#1a5c38]/40'
                          }`}
                        >
                          <input
                            type="radio"
                            value={opt.value}
                            {...reg1('district')}
                            className="sr-only"
                          />
                          <span className="font-semibold text-sm text-[#0e1a12]">{opt.label}</span>
                          <span className="text-xs text-[#1a5c38] mt-0.5">
                            {formatCurrency(opt.fee)}
                          </span>
                        </label>
                      ))}
                    </div>
                    <FieldError message={err1.district?.message} />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-[#1a5c38] text-white font-semibold rounded-xl hover:bg-[#2a7d50] transition-colors mt-2"
                  >
                    Continue to Payment
                  </button>
                </form>
              )}

              {/* STEP 2: Payment */}
              {step === 2 && (
                <form onSubmit={submit2(onStep2Submit)} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#0e1a12] mb-2">
                      Payment Method *
                    </label>
                    {paymentMethods.length === 0 ? (
                      <p className="text-sm text-[#0e1a12]/60">No payment methods available.</p>
                    ) : (
                      <div className="space-y-2">
                        {paymentMethods.map((method) => (
                          <label
                            key={method.key}
                            className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                              selectedMethod === method.key
                                ? 'border-[#1a5c38] bg-[#1a5c38]/5'
                                : 'border-[#1a5c38]/15 hover:border-[#1a5c38]/40'
                            }`}
                          >
                            <input
                              type="radio"
                              value={method.key}
                              {...reg2('paymentMethod')}
                              className="sr-only"
                            />
                            {method.logo ? (
                              <img
                                src={method.logo}
                                alt={method.label}
                                className="w-9 h-9 rounded-lg object-contain shrink-0 bg-white p-0.5 border border-[#0e1a12]/8"
                              />
                            ) : (
                              <span className={`w-9 h-9 rounded-lg ${method.color} text-white flex items-center justify-center text-xs font-bold shrink-0`}>
                                {method.label.slice(0, 1)}
                              </span>
                            )}
                            <div>
                              <p className="text-sm font-semibold text-[#0e1a12]">{method.label}</p>
                              {method.number && (
                                <p className="text-xs text-[#0e1a12]/50">
                                  Send to: {method.number}
                                </p>
                              )}
                            </div>
                            {selectedMethod === method.key && (
                              <svg className="w-4 h-4 text-[#1a5c38] ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </label>
                        ))}
                      </div>
                    )}
                    <FieldError message={err2.paymentMethod?.message} />
                  </div>

                  {/* Mobile banking instructions */}
                  {selectedMethod && isMobileBanking(selectedMethod) && (
                    <div className="bg-white rounded-xl p-4 shadow-sm space-y-3 border border-[#1a5c38]/10">
                      <p className="text-sm text-[#0e1a12]/70">
                        Please send{' '}
                        <strong className="text-[#1a5c38]">{formatCurrency(total)}</strong> to the{' '}
                        {paymentMethods.find((m) => m.key === selectedMethod)?.label} number above,
                        then enter your details below.
                      </p>
                      <div>
                        <label className="block text-xs font-semibold text-[#0e1a12] mb-1.5">
                          Your Sender Number *
                        </label>
                        <input
                          {...reg2('senderNumber')}
                          type="tel"
                          placeholder="01XXXXXXXXX"
                          className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1a5c38] bg-[#f5f2eb] ${err2.senderNumber ? 'border-red-400' : 'border-[#1a5c38]/20'}`}
                        />
                        <FieldError message={err2.senderNumber?.message} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#0e1a12] mb-1.5">
                          Transaction ID (TrxID) *
                        </label>
                        <input
                          {...reg2('trxId')}
                          placeholder="e.g. AB1234XXXX"
                          className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1a5c38] bg-[#f5f2eb] ${err2.trxId ? 'border-red-400' : 'border-[#1a5c38]/20'}`}
                        />
                        <FieldError message={err2.trxId?.message} />
                      </div>
                    </div>
                  )}

                  {/* Bank Transfer instructions */}
                  {selectedMethod && isBank(selectedMethod) && (
                    <div className="bg-white rounded-xl p-4 shadow-sm space-y-3 border border-[#1a5c38]/10">
                      {(bankAccountHolder || bankAccountName || bankAccountNumber || bankBranch) && (
                        <div className="bg-[#f5f2eb] rounded-lg p-3 space-y-1.5">
                          <p className="text-[10px] font-bold text-[#1a5c38] uppercase tracking-wider mb-2">
                            Transfer to this account:
                          </p>
                          {bankAccountHolder && (
                            <div className="flex justify-between text-sm">
                              <span className="text-[#0e1a12]/55">Account Holder</span>
                              <span className="font-semibold text-[#0e1a12]">{bankAccountHolder}</span>
                            </div>
                          )}
                          {bankAccountName && (
                            <div className="flex justify-between text-sm">
                              <span className="text-[#0e1a12]/55">Bank</span>
                              <span className="font-semibold text-[#0e1a12]">{bankAccountName}</span>
                            </div>
                          )}
                          {bankAccountNumber && (
                            <div className="flex justify-between text-sm">
                              <span className="text-[#0e1a12]/55">Account No.</span>
                              <span className="font-mono font-semibold text-[#0e1a12]">{bankAccountNumber}</span>
                            </div>
                          )}
                          {bankBranch && (
                            <div className="flex justify-between text-sm">
                              <span className="text-[#0e1a12]/55">Branch</span>
                              <span className="font-semibold text-[#0e1a12]">{bankBranch}</span>
                            </div>
                          )}
                        </div>
                      )}
                      <p className="text-sm text-[#0e1a12]/70">
                        Please transfer{' '}
                        <strong className="text-[#1a5c38]">{formatCurrency(total)}</strong> to the
                        account above, then enter your deposit details below.
                      </p>
                      <div>
                        <label className="block text-xs font-semibold text-[#0e1a12] mb-1.5">
                          Depositor Name *
                        </label>
                        <input
                          {...reg2('senderNumber')}
                          placeholder="Name used for the bank transfer"
                          className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1a5c38] bg-[#f5f2eb] ${err2.senderNumber ? 'border-red-400' : 'border-[#1a5c38]/20'}`}
                        />
                        <FieldError message={err2.senderNumber?.message} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#0e1a12] mb-1.5">
                          Transaction / Reference No. *
                        </label>
                        <input
                          {...reg2('trxId')}
                          placeholder="e.g. TXN1234567890"
                          className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1a5c38] bg-[#f5f2eb] ${err2.trxId ? 'border-red-400' : 'border-[#1a5c38]/20'}`}
                        />
                        <FieldError message={err2.trxId?.message} />
                      </div>
                    </div>
                  )}

                  {selectedMethod === 'cod' && (
                    <div className="bg-[#1a5c38]/5 border border-[#1a5c38]/20 rounded-xl p-4">
                      <p className="text-sm text-[#0e1a12]/70">
                        Pay <strong className="text-[#1a5c38]">{formatCurrency(total)}</strong> in
                        cash when your order is delivered.
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-[#0e1a12] mb-1.5">
                      Additional Note (optional)
                    </label>
                    <input
                      {...reg2('paymentNote')}
                      placeholder="Any note for your order"
                      className="w-full border border-[#1a5c38]/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1a5c38] bg-white"
                    />
                  </div>

                  <div className="flex gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex-1 py-3 border-2 border-[#1a5c38]/30 text-[#0e1a12] font-semibold rounded-xl hover:border-[#1a5c38] transition-colors"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 bg-[#1a5c38] text-white font-semibold rounded-xl hover:bg-[#2a7d50] transition-colors"
                    >
                      Review Order
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 3: Review */}
              {step === 3 && customerData && paymentData && (
                <div className="space-y-5">
                  {/* Customer Summary */}
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <h3 className="text-xs font-bold uppercase tracking-wide text-[#1a5c38] mb-3">
                      Delivery Details
                    </h3>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-[#0e1a12]/60">Name</span>
                        <span className="font-medium text-[#0e1a12]">{customerData.fullName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#0e1a12]/60">Phone</span>
                        <span className="font-medium text-[#0e1a12]">{customerData.phone}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-[#0e1a12]/60 shrink-0">Address</span>
                        <span className="font-medium text-[#0e1a12] text-right">{customerData.address}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#0e1a12]/60">Area</span>
                        <span className="font-medium text-[#0e1a12] capitalize">
                          {customerData.district === 'dhaka' ? 'Dhaka' : 'Outside Dhaka'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <h3 className="text-xs font-bold uppercase tracking-wide text-[#1a5c38] mb-3">
                      Order Items ({items.length})
                    </h3>
                    <ul className="space-y-2">
                      {items.map((item) => (
                        <li key={item.id} className="flex justify-between items-start text-sm">
                          <div>
                            <p className="font-medium text-[#0e1a12]">
                              {item.name}{' '}
                              <span className="text-[#0e1a12]/50">x{item.qty}</span>
                            </p>
                            {(item.color || item.size) && (
                              <p className="text-xs text-[#0e1a12]/40">
                                {[item.color, item.size].filter(Boolean).join(' · ')}
                              </p>
                            )}
                          </div>
                          <span className="font-semibold text-[#0e1a12]">
                            {formatCurrency((item.sale_price ?? item.price) * item.qty)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Payment */}
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <h3 className="text-xs font-bold uppercase tracking-wide text-[#1a5c38] mb-3">
                      Payment
                    </h3>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-[#0e1a12]/60">Method</span>
                        <span className="font-medium text-[#0e1a12]">
                          {PAYMENT_LABELS[paymentData.paymentMethod] ?? paymentData.paymentMethod}
                        </span>
                      </div>
                      {paymentData.senderNumber && (
                        <div className="flex justify-between">
                          <span className="text-[#0e1a12]/60">
                            {paymentData.paymentMethod === 'bank' ? 'Depositor Name' : 'Sender No.'}
                          </span>
                          <span className="font-medium text-[#0e1a12]">{paymentData.senderNumber}</span>
                        </div>
                      )}
                      {paymentData.trxId && (
                        <div className="flex justify-between">
                          <span className="text-[#0e1a12]/60">
                            {paymentData.paymentMethod === 'bank' ? 'Transaction Ref.' : 'TrxID'}
                          </span>
                          <span className="font-medium text-[#0e1a12]">{paymentData.trxId}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <h3 className="text-xs font-bold uppercase tracking-wide text-[#1a5c38] mb-3">
                      Order Summary
                    </h3>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between text-[#0e1a12]/70">
                        <span>Subtotal</span>
                        <span>{formatCurrency(subtotal)}</span>
                      </div>
                      {couponDiscount > 0 && (
                        <div className="flex justify-between text-green-700">
                          <span>Discount{appliedCoupon ? ` (${appliedCoupon.code})` : ''}</span>
                          <span>-{formatCurrency(couponDiscount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-[#0e1a12]/70">
                        <span>Delivery</span>
                        <span>{formatCurrency(deliveryFee)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-base text-[#0e1a12] pt-2 border-t border-[#1a5c38]/10">
                        <span>Total</span>
                        <span>{formatCurrency(total)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      disabled={submitting}
                      className="flex-1 py-3 border-2 border-[#1a5c38]/30 text-[#0e1a12] font-semibold rounded-xl hover:border-[#1a5c38] transition-colors disabled:opacity-50"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handlePlaceOrder}
                      disabled={submitting}
                      className="flex-1 py-3 bg-[#1a5c38] text-white font-bold rounded-xl hover:bg-[#2a7d50] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Placing…
                        </>
                      ) : (
                        'Place Order'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
