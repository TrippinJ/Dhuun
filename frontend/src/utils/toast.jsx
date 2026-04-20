/**
 * toast.js — Dhuun's central notification utility
 *
 * Single import for every component. Wraps react-toastify with
 * Dhuun-branded presets so we never scatter raw toast() calls around.
 *
 * React Native migration path:
 *   Swap the import below to react-native-toast-message and remap
 *   each function — all call sites stay identical.
 *
 * Usage:
 *   import { toast } from '../utils/toast';
 *   toast.success('Beat uploaded!');
 *   toast.cartAdd('Dark Vibes');
 *   toast.loginRequired(navigate);
 */

import { toast as _toast } from 'react-toastify';

// ─── Base config shared by all toasts ─────────────────────────────────────────
const BASE = {
  position:        'bottom-center',   // bottom-center feels native on mobile
  autoClose:       3500,
  hideProgressBar: false,
  closeOnClick:    true,
  pauseOnHover:    true,
  draggable:       true,
};

// ─── Short duration for confirmations ─────────────────────────────────────────
const QUICK = { ...BASE, autoClose: 2000 };

// ─── Longer for errors so user can read them ──────────────────────────────────
const LONG = { ...BASE, autoClose: 5000 };

// ─── Persistent — must be dismissed manually ──────────────────────────────────
const PERSIST = { ...BASE, autoClose: false };

// ─── Core types ───────────────────────────────────────────────────────────────
const success  = (msg, opts)  => _toast.success(msg,  { ...QUICK, ...opts });
const error    = (msg, opts)  => _toast.error(msg,    { ...LONG,  ...opts });
const warning  = (msg, opts)  => _toast.warning(msg,  { ...BASE,  ...opts });
const info     = (msg, opts)  => _toast.info(msg,     { ...BASE,  ...opts });
const loading  = (msg, opts)  => _toast.loading(msg,  { ...PERSIST, ...opts });
const dismiss  = (id)         => _toast.dismiss(id);
const update   = (id, opts)   => _toast.update(id, opts);

// ─── Domain-specific presets ──────────────────────────────────────────────────

/** Beat added to cart successfully */
const cartAdd = (beatTitle, licenseName) =>
  _toast.success(
    `"${beatTitle}" added to cart${licenseName ? ` — ${licenseName}` : ''}`,
    QUICK
  );

/** Beat already in cart with same license */
const cartDuplicate = (beatTitle, licenseName) =>
  _toast.warning(
    `"${beatTitle}" with ${licenseName} is already in your cart`,
    BASE
  );

/** User tried an action while not logged in */
const loginRequired = (navigate, msg = 'Please log in to continue') => {
  _toast.info(msg, {
    ...BASE,
    autoClose: 4000,
    onClick: () => navigate && navigate('/login'),
    style: { cursor: navigate ? 'pointer' : 'default' },
  });
};

/** Beat uploaded — shows what files were received */
const beatUploaded = (title, hasStems) =>
  _toast.success(
    `"${title}" uploaded — WAV ✓  Stems ${hasStems ? '✓' : '—'}`,
    { ...BASE, autoClose: 4500 }
  );

/** Generic async action with loading → success/error lifecycle */
const promise = (promiseFn, { loading: lMsg, success: sMsg, error: eMsg }) =>
  _toast.promise(promiseFn, {
    loading: lMsg || 'Working…',
    success: sMsg || 'Done!',
    error:   eMsg || 'Something went wrong',
  }, BASE);

// ─── Export ───────────────────────────────────────────────────────────────────
export const toast = {
  success,
  error,
  warning,
  info,
  loading,
  dismiss,
  update,
  promise,
  // domain presets
  cartAdd,
  cartDuplicate,
  loginRequired,
  beatUploaded,
};