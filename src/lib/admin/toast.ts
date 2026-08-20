import toast from "react-hot-toast";

// Design tokens dari website IPAN STORE
const styles = {
  success: {
    background: "linear-gradient(135deg, #0a0a0a 0%, #111111 100%)",
    border: "1px solid rgba(34, 197, 94, 0.3)",
    boxShadow: "0 0 20px rgba(34, 197, 94, 0.15), 0 4px 12px rgba(0, 0, 0, 0.5)",
  },
  error: {
    background: "linear-gradient(135deg, #0a0a0a 0%, #111111 100%)",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    boxShadow: "0 0 20px rgba(239, 68, 68, 0.15), 0 4px 12px rgba(0, 0, 0, 0.5)",
  },
};

type EntityType = "service" | "testimonial" | "faq" | "promo";

interface SuccessToastOptions {
  type: EntityType;
  action: "create" | "update" | "delete" | "approve" | "reject";
  customTitle?: string;
  customDescription?: string;
}

const actionText = {
  create: "ditambahkan",
  update: "diperbarui",
  delete: "dihapus",
  approve: "disetujui",
  reject: "ditolak",
};

const entityText = {
  service: "Layanan",
  testimonial: "Testimoni",
  faq: "FAQ",
  promo: "Promo",
};

const entityIcon = {
  service: "📦",
  testimonial: "💬",
  faq: "❓",
  promo: "🏷️",
};

/**
 * Tampilkan toast sukses dengan design yang sesuai website IPAN STORE.
 * Menggunakan react-hot-toast dengan custom styling dark gaming theme.
 */
export function showSuccessToast({ type, action, customTitle, customDescription }: SuccessToastOptions) {
  const entity = entityText[type];
  const actionStr = actionText[action];
  const icon = entityIcon[type];

  toast.success(
    `${icon} ${customTitle || `${entity} berhasil ${actionStr}`}`,
    {
      duration: 4000,
      style: {
        background: styles.success.background,
        border: styles.success.border,
        boxShadow: styles.success.boxShadow,
        color: "#f4f4f5",
        fontFamily: "'Inter', system-ui, sans-serif",
        padding: "16px",
        borderRadius: "12px",
      },
    }
  );
}

/**
 * Tampilkan toast error dengan design yang sesuai website IPAN STORE.
 */
export function showErrorToast(title: string, description?: string) {
  toast.error(
    description ? `❌ ${title}: ${description}` : `❌ ${title}`,
    {
      duration: 5000,
      style: {
        background: styles.error.background,
        border: styles.error.border,
        boxShadow: styles.error.boxShadow,
        color: "#f4f4f5",
        fontFamily: "'Inter', system-ui, sans-serif",
        padding: "16px",
        borderRadius: "12px",
      },
    }
  );
}

// Export individual helpers untuk kemudahan
export const toastService = {
  created: () => showSuccessToast({ type: "service", action: "create" }),
  updated: () => showSuccessToast({ type: "service", action: "update" }),
  deleted: () => showSuccessToast({ type: "service", action: "delete" }),
};

export const toastTestimonial = {
  created: () => showSuccessToast({ type: "testimonial", action: "create" }),
  updated: () => showSuccessToast({ type: "testimonial", action: "update" }),
  deleted: () => showSuccessToast({ type: "testimonial", action: "delete" }),
  approved: () => showSuccessToast({ type: "testimonial", action: "approve" }),
  rejected: () => showSuccessToast({ type: "testimonial", action: "reject" }),
};

export const toastFaq = {
  created: () => showSuccessToast({ type: "faq", action: "create" }),
  updated: () => showSuccessToast({ type: "faq", action: "update" }),
  deleted: () => showSuccessToast({ type: "faq", action: "delete" }),
};

export const toastPromo = {
  created: () => showSuccessToast({ type: "promo", action: "create" }),
  updated: () => showSuccessToast({ type: "promo", action: "update" }),
  deleted: () => showSuccessToast({ type: "promo", action: "delete" }),
};
