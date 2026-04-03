import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { CheckCircle2, XCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

export function Toast({ message, type, onClose }: ToastProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    gsap.fromTo(
      ref.current,
      { x: 120, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.4, ease: 'power3.out' }
    );
    const timer = setTimeout(() => {
      if (ref.current) {
        gsap.to(ref.current, {
          x: 120,
          opacity: 0,
          duration: 0.35,
          ease: 'power2.in',
          onComplete: onClose,
        });
      }
    }, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  const isSuccess = type === 'success';

  return (
    <div
      ref={ref}
      className={`fixed top-20 right-5 z-[9999] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border backdrop-blur-xl max-w-sm
        ${isSuccess
          ? 'bg-green-50/95 border-green-200 text-green-800'
          : 'bg-red-50/95 border-red-200 text-red-800'
        }`}
    >
      {isSuccess
        ? <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
        : <XCircle className="w-5 h-5 text-red-500 shrink-0" />
      }
      <span className="text-sm font-semibold">{message}</span>
      <button
        onClick={onClose}
        className="ml-auto text-inherit opacity-50 hover:opacity-100 transition-opacity"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// Simple hook-based toast manager
import { useState, useCallback } from 'react';

interface ToastState {
  id: number;
  message: string;
  type: ToastType;
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastState[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const ToastContainer = () => (
    <>
      {toasts.map(t => (
        <Toast
          key={t.id}
          message={t.message}
          type={t.type}
          onClose={() => removeToast(t.id)}
        />
      ))}
    </>
  );

  return { showToast, ToastContainer };
}
